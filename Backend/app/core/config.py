"""
Configuration settings with type safety and validation.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Application configuration with type safety."""
    
    # ========== Database ==========
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required")
    
    # ========== Application ==========
    ENVIRONMENT: str = (os.getenv("ENVIRONMENT") or "development").strip().lower() or "development"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    # Avatar files must live on a persistent volume in container deployments.
    AVATAR_STORAGE_DIR: str = os.getenv("AVATAR_STORAGE_DIR", str(Path(__file__).resolve().parents[2] / "uploads" / "avatars"))
    PUBLIC_BACKEND_URL: str = os.getenv("PUBLIC_BACKEND_URL", "http://localhost:8000").rstrip("/")
    
    # ========== JWT Configuration ==========
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable is required")
    
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # ========== Google OAuth2 Configuration ==========
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    
    # Validate Google OAuth if keys are provided
    if GOOGLE_CLIENT_ID and not GOOGLE_CLIENT_SECRET:
        raise ValueError("GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set")
    if GOOGLE_CLIENT_SECRET and not GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is set")
    
    # ========== Security ==========
    BCRYPT_ROUNDS: int = int(os.getenv("BCRYPT_ROUNDS", "12"))
    PASSWORD_MIN_LENGTH: int = 8

    # ========== Scheduling ==========
    TIMESLOT_GENERATION_DAYS_AHEAD: int = int(os.getenv("TIMESLOT_GENERATION_DAYS_AHEAD", "14"))
    DEFAULT_TIMEZONE: str = os.getenv("DEFAULT_TIMEZONE", "UTC")

    # ========== OpenAI Configuration ==========
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable is required")

    # ========== Mailer Configuration ==========
    MAILER_HOST: str = os.getenv("MAILER_HOST", "smtp.gmail.com")
    MAILER_PORT: int = int(os.getenv("MAILER_PORT", "587"))
    MAILER_USERNAME: str = os.getenv("MAILER_USERNAME", "")
    MAILER_PASSWORD: str = os.getenv("MAILER_PASSWORD", "")
    MAILER_FROM: str = os.getenv("MAILER_FROM", "") or os.getenv("MAILER_USERNAME", "")
    MAILER_USE_TLS: bool = os.getenv("MAILER_USE_TLS", "True").lower() == "true"
    CONTACT_EMAIL_TO: str = os.getenv("CONTACT_EMAIL_TO", "") or os.getenv("MAILER_USERNAME", "")


# Create config instance
config = Config()
