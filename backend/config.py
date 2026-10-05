import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")  # anon key
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")  # service role key
    JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    JWT_ALGORITHM: str = "HS256"
    SIGNING_PRIVATE_KEY_PATH: str = os.getenv("SIGNING_PRIVATE_KEY_PATH", "keys/signing_key.pem")
    SIGNING_PUBLIC_KEY_PATH: str = os.getenv("SIGNING_PUBLIC_KEY_PATH", "keys/signing_key_pub.pem")
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    APP_NAME: str = "Secure QP System"
    APP_VERSION: str = "1.0.0"
    SMTP_USER: str = os.getenv("SMTP_USER", "ee247900@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

settings = Settings()
