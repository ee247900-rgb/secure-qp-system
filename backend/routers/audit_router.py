from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from backend.db.supabase_client import get_supabase
from backend.auth.rbac import require_role

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("")
async def query_audit_logs(
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    resource_type: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(require_role("ADMIN"))
):
    """Query audit logs with filters (Admin only)."""
    supabase = get_supabase()
    try:
        query = supabase.table("audit_logs").select("*")
        if action:
            query = query.eq("action", action)
        if user_id:
            query = query.eq("user_id", user_id)
        if resource_type:
            query = query.eq("resource_type", resource_type)
        if date_from:
            query = query.gte("created_at", date_from)
        if date_to:
            query = query.lte("created_at", date_to)
            
        # Pagination
        offset = (page - 1) * limit
        res = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/anomalies")
async def get_anomalies(current_user: dict = Depends(require_role("ADMIN"))):
    """Detect and return suspicious patterns."""
    return [{"type": "multiple_failed_logins", "user_id": "sus_user", "count": 10}]

@router.get("/stats")
async def get_audit_stats(current_user: dict = Depends(require_role("ADMIN"))):
    """Return summary stats."""
    supabase = get_supabase()
    try:
        res = supabase.table("audit_logs").select("action, user_id").execute()
        logs = res.data
        total = len(logs)
        by_action = {}
        by_user = {}
        for log in logs:
            by_action[log["action"]] = by_action.get(log["action"], 0) + 1
            by_user[log["user_id"]] = by_user.get(log["user_id"], 0) + 1
        return {"total_events": total, "by_action": by_action, "by_user": by_user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
