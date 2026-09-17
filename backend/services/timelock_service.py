from datetime import datetime, timezone

def get_server_time() -> datetime:
    """Get current server time in UTC."""
    return datetime.now(timezone.utc)

def check_release_allowed(release_time: datetime, current_time: datetime = None) -> dict:
    """
    Check if paper release is allowed based on server time.
    
    Uses server-side time only (NOT client time).
    
    Returns:
        dict with:
        - 'allowed': bool
        - 'reason': str (explanation)
        - 'release_time': ISO format string
        - 'current_time': ISO format string
        - 'remaining_seconds': int (0 if allowed)
    """
    if current_time is None:
        current_time = get_server_time()
        
    if release_time.tzinfo is None:
        release_time = release_time.replace(tzinfo=timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
        
    allowed = current_time >= release_time
    remaining_seconds = 0
    if not allowed:
        remaining_seconds = int((release_time - current_time).total_seconds())
        
    reason = "Release allowed" if allowed else "Release time has not yet arrived"
        
    return {
        "allowed": allowed,
        "reason": reason,
        "release_time": release_time.isoformat(),
        "current_time": current_time.isoformat(),
        "remaining_seconds": max(0, remaining_seconds)
    }

def format_countdown(remaining_seconds: int) -> str:
    """Format remaining seconds as human-readable countdown (e.g., '2h 15m 30s')."""
    if remaining_seconds <= 0:
        return "0s"
        
    hours, remainder = divmod(remaining_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0 or hours > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{seconds}s")
    
    return " ".join(parts)

def is_within_download_window(release_time: datetime, window_minutes: int = 120) -> bool:
    """
    Check if current time is within the download window.
    Window starts at release_time and lasts window_minutes.
    """
    current_time = get_server_time()
    
    if release_time.tzinfo is None:
        release_time = release_time.replace(tzinfo=timezone.utc)
        
    delta_seconds = (current_time - release_time).total_seconds()
    
    return 0 <= delta_seconds <= (window_minutes * 60)
