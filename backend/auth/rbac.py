from fastapi import Depends, HTTPException, Request
from typing import Callable
from models.enums import UserRole, AuditAction
from auth.dependencies import get_current_user
from db.supabase_client import get_supabase

def require_role(*roles: UserRole) -> Callable:
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in [r.value for r in roles]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return role_checker

def require_any_role(*roles: UserRole) -> Callable:
    return require_role(*roles)

def log_access(action: AuditAction) -> Callable:
    async def audit_logger(request: Request, current_user: dict = Depends(get_current_user)) -> dict:
        try:
            supabase = get_supabase()
            supabase.table("audit_logs").insert({
                "user_id": current_user["user_id"],
                "action": action.value,
                "ip_address": request.client.host if request.client else None
            }).execute()
        except Exception as e:
            print(f"Failed to log audit action: {e}")
            # Do not block the request if logging fails, but log the error
        return current_user
    return audit_logger
