"""
Doctors API schemas for patient frontend.
"""
from pydantic import BaseModel
from typing import Optional, List

class DoctorBasicInfo(BaseModel):
    """Basic doctor information for patient frontend."""
    id: str
    user_id: str
    name: Optional[str]
    email: Optional[str]
    specialization: Optional[str]
    experience_years: Optional[int]
    bio: Optional[str]
    clinic_name: Optional[str]
    clinic_address: Optional[str]
    status: str

    class Config:
        from_attributes = True

class DoctorListResponse(BaseModel):
    """Response for getting all doctors."""
    doctors: List[DoctorBasicInfo]
    total: int

class DoctorDetailResponse(BaseModel):
    """Detailed doctor information."""
    id: str
    user_id: str
    name: Optional[str]
    email: Optional[str]
    specialization: Optional[str]
    license_no: Optional[str]
    experience_years: Optional[int]
    bio: Optional[str]
    clinic_id: Optional[str]
    clinic_name: Optional[str]
    clinic_address: Optional[str]
    status: str

    class Config:
        from_attributes = True
