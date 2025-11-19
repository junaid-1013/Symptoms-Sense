"""
Patient schemas for response validation.
"""
from pydantic import BaseModel
from typing import Optional, List

# ========== Response Schemas ==========

class PatientResponse(BaseModel):
    """Response schema for a single patient."""
    id: str
    user_id: Optional[str]
    name: Optional[str]      
    email: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    blood_group: Optional[str]
    emergency_contact: Optional[str]
    address: Optional[str]

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    """List response for patients."""
    patients: List[PatientResponse]
    total: int
