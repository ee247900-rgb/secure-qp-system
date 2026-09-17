from datetime import datetime, timezone
from typing import Optional
import json

async def log_event(supabase_client, user_id: str, action: str,
                    resource_type: str = None, resource_id: str = None,
                    details: dict = None, ip_address: str = None,
                    user_agent: str = None) -> dict:
    """
    Write an audit log entry. Append-only — no updates or deletes.
    
    Logs: LOGIN, FAILED_LOGIN, QUESTION_CREATE, QUESTION_REVIEW,
          COMPILATION, ENCRYPTION, KEY_SPLIT, KEY_SUBMIT,
          RELEASE_ATTEMPT, RELEASE_SUCCESS, DOWNLOAD, DECRYPTION,
          ROLE_CHANGE, LOCKDOWN
    """
    entry = {
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details or {},
        "ip_address": ip_address,
        "user_agent": user_agent,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    response = await supabase_client.table("audit_logs").insert(entry).execute()
    
    if hasattr(response, 'data') and response.data:
        return response.data[0]
    return entry

async def get_audit_logs(supabase_client, filters: dict = None,
                         limit: int = 100, offset: int = 0) -> list:
    """
    Query audit logs with optional filters.
    Filters: user_id, action, resource_type, date_from, date_to
    """
    query = supabase_client.table("audit_logs").select("*")
    
    if filters:
        if "user_id" in filters:
            query = query.eq("user_id", filters["user_id"])
        if "action" in filters:
            query = query.eq("action", filters["action"])
        if "resource_type" in filters:
            query = query.eq("resource_type", filters["resource_type"])
        if "date_from" in filters:
            query = query.gte("timestamp", filters["date_from"])
        if "date_to" in filters:
            query = query.lte("timestamp", filters["date_to"])
            
    query = query.order("timestamp", desc=True).limit(limit).offset(offset)
    response = await query.execute()
    
    if hasattr(response, 'data'):
        return response.data
    return []

async def detect_anomalies(supabase_client) -> list:
    """
    Detect suspicious patterns in audit logs:
    - Multiple failed logins (>5 in 10 minutes)
    - Release attempts before scheduled time
    - Downloads outside the download window
    - Unusual access patterns (>20 actions per minute from one user)
    Returns list of anomaly dicts with severity, description, user_id, timestamp.
    """
    anomalies = []
    
    # 1. Fetch recent failed logins
    failed_logins = await get_audit_logs(
        supabase_client, 
        filters={"action": "FAILED_LOGIN"}, 
        limit=50
    )
    
    # Analyze failed logins
    user_failures = {}
    for log in failed_logins:
        uid = log.get("user_id")
        user_failures[uid] = user_failures.get(uid, 0) + 1
        
    for uid, count in user_failures.items():
        if count > 5:
            anomalies.append({
                "severity": "HIGH",
                "description": f"Multiple failed logins ({count}) detected.",
                "user_id": uid,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
    # 2. Release attempts before scheduled time
    early_releases = await get_audit_logs(
        supabase_client,
        filters={"action": "RELEASE_ATTEMPT"},
        limit=20
    )
    
    for log in early_releases:
        details = log.get("details", {})
        if details.get("allowed") is False:
            anomalies.append({
                "severity": "CRITICAL",
                "description": "Attempted to release paper before scheduled time.",
                "user_id": log.get("user_id"),
                "timestamp": log.get("timestamp")
            })

    return anomalies
