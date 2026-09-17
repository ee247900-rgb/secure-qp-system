from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Dict, Any, List
from backend.db.supabase_client import get_supabase
from backend.auth.dependencies import get_current_user
from backend.auth.rbac import require_role
from backend.services import audit_service
from backend.services import email_service
from backend.models.schemas import UserCreate, UserLogin
import logging
import random

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

# Temporary in-memory OTP store for active sessions
otp_store = {}

@router.post("/test-smtp")
async def test_smtp(to_email: str = Body(..., embed=True)):
    """Test SMTP email delivery to check configuration."""
    clean_email = to_email.strip().lower()
    result = email_service.send_smtp_email(
        clean_email,
        "🧪 SMTP Test - Secure QP System",
        f"<p>This is a test email verifying that SMTP email delivery is operational for <strong>{clean_email}</strong>.</p>",
        f"SMTP test email for {clean_email}"
    )
    return result

@router.post("/send-otp")
async def send_otp(
    email: str = Body(...),
    otp_code: str = Body(None)
):
    """Dynamically generate and dispatch 6-digit OTP to the specified email."""
    supabase = get_supabase()
    clean_email = email.strip().lower()
    
    # Use provided OTP code or generate a fresh 6-digit code
    final_otp = otp_code.strip() if otp_code else str(random.randint(100000, 999999))
    otp_store[clean_email] = final_otp

    # 1. Dispatch via direct SMTP (Gmail)
    smtp_res = email_service.send_otp_email(clean_email, final_otp)

    # 2. Also trigger Supabase Auth OTP delivery
    supabase_res = None
    try:
        supabase_res = supabase.auth.sign_in_with_otp({"email": clean_email})
    except Exception as e:
        logger.warning(f"Supabase OTP email trigger: {e}")

    return {
        "status": "success", 
        "message": f"6-digit OTP [{final_otp}] generated and dispatched to {clean_email}",
        "otp_preview": final_otp,
        "smtp_result": smtp_res,
        "supabase_res": str(supabase_res) if supabase_res else None
    }

@router.post("/request-access")
async def request_access(
    requester_email: str = Body(...),
    admin_email: str = Body(...),
    reason: str = Body(...)
):
    """Send access request notification to network admin email."""
    clean_requester = requester_email.strip().lower()
    clean_admin = admin_email.strip().lower()

    smtp_res = email_service.send_access_request_email(clean_admin, clean_requester, reason)
    return {
        "status": "success",
        "message": f"Access request sent to Admin ({clean_admin})",
        "smtp_result": smtp_res
    }

@router.post("/send-invitations")
async def send_invitations(
    member_emails: List[str] = Body(...),
    network_name: str = Body(...),
    join_link: str = Body(...)
):
    """Send invitation emails to a list of member email addresses."""
    results = []
    for email in member_emails:
        clean = email.strip().lower()
        if clean:
            res = email_service.send_invitation_email(clean, network_name, join_link)
            results.append({"email": clean, "result": res})

    return {
        "status": "success",
        "message": f"Sent invitations to {len(results)} recipients",
        "results": results
    }

# In-memory store for access-grant OTPs (keyed by requester email)
access_otp_store = {}

@router.post("/request-access-otp")
async def request_access_otp(
    requester_email: str = Body(...),
    admin_email: str = Body(...),
    reason: str = Body("")
):
    """
    Generate a 6-digit OTP and send it to the ADMIN's email.
    The requester must obtain this OTP from the admin to gain network access.
    Two-party verification: admin controls access by sharing/withholding the OTP.
    """
    clean_requester = requester_email.strip().lower()
    clean_admin = admin_email.strip().lower()
    
    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    
    # Store keyed by requester email for later verification
    access_otp_store[clean_requester] = {
        "otp": otp_code,
        "admin_email": clean_admin,
        "reason": reason
    }
    
    # Send OTP to ADMIN's email (NOT the requester)
    smtp_res = email_service.send_access_otp_email(
        admin_email=clean_admin,
        requester_email=clean_requester,
        otp_code=otp_code,
        reason=reason
    )
    
    return {
        "status": "success",
        "message": f"Access OTP has been sent to the network admin ({clean_admin}). Ask the admin for the OTP to proceed.",
        "smtp_result": smtp_res
    }

@router.post("/verify-access-otp")
async def verify_access_otp(
    requester_email: str = Body(...),
    otp_code: str = Body(...)
):
    """
    Verify the access OTP that the requester obtained from the admin.
    If valid, the requester is granted network access.
    """
    clean_email = requester_email.strip().lower()
    clean_code = otp_code.strip()
    
    stored = access_otp_store.get(clean_email)
    if not stored:
        raise HTTPException(status_code=400, detail="No pending access request found for this email. Please submit an access request first.")
    
    if clean_code != stored["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check with the network admin and try again.")
    
    # OTP verified — remove from store (one-time use)
    del access_otp_store[clean_email]
    
    return {
        "status": "success",
        "message": f"Access OTP verified! {clean_email} is now authorized to join the network.",
        "admin_email": stored["admin_email"]
    }

@router.post("/verify-otp")
async def verify_otp(email: str = Body(...), code: str = Body(...)):
    """Verify the 6-digit OTP for the given email."""
    clean_email = email.strip().lower()
    clean_code = code.strip()

    expected_otp = otp_store.get(clean_email)
    if expected_otp and clean_code == expected_otp:
        return {"status": "success", "message": "OTP verified successfully"}
    
    # Also verify with Supabase Auth if applicable
    supabase = get_supabase()
    try:
        res = supabase.auth.verify_otp({"email": clean_email, "token": clean_code, "type": "email"})
        if res.session:
            return {"status": "success", "session": res.session}
    except Exception as e:
        logger.warning(f"Supabase OTP verification: {e}")

    raise HTTPException(status_code=400, detail="Invalid 6-digit OTP code")

@router.post("/signup")
async def signup(user: UserCreate):
    """Register new user."""
    supabase = get_supabase()
    try:
        res = supabase.auth.sign_up({"email": user.email, "password": user.password, "options": {"data": {"full_name": user.full_name}}})
        if res.user:
            supabase.table("profiles").insert({"id": res.user.id, "email": user.email, "full_name": user.full_name, "role": "USER"}).execute()
        return {"message": "User created successfully", "user_id": res.user.id if res.user else None}
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(user: UserLogin):
    """Login with email + password."""
    supabase = get_supabase()
    try:
        res = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
        audit_service.log_event("LOGIN", res.user.id, "auth", res.user.id, {"email": user.email})
        return {"access_token": res.session.access_token, "refresh_token": res.session.refresh_token, "user": res.user}
    except Exception as e:
        audit_service.log_event("FAILED_LOGIN", "system", "auth", None, {"email": user.email, "error": str(e)})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

@router.post("/mfa/enroll")
async def mfa_enroll(current_user: dict = Depends(get_current_user)):
    """Enroll TOTP MFA."""
    supabase = get_supabase()
    try:
        res = supabase.auth.mfa.enroll({"factor_type": "totp"})
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/mfa/verify")
async def mfa_verify(challenge_id: str = Body(...), code: str = Body(...), current_user: dict = Depends(get_current_user)):
    """Verify TOTP code during login."""
    supabase = get_supabase()
    try:
        res = supabase.auth.mfa.verify({"factor_id": challenge_id, "challenge_id": challenge_id, "code": code})
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/mfa/unenroll")
async def mfa_unenroll(factor_id: str = Body(...), current_user: dict = Depends(require_role("ADMIN"))):
    """Remove MFA (admin only)."""
    supabase = get_supabase()
    try:
        res = supabase.auth.mfa.unenroll({"factor_id": factor_id})
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    supabase = get_supabase()
    try:
        res = supabase.table("profiles").select("*").eq("id", current_user["user_id"]).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Invalidate session."""
    supabase = get_supabase()
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
