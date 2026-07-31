"""
Doctor schemas for request/response validation.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from app.clinics.schema import ClinicDoctorBasicInfo


# ========== Request Schemas ==========

class DoctorCreateRequest(BaseModel):
    """Create doctor request (clinic only)."""
    email: EmailStr = Field(..., description="Doctor's email")
    name: str = Field(..., min_length=2, max_length=100, description="Doctor's full name")
    phone: Optional[str] = Field(None, max_length=20, description="Doctor's phone number")
    password: Optional[str] = Field(None, min_length=8, description="Password for new user account")
    specializations: Optional[List[str]] = Field(None, description="List of specializations")
    services: Optional[List[str]] = Field(None, description="List of services offered")
    education: Optional[List[str]] = Field(None, description="List of education entries")
    experience: Optional[List[str]] = Field(None, description="List of experience details")
    license_no: str = Field(..., min_length=1, max_length=50, description="Medical license number")
    experience_years: int = Field(..., ge=0, le=100, description="Years of experience")
    bio: Optional[str] = Field(None, max_length=1000, description="Doctor biography")


class DoctorUpdateByClinicRequest(BaseModel):
    """Update doctor request (clinic only)."""
    # User fields
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Doctor's full name")
    email: Optional[EmailStr] = Field(None, description="Doctor's email")
    phone: Optional[str] = Field(None, max_length=20, description="Doctor's phone number")
    # Doctor fields
    specializations: Optional[List[str]] = Field(None, description="List of specializations")
    services: Optional[List[str]] = Field(None, description="List of services offered")
    education: Optional[List[str]] = Field(None, description="List of education entries")
    experience: Optional[List[str]] = Field(None, description="List of experience details")
    license_no: Optional[str] = Field(None, min_length=1, max_length=50)
    experience_years: Optional[int] = Field(None, ge=0, le=100)
    bio: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")


class DoctorUpdateOwnRequest(BaseModel):
    """Update own profile request (doctor can update all except name and email)."""
    phone: Optional[str] = Field(None, max_length=20, description="Doctor's phone number")
    specializations: Optional[List[str]] = Field(None, description="List of specializations")
    services: Optional[List[str]] = Field(None, description="List of services offered")
    education: Optional[List[str]] = Field(None, description="List of education entries")
    experience: Optional[List[str]] = Field(None, description="List of experience details")
    license_no: Optional[str] = Field(None, min_length=1, max_length=50, description="Medical license number")
    experience_years: Optional[int] = Field(None, ge=0, le=100, description="Years of experience")
    bio: Optional[str] = Field(None, max_length=1000, description="Doctor biography")


# ========== Response Schemas ==========

class DoctorBasicInfo(BaseModel):
    """Basic doctor information for public/patient view."""
    id: str
    user_id: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None
    specializations: Optional[List[str]] = None
    services: Optional[List[str]] = None
    education: Optional[List[str]] = None
    experience: Optional[List[str]] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class DoctorDetailResponse(BaseModel):
    """Detailed doctor information (includes license_no for clinic/doctor)."""
    id: str
    user_id: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
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
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorListResponse(BaseModel):
    """Paginated doctor list response."""
    doctors: List[DoctorBasicInfo]
    total: int
    page: int = 1
    page_size: int = 20


# ========== Clinic Operations Responses ==========

class ClinicDoctorsResponse(BaseModel):
    """Response containing all doctors in a clinic."""
    doctors: List[ClinicDoctorBasicInfo]
    total: int
    clinic_id: str
    clinic_name: Optional[str] = None


class DoctorCreateResponse(BaseModel):
    message: str
    clinic_doctors: ClinicDoctorsResponse


class DoctorUpdateResponse(BaseModel):
    """ Response after updating a doctor."""
    message: str
    clinic_doctors: ClinicDoctorsResponse


class DoctorDeleteResponse(BaseModel):
    """ Response after deleting a doctor."""
    message: str
    clinic_doctors: ClinicDoctorsResponse
# ========== Doctor Review Schemas ==========
class DoctorReviewCreateRequest(BaseModel):
    """Payload for POST /api/doctors/{doctor_id}/reviews."""
    rating: int = Field(..., ge=1, le=5, description="Rating between 1 and 5")
    review: str = Field(..., min_length=10, max_length=200, description="Review text")
class DoctorReviewItem(BaseModel):
    """Single doctor review item."""
    id: str
    doctor_id: str
    user_id: str
    reviewer_name: Optional[str] = None
    reviewer_avatar: Optional[str] = None
    rating: int
    review: str
    created_at: datetime
    class Config:
        from_attributes = True
class DoctorReviewListResponse(BaseModel):
    """Paginated doctor review list response."""
    reviews: List[DoctorReviewItem]
    total: int
    page: int = 1
    page_size: int = 10
class DoctorReviewCreateResponse(BaseModel):
    """Response after creating a doctor review."""
    message: str
    success: bool
