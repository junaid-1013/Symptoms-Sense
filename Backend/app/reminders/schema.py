"""
Medicine-reminder request and response schemas.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List
from datetime import datetime

VALID_DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}

class ReminderCreateRequest(BaseModel):
    """Payload for POST /api/reminders — submitted by a logged-in patient."""
    medicine_name: str = Field(..., min_length=1, max_length=100)
    dosage: int = Field(..., ge=1, description="Dosage amount (positive integer)")
    medicine_type: str = Field(..., min_length=1, max_length=50)
    days_of_week: List[str] = Field(..., min_length=1, description="At least one weekday required")
    reminder_time: str = Field(..., description="Wall-clock time in HH:MM or HH:MM:SS format")

    @field_validator("days_of_week")
    @classmethod
    def validate_days(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("Please select at least one day for reminder")
        invalid = [d for d in v if d not in VALID_DAYS]
        if invalid:
            raise ValueError(f"Invalid day(s): {invalid}. Expected Mon/Tue/Wed/Thu/Fri/Sat/Sun.")
        return v

    @field_validator("reminder_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Please select reminder time")
        parts = v.strip().split(":")
        if len(parts) < 2:
            raise ValueError("Time must be in HH:MM or HH:MM:SS format")
        try:
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                raise ValueError("Invalid hour or minute")
        except (ValueError, IndexError):
            raise ValueError("Time must be in HH:MM or HH:MM:SS format")
        return v

class ReminderItem(BaseModel):
    """Single active reminder returned to the patient."""
    id: str
    medicine_name: str
    dosage: int
    medicine_type: str
    days_of_week: List[str]
    reminder_time: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ReminderListResponse(BaseModel):
    reminders: List[ReminderItem]
    total: int

class ReminderCreateResponse(BaseModel):
    message: str
    success: bool

class ReminderDeleteResponse(BaseModel):
    message: str
    success: bool