"""
Doctor schedule schemas for request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from datetime import datetime, time


# ========== Request Schemas ==========

class DoctorScheduleCreateRequest(BaseModel):
    """Create doctor schedule request."""
    day_of_week: str = Field(..., description="Day of the week (monday, tuesday, etc.)")
    start_time: time = Field(..., description="Start time of availability")
    end_time: time = Field(..., description="End time of availability")
    slot_duration: int = Field(30, ge=15, le=120, description="Duration of each slot in minutes")

    @validator('day_of_week')
    def validate_day_of_week(cls, v):
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        if v.lower() not in valid_days:
            raise ValueError(f'day_of_week must be one of: {", ".join(valid_days)}')
        return v.lower()

    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class DoctorScheduleUpdateRequest(BaseModel):
    """Update doctor schedule request."""
    day_of_week: Optional[str] = Field(None, description="Day of the week (monday, tuesday, etc.)")
    start_time: Optional[time] = Field(None, description="Start time of availability")
    end_time: Optional[time] = Field(None, description="End time of availability")
    slot_duration: Optional[int] = Field(None, ge=15, le=120, description="Duration of each slot in minutes")
    is_active: Optional[bool] = Field(None, description="Whether the schedule is active")

    @validator('day_of_week')
    def validate_day_of_week(cls, v):
        if v is None:
            return v
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        if v.lower() not in valid_days:
            raise ValueError(f'day_of_week must be one of: {", ".join(valid_days)}')
        return v.lower()

    @validator('end_time')
    def validate_end_time(cls, v, values):
        if v is not None and 'start_time' in values and values['start_time'] is not None and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


# ========== Response Schemas ==========

class DayScheduleResponse(BaseModel):
    """Single day schedule response."""
    day: str
    startHour: str
    endHour: str
    repeats: str = "Weekly"
    offDay: bool


class DoctorScheduleResponse(BaseModel):
    """Doctor schedule response."""
    id: str
    doctor_id: str
    day_of_week: str
    start_time: time
    end_time: time
    slot_duration: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorWeekScheduleResponse(BaseModel):
    """Complete weekly schedule for a doctor."""
    doctor_id: str
    doctor_name: str
    schedules: List[DayScheduleResponse]


class AllDoctorsSchedulesResponse(BaseModel):
    """Response containing all doctors' weekly schedules."""
    message: str = "Doctor schedules retrieved successfully"
    success: bool = True
    data: Dict[str, List[DayScheduleResponse]]


class DoctorSchedulesResponse(BaseModel):
    """Response containing all schedules for a doctor."""
    schedules: List[DoctorScheduleResponse]
    total: int
    doctor_id: str


class DoctorScheduleCreateResponse(BaseModel):
    """Response after creating a schedule."""
  
    schedule: DoctorScheduleResponse


class DoctorScheduleUpdateResponse(BaseModel):
    """Response after updating a schedule."""
 
    schedule: DoctorScheduleResponse


class DoctorScheduleDeleteResponse(BaseModel):
    """Response after deleting a schedule."""
 
    remaining_schedules: DoctorSchedulesResponse


# ========== Timeslot Schemas ==========

class TimeslotResponse(BaseModel):
    """Timeslot response."""
    id: str
    doctor_id: str
    start_time: datetime
    end_time: datetime
    is_available: bool
    generated_from_schedule: Optional[str] = None

    class Config:
        from_attributes = True


class TimeslotsResponse(BaseModel):
    """Response containing timeslots for a doctor."""
    timeslots: List[TimeslotResponse]
    total: int
    doctor_id: str
    date: Optional[str] = None


class GenerateTimeslotsRequest(BaseModel):
    """Request to generate timeslots for a specific date."""
    date: str = Field(..., description="Date in YYYY-MM-DD format")

    @validator('date')
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('date must be in YYYY-MM-DD format')


class GenerateTimeslotsResponse(BaseModel):
    """Response after generating timeslots."""
    message: str
    generated_count: int
    timeslots: List[TimeslotResponse]