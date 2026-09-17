from fastapi import APIRouter, Depends, HTTPException, status
from backend.db.supabase_client import get_supabase
from backend.auth.dependencies import get_current_user
from backend.auth.rbac import require_role
from backend.services import (
    compiler_service, hash_service, signature_service, 
    crypto_service, shamir_service, audit_service
)

router = APIRouter(prefix="/api/exams", tags=["compiler"])

@router.post("/{exam_id}/compile")
async def compile_exam(exam_id: str, current_user: dict = Depends(require_role("COMPILER"))):
    """Compile paper, encrypt, split keys."""
    supabase = get_supabase()
    try:
        # 1. Fetch APPROVED questions
        q_res = supabase.table("questions").select("*").eq("exam_id", exam_id).eq("status", "APPROVED").execute()
        questions = q_res.data
        if not questions:
            raise HTTPException(status_code=400, detail="No approved questions found for this exam")
            
        # 2. Compile paper to PDF
        pdf_bytes = compiler_service.compile_paper(questions)
        
        # 3. Compute Hash
        paper_hash = hash_service.compute_hash(pdf_bytes)
        
        # 4. Sign Hash
        signature = signature_service.sign_data(paper_hash)
        
        # 5. Generate DEK
        dek = crypto_service.generate_data_key()
        
        # 6. Encrypt Paper
        encrypted_pdf = crypto_service.encrypt_paper(pdf_bytes, dek)
        
        # 7. Upload Encrypted PDF
        file_path = f"exams/{exam_id}/encrypted_paper.pdf"
        supabase.storage.from_("encrypted-papers").upload(file_path, encrypted_pdf)
        
        # 8. Split Secret
        shares = shamir_service.split_secret(dek, n=5, t=3)
        
        # 9. Store Shares (Assign to keyholders)
        kh_res = supabase.table("exam_keyholders").select("user_id").eq("exam_id", exam_id).execute()
        keyholders = kh_res.data
        if len(keyholders) < 5:
            raise HTTPException(status_code=400, detail="Insufficient key holders assigned")
            
        for i, share in enumerate(shares[:5]):
            supabase.table("key_shares").insert({
                "exam_id": exam_id,
                "user_id": keyholders[i]["user_id"],
                "share_index": i + 1,
                "share_data": share,
                "status": "ISSUED"
            }).execute()
            
        # 10. Update Exam Status
        supabase.table("exams").update({"status": "KEYS_SPLIT", "paper_hash": paper_hash, "signature": signature, "paper_path": file_path}).eq("id", exam_id).execute()
        
        # 11. Log Audit Events
        audit_service.log_event("COMPILATION", current_user["user_id"], "exam", exam_id, {})
        audit_service.log_event("ENCRYPTION", current_user["user_id"], "exam", exam_id, {})
        audit_service.log_event("KEY_SPLIT", current_user["user_id"], "exam", exam_id, {})
        
        # 12. Return
        return {"paper_hash": paper_hash, "signature": signature, "share_count": len(shares)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{exam_id}/compilation-status")
async def get_compilation_status(exam_id: str, current_user: dict = Depends(get_current_user)):
    """Get compilation status."""
    supabase = get_supabase()
    try:
        res = supabase.table("exams").select("status, paper_hash, signature").eq("id", exam_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
