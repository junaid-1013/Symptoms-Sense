"""
Prescription schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ========== Medicine Input Schema ==========

class MedicineInput(BaseModel):
    """Medicine input for appointment completion."""
    name: str = Field(..., min_length=1, max_length=100, description="Medicine name (will find existing or create new)")
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    dosage: Optional[str] = Field(None, min_length=1, max_length=50)
    frequency: Optional[str] = Field(None, min_length=1, max_length=50)
    duration_days: Optional[int] = Field(None, ge=1, le=365)


# ========== Complete Appointment Request Schema ==========

class CompleteAppointmentRequest(BaseModel):
    """Complete appointment request - creates diagnosis, prescription, and medicines in one call."""
    appointment_id: str = Field(..., description="Appointment ID")
    
    # Diagnosis fields
    symptoms: Optional[str] = Field(None, description="Patient symptoms")
    diagnosis: Optional[str] = Field(None, description="Doctor's diagnosis")
    diagnosis_details: Optional[str] = Field(None, description="Additional diagnosis details")
    
    # Prescription fields
    prescription_notes: Optional[str] = Field(None, min_length=1, max_length=1000, description="Prescription notes")
    prescription_instructions: Optional[str] = Field(None, min_length=1, max_length=1000, description="Prescription instructions")
    
    medicines: List[MedicineInput] = Field(default_factory=list, description="List of medicines with dosage info")


# ========== Response Schemas ==========

class DiagnosisResponse(BaseModel):
    """Diagnosis response schema."""
    id: str
    appointment_id: str
    doctor_id: str
    patient_id: str
    symptoms: Optional[str]
    diagnosis: Optional[str]
    details: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class MedicineResponse(BaseModel):
    """Medicine response schema."""
    id: str
    name: str
    description: Optional[str]
    manufacturer: Optional[str]
    category: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class MedicineCreateRequest(BaseModel):
    """Create a medicine request."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)

class MedicineUpdateRequest(BaseModel):
    """Update a medicine request (partial)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)


class PrescriptionMedicineResponse(BaseModel):
    """Prescription medicine response schema."""
    id: str
    prescription_id: str
    medicine_id: str
    dosage: Optional[str]
    frequency: Optional[str]
    duration_days: Optional[int]
    medicine: Optional[MedicineResponse] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


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
    medicines: List[PrescriptionMedicineResponse] = Field(default_factory=list)
    
    class Config:
        from_attributes = True


class CompleteAppointmentResponse(BaseModel):
    """Response after completing appointment."""
    diagnosis: DiagnosisResponse
    prescription: PrescriptionResponse
    appointment_status: str


# ========== PATCH Update Schemas ==========

class PrescriptionMedicineUpdate(BaseModel):
    """Partial update for an existing prescription medicine row."""
    id: str
    dosage: Optional[str] = Field(None, min_length=1, max_length=50)
    frequency: Optional[str] = Field(None, min_length=1, max_length=50)
    duration_days: Optional[int] = Field(None, ge=1, le=365)


class UpdateAppointmentRecordsRequest(BaseModel):
    appointment_id: str = Field(..., description="Appointment ID")
    diagnosis_id: Optional[str] = None
    prescription_id: Optional[str] = None
    # Diagnosis fields
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    diagnosis_details: Optional[str] = None
    # Prescription fields
    prescription_notes: Optional[str] = Field(None, min_length=1, max_length=1000)
    prescription_instructions: Optional[str] = Field(None, min_length=1, max_length=1000)
    # Medicines operations
    add_medicines: Optional[list[MedicineInput]] = None
    update_medicines: Optional[list[PrescriptionMedicineUpdate]] = None
    remove_prescription_medicines: Optional[list[str]] = None


class UpdateAppointmentRecordsResponse(BaseModel):
    """Response for partial update of appointment medical records."""
    diagnosis: Optional[DiagnosisResponse] = None
    prescription: Optional[PrescriptionResponse] = None
    appointment_status: str


# ========== List Schemas for GET APIs ==========

class PrescriptionListResponse(BaseModel):
    prescriptions: List[PrescriptionResponse]
    total: int
    page: int
    page_size: int

class DiagnosisListResponse(BaseModel):
    diagnoses: List[DiagnosisResponse]
    total: int

class PrescriptionMedicineListResponse(BaseModel):
    medicines: List[PrescriptionMedicineResponse]
    total: int
