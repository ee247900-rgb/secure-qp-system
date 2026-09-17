from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from backend.db.supabase_client import get_supabase
from backend.auth.rbac import require_role
from backend.services import audit_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])

class ExamCreate(BaseModel):
    title: str
    subject_id: str
    exam_date: str
    release_time: str
    timezone: str

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject_id: Optional[str] = None
    exam_date: Optional[str] = None
    release_time: Optional[str] = None
    timezone: Optional[str] = None
    status: Optional[str] = None

@router.get("/users")
async def list_users(current_user: dict = Depends(require_role("ADMIN"))):
    """List all users."""
    supabase = get_supabase()
    try:
        res = supabase.table("profiles").select("*").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str = Body(embed=True), current_user: dict = Depends(require_role("ADMIN"))):
    """Assign/change a user's role."""
    supabase = get_supabase()
    try:
        res = supabase.table("profiles").update({"role": role}).eq("id", user_id).execute()
        audit_service.log_event("ROLE_CHANGE", current_user["user_id"], "user", user_id, {"new_role": role})
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/exams")
async def create_exam(exam: ExamCreate, current_user: dict = Depends(require_role("ADMIN"))):
    """Create new exam."""
    supabase = get_supabase()
    try:
        data = exam.dict()
        data["status"] = "PLANNED"
        res = supabase.table("exams").insert(data).execute()
        audit_service.log_event("EXAM_CREATE", current_user["user_id"], "exam", res.data[0]["id"], {})
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/exams")
async def list_exams(current_user: dict = Depends(require_role("ADMIN"))):
    """List all exams."""
    supabase = get_supabase()
    try:
        res = supabase.table("exams").select("*").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/exams/{exam_id}")
async def update_exam(exam_id: str, exam: ExamUpdate, current_user: dict = Depends(require_role("ADMIN"))):
    """Update exam details."""
    supabase = get_supabase()
    try:
        data = {k: v for k, v in exam.dict().items() if v is not None}
        res = supabase.table("exams").update(data).eq("id", exam_id).execute()
        audit_service.log_event("EXAM_UPDATE", current_user["user_id"], "exam", exam_id, {})
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/exams/{exam_id}/assign-keyholders")
async def assign_keyholders(exam_id: str, user_ids: List[str] = Body(embed=True), current_user: dict = Depends(require_role("ADMIN"))):
    """Assign key holder users to an exam."""
    supabase = get_supabase()
    try:
        for uid in user_ids:
            supabase.table("exam_keyholders").insert({"exam_id": exam_id, "user_id": uid}).execute()
        audit_service.log_event("ASSIGN_KEYHOLDERS", current_user["user_id"], "exam", exam_id, {"user_ids": user_ids})
        return {"message": "Keyholders assigned successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/exams/{exam_id}/assign-centres")
async def assign_centres(exam_id: str, user_ids: List[str] = Body(embed=True), current_user: dict = Depends(require_role("ADMIN"))):
    """Assign exam centres to an exam."""
    supabase = get_supabase()
    try:
        for uid in user_ids:
            supabase.table("exam_centres").insert({"exam_id": exam_id, "user_id": uid}).execute()
        audit_service.log_event("ASSIGN_CENTRES", current_user["user_id"], "exam", exam_id, {"user_ids": user_ids})
        return {"message": "Centres assigned successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(require_role("ADMIN"))):
    """Dashboard stats."""
    supabase = get_supabase()
    try:
        users = supabase.table("profiles").select("role").execute()
        exams = supabase.table("exams").select("status").execute()
        
        users_by_role = {}
        for u in users.data:
            users_by_role[u["role"]] = users_by_role.get(u["role"], 0) + 1
            
        exams_by_status = {}
        for e in exams.data:
            exams_by_status[e["status"]] = exams_by_status.get(e["status"], 0) + 1
            
        return {
            "users_by_role": users_by_role,
            "exams_by_status": exams_by_status,
            "recent_events": [],
            "active_anomalies": 0
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/lockdown")
async def emergency_lockdown(current_user: dict = Depends(require_role("ADMIN"))):
    """Emergency lockdown."""
    supabase = get_supabase()
    try:
        supabase.table("exams").update({"status": "LOCKED"}).neq("status", "RELEASED").execute()
        audit_service.log_event("LOCKDOWN", current_user["user_id"], "system", "all", {})
        return {"message": "System lockdown initiated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
