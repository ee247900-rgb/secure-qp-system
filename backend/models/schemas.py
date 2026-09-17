from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID
from .enums import UserRole, QuestionStatus, ReviewStatus, ExamStatus, PaperStatus, AuditAction

# User schemas
class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    full_name: Optional[str] = None
    created_at: datetime
    
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class MFASetup(BaseModel):
    secret: str
    qr_code_url: str
    
class MFAVerify(BaseModel):
    code: str

# Question schemas
class QuestionCreate(BaseModel):
    exam_id: UUID
    subject_id: UUID
    content: str
    options: Optional[Dict[str, Any]] = None
    correct_answer: str
    marks: int
    difficulty: str

class QuestionUpdate(BaseModel):
    content: Optional[str] = None
    options: Optional[Dict[str, Any]] = None
    correct_answer: Optional[str] = None
    marks: Optional[int] = None
    difficulty: Optional[str] = None
    status: Optional[QuestionStatus] = None

class QuestionResponse(BaseModel):
    id: UUID
    exam_id: UUID
    subject_id: UUID
    setter_id: UUID
    content: str
    options: Optional[Dict[str, Any]] = None
    correct_answer: str
    marks: int
    difficulty: str
    status: QuestionStatus
    created_at: datetime
    updated_at: datetime

class QuestionListResponse(BaseModel):
    items: List[QuestionResponse]
    total: int

# Review schemas
class ReviewCreate(BaseModel):
    question_id: UUID
    status: ReviewStatus
    comments: Optional[str] = None

class ReviewResponse(BaseModel):
    id: UUID
    question_id: UUID
    reviewer_id: UUID
    status: ReviewStatus
    comments: Optional[str] = None
    created_at: datetime

# Exam schemas
class ExamCreate(BaseModel):
    title: str
    scheduled_time: datetime
    duration_minutes: int
    
class ExamResponse(BaseModel):
    id: UUID
    title: str
    scheduled_time: datetime
    duration_minutes: int
    status: ExamStatus
    created_at: datetime
    
class ExamListResponse(BaseModel):
    items: List[ExamResponse]
    total: int

# Compilation schemas
class CompileRequest(BaseModel):
    exam_id: UUID
    subject_id: UUID
    num_questions: int

class CompileResponse(BaseModel):
    paper_id: UUID
    exam_id: UUID
    paper_hash: str
    signature: str
    status: PaperStatus
    created_at: datetime

# Key schemas
class KeyShareResponse(BaseModel):
    id: UUID
    exam_id: UUID
    holder_id: UUID
    share_index: int
    created_at: datetime

class KeySubmitRequest(BaseModel):
    exam_id: UUID
    share_data: str

class QuorumStatusResponse(BaseModel):
    exam_id: UUID
    required_shares: int
    submitted_shares: int
    quorum_met: bool

# Release schemas
class ReleaseResponse(BaseModel):
    exam_id: UUID
    status: str
    message: str
    decryption_key: Optional[str] = None

class DownloadResponse(BaseModel):
    url: str
    expires_in: int
    paper_hash: str

# Audit schemas
class AuditLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    action: AuditAction
    resource_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int

# Anomaly schemas
class AnomalyResponse(BaseModel):
    id: UUID
    event_type: str
    severity: str
    description: str
    timestamp: datetime
    resolved: bool

# Admin schemas
class UserManageResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    active: bool

class RoleAssignRequest(BaseModel):
    user_id: UUID
    new_role: UserRole
