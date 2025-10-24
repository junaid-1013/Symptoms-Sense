"""
Clinics API schemas for patient frontend.
"""
from pydantic import BaseModel
from typing import Optional, List

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
