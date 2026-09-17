import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure both project root and backend directory are in Python module search path
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from config import settings
except ImportError:
    from backend.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend for Secure Question Paper Management System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
try:
    from routers import (
        auth_router, questions_router, reviews_router, 
        compiler_router, keys_router, release_router, 
        audit_router, admin_router, banks_router
    )
    app.include_router(auth_router.router)
    app.include_router(questions_router.router)
    app.include_router(reviews_router.router)
    app.include_router(compiler_router.router)
    app.include_router(keys_router.router)
    app.include_router(release_router.router)
    app.include_router(audit_router.router)
    app.include_router(admin_router.router)
    app.include_router(banks_router.router)
except ImportError as e:
    print(f"Warning: Could not import some routers. {e}")

@app.on_event("startup")
async def startup_event():
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    print(f"CORS allowed origins: {settings.CORS_ORIGINS}")
    print(f"Supabase URL configured: {'Yes' if settings.SUPABASE_URL else 'No'}")

@app.get("/api/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
