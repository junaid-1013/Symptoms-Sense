"""
Onboarding schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional

class PatientOnboardingRequest(BaseModel):
    """Patient onboarding request schema."""
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., min_length=1, max_length=20)
    blood_group: Optional[str] = Field(None, min_length=1, max_length=10)
    emergency_contact: Optional[str] = Field(None, min_length=1, max_length=20)
    address: Optional[str] = Field(None, min_length=1, max_length=255)

class PatientOnboardingResponse(BaseModel):
    """Patient onboarding response schema."""
    id: str
    user_id: str
    age: Optional[int]
    gender: Optional[str]
    blood_group: Optional[str]
    emergency_contact: Optional[str]
    address: Optional[str]

    class Config:
        from_attributes = True

class DoctorOnboardingRequest(BaseModel):
    """Doctor onboarding request schema."""
    specialization: str = Field(..., min_length=1, max_length=100)
    license_no: str = Field(..., min_length=1, max_length=50)
    experience_years: int = Field(..., ge=0, le=100)
    bio: Optional[str] = Field(None, min_length=1, max_length=1000)
    clinic_id: Optional[str] = Field(None)

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

    class Config:
        from_attributes = True

class ClinicOnboardingRequest(BaseModel):
    """Clinic onboarding request schema."""
    address: str = Field(..., min_length=1, max_length=255)
    registration_no: str = Field(..., min_length=1, max_length=50)
    established_year: int = Field(..., ge=1800, le=2100)
    total_doctors: int = Field(..., ge=0, le=1000)

class ClinicOnboardingResponse(BaseModel):
    """Clinic onboarding response schema."""
    id: str
    user_id: str
    address: Optional[str]
    registration_no: Optional[str]
    established_year: Optional[int]
    total_doctors: int
    status: str

    class Config:
        from_attributes = True
