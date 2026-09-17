from supabase import create_client, Client
from config import settings

def get_supabase() -> Client:
    """Returns a Supabase client with the service role key for backend operations."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise ValueError("Supabase credentials (URL and Service Key) are not fully configured.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

def get_supabase_anon() -> Client:
    """Returns a Supabase client with the anon key for user-facing auth operations."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise ValueError("Supabase credentials (URL and Anon Key) are not fully configured.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
