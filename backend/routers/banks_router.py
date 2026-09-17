from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
import uuid
import secrets
from backend.db.supabase_client import get_supabase
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/banks", tags=["question-banks"])

class BankCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    is_public: Optional[bool] = False

class BankJoinRequest(BaseModel):
    code: str

class QuestionAddRequest(BaseModel):
    content: str
    subject_id: Optional[str] = None
    question_type: str  # MCQ, SHORT, LONG
    options: Optional[list] = None
    correct_answer: str
    marks: int
    difficulty: str  # EASY, MEDIUM, HARD

@router.post("")
async def create_question_bank(req: BankCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a new Multi-Person Question Bank Network."""
    supabase = get_supabase()
    try:
        # Generate unique 8-char invite code e.g. BANK-A9X2
        bank_code = f"BANK-{secrets.token_hex(3).upper()}"
        
        bank_id = str(uuid.uuid4())
        bank_data = {
            "id": bank_id,
            "name": req.name,
            "description": req.description,
            "code": bank_code,
            "owner_id": current_user["user_id"],
            "is_public": req.is_public
        }
        
        # Insert bank
        b_res = supabase.table("question_banks").insert(bank_data).execute()
        
        # Add owner as OWNER member
        supabase.table("question_bank_members").insert({
            "bank_id": bank_id,
            "user_id": current_user["user_id"],
            "role": "OWNER"
        }).execute()
        
        return {**bank_data, "invite_code": bank_code}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
async def list_question_banks(current_user: dict = Depends(get_current_user)):
    """List all Question Bank Networks the current user owns or is a member of."""
    supabase = get_supabase()
    try:
        # Fetch user's member banks
        m_res = supabase.table("question_bank_members").select("bank_id, role").eq("user_id", current_user["user_id"]).execute()
        bank_ids = [m["bank_id"] for m in (m_res.data or [])]
        
        if not bank_ids:
            # Also fetch public banks
            p_res = supabase.table("question_banks").select("*").eq("is_public", True).execute()
            return p_res.data or []
            
        b_res = supabase.table("question_banks").select("*").in_("id", bank_ids).execute()
        return b_res.data or []
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/join")
async def join_question_bank(req: BankJoinRequest, current_user: dict = Depends(get_current_user)):
    """Join a Question Bank Network using an invite code."""
    supabase = get_supabase()
    try:
        b_res = supabase.table("question_banks").select("*").eq("code", req.code.strip().upper()).execute()
        if not b_res.data:
            raise HTTPException(status_code=404, detail="Invalid Question Bank Code")
            
        bank = b_res.data[0]
        bank_id = bank["id"]
        
        # Check if already a member
        m_res = supabase.table("question_bank_members").select("*").eq("bank_id", bank_id).eq("user_id", current_user["user_id"]).execute()
        if m_res.data:
            return {"message": "Already a member of this network", "bank": bank}
            
        # Add member as CONTRIBUTOR
        supabase.table("question_bank_members").insert({
            "bank_id": bank_id,
            "user_id": current_user["user_id"],
            "role": "CONTRIBUTOR"
        }).execute()
        
        return {"message": "Successfully joined Question Bank Network!", "bank": bank}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{bank_id}/questions")
async def get_bank_questions(bank_id: str, current_user: dict = Depends(get_current_user)):
    """Get all questions contributed in this Question Bank network."""
    supabase = get_supabase()
    try:
        q_res = supabase.table("questions").select("*").eq("bank_id", bank_id).execute()
        return q_res.data or []
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{bank_id}/questions")
async def add_bank_question(bank_id: str, req: QuestionAddRequest, current_user: dict = Depends(get_current_user)):
    """Contribute a question to a shared Question Bank Network."""
    supabase = get_supabase()
    try:
        question_data = {
            "id": str(uuid.uuid4()),
            "bank_id": bank_id,
            "setter_id": current_user["user_id"],
            "content": req.content,
            "options": req.options,
            "correct_answer": req.correct_answer,
            "marks": req.marks,
            "difficulty": req.difficulty,
            "status": "APPROVED"  # Auto-approved for network bank
        }
        res = supabase.table("questions").insert(question_data).execute()
        return res.data[0] if res.data else question_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
