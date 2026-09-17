from fastapi import APIRouter, Depends, HTTPException, status
from backend.db.supabase_client import get_supabase
from backend.auth.dependencies import get_current_user
from backend.auth.rbac import require_role
from backend.services import audit_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

class ReviewSubmit(BaseModel):
    question_id: str
    status: str
    comments: str

@router.get("/queue")
async def get_review_queue(current_user: dict = Depends(require_role("REVIEWER"))):
    """Reviewer gets their review queue (SUBMITTED questions, stripped identity)."""
    supabase = get_supabase()
    try:
        res = supabase.table("questions").select("id, subject_id, exam_id, question_text, marks, difficulty, topic, question_type, options, status").eq("status", "SUBMITTED").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("")
async def submit_review(review: ReviewSubmit, current_user: dict = Depends(require_role("REVIEWER"))):
    """Reviewer submits review and updates question status."""
    supabase = get_supabase()
    try:
        if review.status not in ["APPROVED", "REJECTED", "CHANGES_REQUESTED"]:
            raise HTTPException(status_code=400, detail="Invalid status")
            
        review_data = {
            "reviewer_id": current_user["user_id"],
            "question_id": review.question_id,
            "status": review.status,
            "comments": review.comments
        }
        res = supabase.table("reviews").insert(review_data).execute()
        supabase.table("questions").update({"status": review.status}).eq("id", review.question_id).execute()
        audit_service.log_event("REVIEW_SUBMIT", current_user["user_id"], "review", res.data[0]["id"], {"question_id": review.question_id, "status": review.status})
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/my-reviews")
async def get_my_reviews(current_user: dict = Depends(require_role("REVIEWER"))):
    """Reviewer sees their past reviews."""
    supabase = get_supabase()
    try:
        res = supabase.table("reviews").select("*").eq("reviewer_id", current_user["user_id"]).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/question/{question_id}")
async def get_question_reviews(question_id: str, current_user: dict = Depends(get_current_user)):
    """Get all reviews for a question."""
    supabase = get_supabase()
    try:
        res = supabase.table("reviews").select("*").eq("question_id", question_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
