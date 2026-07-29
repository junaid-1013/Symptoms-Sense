"""
Medicine-reminder request and response schemas.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List
from datetime import datetime
import re

VALID_DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}

class ReminderCreateRequest(BaseModel):
    """Payload for POST /api/reminders — submitted by a logged-in patient."""
    medicine_name: str = Field(..., min_length=1, max_length=100)
    dosage: int = Field(..., ge=1, strict=True, description="Dosage amount (positive integer)")
    medicine_type: str = Field(..., min_length=1, max_length=50)
    days_of_week: List[str] = Field(..., min_length=1, description="At least one weekday required")
    reminder_time: str = Field(..., description="Wall-clock time in HH:MM format; legacy HH:MM:00 is normalized")

    @field_validator("medicine_name", "medicine_type", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("days_of_week")
    @classmethod
    def validate_days(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("Please select at least one day for reminder")
        invalid = [d for d in v if d not in VALID_DAYS]
        if invalid:
            raise ValueError(f"Invalid day(s): {invalid}. Expected Mon/Tue/Wed/Thu/Fri/Sat/Sun.")
        return list(dict.fromkeys(v))

    @field_validator("reminder_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        value = v.strip()
        if not re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9](?::00)?", value):
            raise ValueError("Time must be HH:MM with minute precision (optional :00 seconds)")
        return value[:5]

class ReminderConfigResponse(BaseModel):
    timezone: str

class ReminderItem(BaseModel):
    """Single active reminder returned to the patient."""
    id: str
    medicine_name: str
    dosage: int
    medicine_type: str
    days_of_week: List[str]
    reminder_time: str
    timezone: str
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
