from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from backend.db.supabase_client import get_supabase
from backend.auth.dependencies import get_current_user
from backend.auth.rbac import require_role
from backend.services import (
    timelock_service, shamir_service, crypto_service, 
    hash_service, signature_service, watermark_service, audit_service
)
import uuid

router = APIRouter(prefix="/api/release", tags=["release"])

@router.post("/{exam_id}")
async def attempt_release(exam_id: str, current_user: dict = Depends(require_role("ADMIN"))):
    """Attempt time-locked release."""
    supabase = get_supabase()
    try:
        exam_res = supabase.table("exams").select("*").eq("id", exam_id).execute()
        if not exam_res.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        exam = exam_res.data[0]
        
        # 1. Check release allowed
        if not timelock_service.check_release_allowed(exam["release_time"]):
            raise HTTPException(status_code=400, detail="Cannot release before scheduled time")
            
        # 2. Check quorum
        shares_res = supabase.table("key_shares").select("share_data").eq("exam_id", exam_id).eq("status", "SUBMITTED").execute()
        if len(shares_res.data) < 3:
            raise HTTPException(status_code=400, detail="Insufficient shares submitted for quorum")
            
        # 3. Reconstruct DEK
        shares = [s["share_data"] for s in shares_res.data]
        dek = shamir_service.reconstruct_secret(shares)
        
        # 4. Download paper
        encrypted_pdf = supabase.storage.from_("encrypted-papers").download(exam["paper_path"])
        
        # 5. Decrypt
        pdf_bytes = crypto_service.decrypt_paper(encrypted_pdf, dek)
        
        # 6. Verify hash
        if not hash_service.verify_hash(pdf_bytes, exam["paper_hash"]):
            raise HTTPException(status_code=400, detail="Paper hash verification failed")
            
        # 7. Verify signature
        if not signature_service.verify_signature(exam["paper_hash"], exam["signature"]):
            raise HTTPException(status_code=400, detail="Signature verification failed")
            
        # 8. Update status
        supabase.table("exams").update({"status": "RELEASED"}).eq("id", exam_id).execute()
        
        # 9. Log
        audit_service.log_event("RELEASE_SUCCESS", current_user["user_id"], "exam", exam_id, {})
        
        return {"message": "Paper released successfully"}
    except Exception as e:
        audit_service.log_event("RELEASE_ATTEMPT", current_user["user_id"], "exam", exam_id, {"error": str(e)})
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{exam_id}/download")
async def download_paper(exam_id: str, current_user: dict = Depends(require_role("CENTRE"))):
    """Centre downloads watermarked paper."""
    supabase = get_supabase()
    try:
        exam_res = supabase.table("exams").select("*").eq("id", exam_id).execute()
        if not exam_res.data or exam_res.data[0]["status"] != "RELEASED":
            raise HTTPException(status_code=400, detail="Exam not available for download")
        exam = exam_res.data[0]
        
        # Verify centre assigned
        centre_res = supabase.table("exam_centres").select("*").eq("exam_id", exam_id).eq("user_id", current_user["user_id"]).execute()
        if not centre_res.data:
            raise HTTPException(status_code=403, detail="Centre not assigned to this exam")
            
        # Time check
        if not timelock_service.is_within_download_window(exam["release_time"]):
            raise HTTPException(status_code=400, detail="Outside download window")
            
        # Reconstruct DEK & Decrypt
        shares_res = supabase.table("key_shares").select("share_data").eq("exam_id", exam_id).eq("status", "SUBMITTED").execute()
        shares = [s["share_data"] for s in shares_res.data]
        dek = shamir_service.reconstruct_secret(shares)
        
        encrypted_pdf = supabase.storage.from_("encrypted-papers").download(exam["paper_path"])
        pdf_bytes = crypto_service.decrypt_paper(encrypted_pdf, dek)
        
        # Watermark
        dist_id = str(uuid.uuid4())
        watermark_text = f"CENTRE:{current_user['user_id']} DIST:{dist_id}"
        watermarked_pdf = watermark_service.apply_watermark(pdf_bytes, watermark_text)
        
        # Log & Record
        supabase.table("watermarks").insert({"exam_id": exam_id, "centre_id": current_user["user_id"], "distribution_id": dist_id}).execute()
        audit_service.log_event("DOWNLOAD", current_user["user_id"], "exam", exam_id, {"distribution_id": dist_id})
        
        return Response(content=watermarked_pdf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=exam_{exam_id}.pdf"})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{exam_id}/status")
async def get_release_status(exam_id: str, current_user: dict = Depends(get_current_user)):
    """Get release status."""
    supabase = get_supabase()
    try:
        exam_res = supabase.table("exams").select("status, release_time").eq("id", exam_id).execute()
        if not exam_res.data:
            raise HTTPException(status_code=404, detail="Exam not found")
            
        shares_res = supabase.table("key_shares").select("status").eq("exam_id", exam_id).execute()
        submitted = sum(1 for s in shares_res.data if s["status"] == "SUBMITTED")
        
        return {
            "status": exam_res.data[0]["status"],
            "release_time": exam_res.data[0]["release_time"],
            "quorum_submitted": submitted,
            "quorum_total": len(shares_res.data)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
