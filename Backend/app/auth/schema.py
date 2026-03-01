"""
Authentication schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from app.prescriptions.schema import MedicineResponse
from typing import Optional, List
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

class PatientLoginResponse(BaseModel):
    """Patient login response with user and patient data."""
    # User fields
    id: str
    email: str
    name: str
    phone: Optional[str]
    user_type: Optional[str]
    is_active: bool
    is_email_verified: bool
    avatar_url: Optional[str]
    last_login: Optional[datetime]

    # Patient fields
    patient_id: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class DoctorLoginResponse(BaseModel):
    """Doctor login response with user and doctor data."""
    # User fields
    id: str
    email: str
    name: str
    phone: Optional[str]
    user_type: Optional[str]
    is_active: bool
    is_email_verified: bool
    avatar_url: Optional[str]
    last_login: Optional[datetime]

    # Doctor fields
    doctor_id: Optional[str] = None
    specializations: Optional[List[str]] = None
    services: Optional[List[str]] = None
    education: Optional[List[str]] = None
    experience: Optional[List[str]] = None
    license_no: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    clinic_id: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    status: Optional[str] = None

    medicines: List[MedicineResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class ClinicLoginResponse(BaseModel):
    """Clinic login response with user and clinic data."""
    # User fields
    id: str
    email: str
    name: str
    phone: Optional[str]
    user_type: Optional[str]
    is_active: bool
    is_email_verified: bool
    avatar_url: Optional[str]
    last_login: Optional[datetime]

    # Clinic fields
    clinic_id: Optional[str] = None
    address: Optional[str] = None
    registration_no: Optional[str] = None
    established_year: Optional[int] = None
    total_doctors: Optional[int] = None
    status: Optional[str] = None

    # Clinic doctors details
    clinic_doctors: Optional[dict] = None  # Will contain doctors list, total, clinic_id, clinic_name
    medicines: List[MedicineResponse] = Field(default_factory=list)

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