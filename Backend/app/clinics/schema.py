"""
Clinics API schemas for patient frontend.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class ClinicBasicInfo(BaseModel):
    """Basic clinic information for patient frontend."""
    id: str
    user_id: str
    name: Optional[str]
    email: Optional[str]
    address: Optional[str]
    established_year: Optional[int]
    total_doctors: int
    status: str

    class Config:
        from_attributes = True

class ClinicListResponse(BaseModel):
    """Response for getting all clinics."""
    clinics: List[ClinicBasicInfo]
    total: int

class ClinicDetailResponse(BaseModel):
    """Detailed clinic information."""
    id: str
    user_id: str
    name: Optional[str]
    email: Optional[str]
    address: Optional[str]
    registration_no: Optional[str]
    established_year: Optional[int]
    total_doctors: int
    status: str

    class Config:
        from_attributes = True

# ========== Clinic Doctor Registration Schemas ==========

class ClinicRegisterDoctorRequest(BaseModel):
    """Request for clinic to register a doctor."""
    email: EmailStr = Field(..., description="Doctor's email")
    name: str = Field(..., min_length=2, max_length=100, description="Doctor's full name")
    phone: Optional[str] = Field(None, max_length=20, description="Doctor's phone number")
    password: str = Field(..., min_length=8, description="Password for doctor's account")

class ClinicDoctorBasicInfo(BaseModel):
    """Basic doctor information for clinic view."""
    id: str
    user_id: str
    name: Optional[str]
    email: Optional[str]
    status: str
    created_at: datetime
    specializations: Optional[List[str]] = None
    services: Optional[List[str]] = None
    education: Optional[List[str]] = None
    experience: Optional[List[str]] = None
    phone: Optional[str] = None
    license_no: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    class Config:
        from_attributes = True

class ClinicDoctorsResponse(BaseModel):
    """Response containing all doctors in a clinic."""
    doctors: List[ClinicDoctorBasicInfo]
    total: int
    clinic_id: str
    clinic_name: Optional[str] = None

class ClinicRegisterDoctorResponse(BaseModel):
    message: str
    clinic_doctors: ClinicDoctorsResponse
