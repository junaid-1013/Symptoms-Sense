"""
Configuration settings with type safety and validation.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration with type hints and validation
class Config:
    """Application configuration with type safety."""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required")
    
    # Application
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Google OAuth2 Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    
    # Password hashing
    BCRYPT_ROUNDS: int = int(os.getenv("BCRYPT_ROUNDS", "12"))

# Create config instance
config = Config()

# Export
DATABASE_URL = config.DATABASE_URL
DEBUG = config.DEBUG
FRONTEND_URL = config.FRONTEND_URL
SECRET_KEY = config.SECRET_KEY
ALGORITHM = config.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = config.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = config.REFRESH_TOKEN_EXPIRE_DAYS
GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = config.GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI = config.GOOGLE_REDIRECT_URI
BCRYPT_ROUNDS = config.BCRYPT_ROUNDS