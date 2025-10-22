"""
Authentication schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    """User registration schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    user_type: Optional[str] = None

class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: str
    name: str
    phone: Optional[str]
    user_type: Optional[str]
    is_active: bool
    is_email_verified: bool
    avatar_url: Optional[str]
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str

class PasswordResetRequest(BaseModel):
    """Password reset request schema."""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema."""
    token: str
    new_password: str = Field(..., min_length=8)

class PasswordChange(BaseModel):
    """Password change schema."""
    current_password: str
    new_password: str = Field(..., min_length=8)

class GoogleAuthRequest(BaseModel):
    """Google OAuth request schema."""
    code: str
    state: Optional[str] = None

class EmailVerificationRequest(BaseModel):
    """Email verification request schema."""
    token: str