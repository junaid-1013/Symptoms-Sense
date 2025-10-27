"""
Prescription schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ========== Medicine Schemas ==========

class MedicineBase(BaseModel):
    """Base medicine schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)

class MedicineResponse(MedicineBase):
    """Medicine response schema."""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ========== Prescription Medicine Schemas ==========

class PrescriptionMedicineBase(BaseModel):
    """Base prescription medicine schema."""
    medicine_id: str
    dosage: Optional[str] = Field(None, min_length=1, max_length=50)
    frequency: Optional[str] = Field(None, min_length=1, max_length=50)
    duration_days: Optional[int] = Field(None, ge=1, le=365)

class PrescriptionMedicineResponse(PrescriptionMedicineBase):
    """Prescription medicine response schema."""
    id: str
    prescription_id: str
    medicine: Optional[MedicineResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ========== Prescription Schemas ==========

class PrescriptionCreateRequest(BaseModel):
    """Prescription creation request schema."""
    appointment_id: str
    patient_id: str
    notes: Optional[str] = Field(None, min_length=1, max_length=1000)
    instructions: Optional[str] = Field(None, min_length=1, max_length=1000)
    medicines: List[PrescriptionMedicineBase] = Field(default_factory=list)

class PrescriptionUpdateRequest(BaseModel):
    """Prescription update request schema."""
    notes: Optional[str] = Field(None, min_length=1, max_length=1000)
    instructions: Optional[str] = Field(None, min_length=1, max_length=1000)
    medicines: Optional[List[PrescriptionMedicineBase]] = None

class PrescriptionResponse(BaseModel):
    """Prescription response schema."""
    id: str
    appointment_id: str
    doctor_id: str
    patient_id: str
    notes: Optional[str]
    instructions: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    # Related data
    medicines: List[PrescriptionMedicineResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class PrescriptionListResponse(BaseModel):
    """Prescription list response schema."""
    prescriptions: List[PrescriptionResponse]
    total: int
    page: int
    page_size: int
