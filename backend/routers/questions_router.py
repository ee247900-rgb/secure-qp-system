from fastapi import APIRouter, Depends, HTTPException, status
from backend.db.supabase_client import get_supabase
from backend.auth.dependencies import get_current_user
from backend.auth.rbac import require_role
from backend.services import audit_service
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/questions", tags=["questions"])

class QuestionCreate(BaseModel):
    subject_id: str
    exam_id: str
    question_text: str
    marks: int
    difficulty: str
    topic: str
    question_type: str
    options: Optional[List[str]] = None

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    marks: Optional[int] = None
    difficulty: Optional[str] = None
    topic: Optional[str] = None
    options: Optional[List[str]] = None

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_question(question: QuestionCreate, current_user: dict = Depends(require_role("SETTER"))):
    """Setter creates a new question."""
    supabase = get_supabase()
    try:
        data = question.dict()
        data["setter_id"] = current_user["user_id"]
        data["status"] = "DRAFT"
        res = supabase.table("questions").insert(data).execute()
        audit_service.log_event("QUESTION_CREATE", current_user["user_id"], "question", res.data[0]["id"], {})
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
async def list_questions(current_user: dict = Depends(get_current_user)):
    """List questions filtered by role."""
    supabase = get_supabase()
    role = current_user.get("role")
    query = supabase.table("questions").select("*")
    if role == "SETTER":
        query = query.eq("setter_id", current_user["user_id"])
    elif role == "REVIEWER":
        query = query.eq("status", "SUBMITTED")
    elif role == "COMPILER":
        query = query.eq("status", "APPROVED")
    elif role == "ADMIN":
        pass
    else:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        res = query.execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{question_id}")
async def get_question(question_id: str, current_user: dict = Depends(get_current_user)):
    """Get single question."""
    supabase = get_supabase()
    try:
        res = supabase.table("questions").select("*").eq("id", question_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Question not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{question_id}")
async def update_question(question_id: str, question: QuestionUpdate, current_user: dict = Depends(require_role("SETTER"))):
    """Setter edits own DRAFT question."""
    supabase = get_supabase()
    try:
        check = supabase.table("questions").select("setter_id", "status").eq("id", question_id).execute()
        if not check.data or check.data[0]["setter_id"] != current_user["user_id"] or check.data[0]["status"] != "DRAFT":
            raise HTTPException(status_code=403, detail="Not allowed to edit this question")
        
        update_data = {k: v for k, v in question.dict().items() if v is not None}
        res = supabase.table("questions").update(update_data).eq("id", question_id).execute()
        audit_service.log_event("QUESTION_UPDATE", current_user["user_id"], "question", question_id, {})
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{question_id}/submit")
async def submit_question(question_id: str, current_user: dict = Depends(require_role("SETTER"))):
    """Setter submits question for review."""
    supabase = get_supabase()
    try:
        check = supabase.table("questions").select("setter_id", "status").eq("id", question_id).execute()
        if not check.data or check.data[0]["setter_id"] != current_user["user_id"] or check.data[0]["status"] != "DRAFT":
            raise HTTPException(status_code=403, detail="Not allowed to submit this question")
            
        res = supabase.table("questions").update({"status": "SUBMITTED"}).eq("id", question_id).execute()
        audit_service.log_event("QUESTION_SUBMIT", current_user["user_id"], "question", question_id, {})
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{question_id}")
async def delete_question(question_id: str, current_user: dict = Depends(require_role("SETTER"))):
    """Setter deletes own DRAFT question."""
    supabase = get_supabase()
    try:
        check = supabase.table("questions").select("setter_id", "status").eq("id", question_id).execute()
        if not check.data or check.data[0]["setter_id"] != current_user["user_id"] or check.data[0]["status"] != "DRAFT":
            raise HTTPException(status_code=403, detail="Not allowed to delete this question")
            
        supabase.table("questions").delete().eq("id", question_id).execute()
        audit_service.log_event("QUESTION_DELETE", current_user["user_id"], "question", question_id, {})
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
