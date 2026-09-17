from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError
from typing import Dict, Any
from config import settings
from db.supabase_client import get_supabase_anon, get_supabase

def get_current_user(authorization: str = Header(...)) -> Dict[str, Any]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    token = authorization.split(" ")[1]
    
    try:
        # Decode Supabase JWT
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], audience="authenticated")
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub")
            
        # Fetch user role from profiles
        supabase = get_supabase()
        response = supabase.table("profiles").select("role").eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="User profile not found")
            
        role = response.data[0].get("role")
        
        return {
            "user_id": user_id,
            "email": email,
            "role": role,
            "token": token
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Expired or invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
