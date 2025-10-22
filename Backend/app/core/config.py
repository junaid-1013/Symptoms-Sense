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

# Create config instance
config = Config()

# Export
DATABASE_URL = config.DATABASE_URL
DEBUG = config.DEBUG
FRONTEND_URL = config.FRONTEND_URL