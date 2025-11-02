"""
Appointment schemas for request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


# ========== Request Schemas ==========

class AppointmentCreateRequest(BaseModel):
    """Create appointment request."""
    patient_id: str = Field(..., description="Patient ID")
    doctor_id: str = Field(..., description="Doctor ID")
    clinic_id: str = Field(..., description="Clinic ID")
    timeslot_id: Optional[str] = Field(None, description="Timeslot ID (optional)")
    appointment_type: Optional[str] = Field(None, max_length=100, description="Type of appointment")
    chief_complaint: Optional[str] = Field(None, max_length=500, description="Chief complaint or reason for visit")

    @validator('appointment_type')
    def validate_appointment_type(cls, v):
        if v is not None and v.strip() == "":
            return None
        return v

    @validator('chief_complaint')
    def validate_chief_complaint(cls, v):
        if v is not None and v.strip() == "":
            return None
        return v


class AppointmentUpdateRequest(BaseModel):
    """Update appointment request."""
    doctor_id: Optional[str] = Field(None, description="Doctor ID")
    timeslot_id: Optional[str] = Field(None, description="Timeslot ID")
    appointment_type: Optional[str] = Field(None, max_length=100, description="Type of appointment")
    chief_complaint: Optional[str] = Field(None, max_length=500, description="Chief complaint")

    @validator('appointment_type')
    def validate_appointment_type(cls, v):
        if v is not None and v.strip() == "":
            return None
        return v

    @validator('chief_complaint')
    def validate_chief_complaint(cls, v):
        if v is not None and v.strip() == "":
            return None
        return v


# ========== Response Schemas ==========

class AppointmentResponse(BaseModel):
    """Appointment response."""
    id: str
    patient_id: str
    doctor_id: str
    clinic_id: str
    timeslot_id: Optional[str] = None
    status: str
    appointment_type: Optional[str] = None
    chief_complaint: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AppointmentCreateResponse(BaseModel):
    """Response after creating an appointment."""
    status: str = "success"
    message: str
    data: dict

