from fastapi import APIRouter, Depends, HTTPException, status, Body
from backend.db.supabase_client import get_supabase
from backend.auth.dependencies import get_current_user
from backend.auth.rbac import require_role
from backend.services import audit_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/keys", tags=["keys"])

class SubmitShareReq(BaseModel):
    exam_id: str
    password: str

@router.get("/my-shares")
async def get_my_shares(current_user: dict = Depends(require_role("KEY_HOLDER"))):
    """Key Holder sees assigned shares (metadata only)."""
    supabase = get_supabase()
    try:
        res = supabase.table("key_shares").select("id, exam_id, share_index, status").eq("user_id", current_user["user_id"]).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/submit")
async def submit_share(req: SubmitShareReq, current_user: dict = Depends(require_role("KEY_HOLDER"))):
    """Key Holder submits their share for reconstruction."""
    supabase = get_supabase()
    try:
        # Re-authenticate
        auth_res = supabase.auth.sign_in_with_password({"email": current_user["email"], "password": req.password})
        if not auth_res.user:
            raise HTTPException(status_code=401, detail="Invalid password")
            
        # Update share status
        res = supabase.table("key_shares").update({"status": "SUBMITTED"}).eq("user_id", current_user["user_id"]).eq("exam_id", req.exam_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Share not found for this exam")
            
        audit_service.log_event("KEY_SUBMIT", current_user["user_id"], "share", res.data[0]["id"], {"exam_id": req.exam_id})
        return {"message": "Share submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/quorum/{exam_id}")
async def check_quorum(exam_id: str, current_user: dict = Depends(get_current_user)):
    """Check quorum status (for Key Holders and Admin)."""
    if current_user["role"] not in ["KEY_HOLDER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    supabase = get_supabase()
    try:
        res = supabase.table("key_shares").select("status").eq("exam_id", exam_id).execute()
        submitted = sum(1 for s in res.data if s["status"] == "SUBMITTED")
        total = len(res.data)
        return {"exam_id": exam_id, "submitted": submitted, "total": total, "quorum_reached": submitted >= 3}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
