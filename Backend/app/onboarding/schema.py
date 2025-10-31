"""
Onboarding schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ========== Patient Schemas ==========

class PatientOnboardingRequest(BaseModel):
    """Patient onboarding request schema."""
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., min_length=1, max_length=20)
    blood_group: Optional[str] = Field(None, min_length=1, max_length=10)
    emergency_contact: Optional[str] = Field(None, min_length=1, max_length=20)
    address: Optional[str] = Field(None, min_length=1, max_length=255)

class PatientOnboardingResponse(BaseModel):
    """Patient onboarding response schema with complete user details."""
    # Patient fields
    id: str
    user_id: str
    age: Optional[int]
    gender: Optional[str]
    blood_group: Optional[str]
    emergency_contact: Optional[str]
    address: Optional[str]
    created_at: datetime
    
    # User fields
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    user_type: Optional[str] = None
    is_active: Optional[bool] = None
    last_login: Optional[datetime] = None
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    is_email_verified: Optional[bool] = None
    email_verification_token: Optional[str] = None
    password_reset_token: Optional[str] = None
    password_reset_expires: Optional[datetime] = None

    class Config:
        from_attributes = True

# ========== Doctor Schemas ==========
class DoctorOnboardingRequest(BaseModel):
    """Doctor onboarding request schema."""
    specialization: str = Field(..., min_length=1, max_length=100)
    license_no: str = Field(..., min_length=1, max_length=50)
    experience_years: int = Field(..., ge=0, le=100)
    bio: Optional[str] = Field(None, min_length=1, max_length=1000)


class DoctorOnboardingResponse(BaseModel):
    """Doctor onboarding response schema."""
    id: str
    user_id: str
    specialization: Optional[str]
    license_no: Optional[str]
    experience_years: Optional[int]
    bio: Optional[str]
    clinic_id: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ========== Clinic Schemas ==========

class ClinicOnboardingRequest(BaseModel):
    """Clinic onboarding request schema."""
    address: str = Field(..., min_length=1, max_length=255, description="Clinic address")
    registration_no: str = Field(..., min_length=1, max_length=50, description="Registration number")
    established_year: int = Field(..., ge=1800, le=2100, description="Year clinic was established")

class ClinicOnboardingResponse(BaseModel):
    """Clinic onboarding response schema with complete user details."""
    # Clinic fields
    id: str
    user_id: str
    address: Optional[str]
    registration_no: Optional[str]
    established_year: Optional[int]
    total_doctors: int
    status: str
    created_at: datetime
    
    # User fields
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    user_type: Optional[str] = None
    is_active: Optional[bool] = None
    last_login: Optional[datetime] = None
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    is_email_verified: Optional[bool] = None
    email_verification_token: Optional[str] = None
    password_reset_token: Optional[str] = None
    password_reset_expires: Optional[datetime] = None

    class Config:
        from_attributes = True