"""
Doctor schedule schemas for request/response validation.
"""
from pydantic import BaseModel, Field, validator, model_validator
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
    id: Optional[str] = None  # None for virtual slots (on-demand generated, not yet in DB)
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


# ========== Bulk Weekly Schedule Update Schemas ==========

class WeeklyDaySchedule(BaseModel):
    """Single day schedule for bulk update."""
    day: str = Field(..., description="Day of the week (Monday, Tuesday, etc.)")
    startHour: str = Field(..., description="Start time in 12-hour format (e.g., '08:00 AM')")
    endHour: str = Field(..., description="End time in 12-hour format (e.g., '05:00 PM')")
    offDay: bool = Field(False, description="Whether this day is off")

    @validator('day')
    def validate_day(cls, v):
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        if v.lower() not in valid_days:
            raise ValueError(f'day must be one of: {", ".join(valid_days)}')
        return v.lower()

    @validator('startHour', 'endHour')
    def validate_time_format(cls, v):
        """Validate 12-hour time format."""
        try:
            # Try to parse as 12-hour format
            from datetime import datetime
            datetime.strptime(v, '%I:%M %p')
            return v
        except ValueError:
            try:
                # Try 24-hour format and convert
                dt = datetime.strptime(v, '%H:%M')
                return dt.strftime('%I:%M %p').lstrip('0')
            except ValueError:
                raise ValueError('Time must be in format HH:MM AM/PM or HH:MM')


class BulkWeeklyScheduleUpdateRequest(BaseModel):
    """Bulk update weekly schedule - accepts 7 days array with single slot duration for all days."""
    slotDuration: int = Field(30, ge=15, le=120, description="Duration of each slot in minutes (applies to all days)")
    schedules: List[WeeklyDaySchedule] = Field(..., min_items=7, max_items=7, description="Array of 7 days (Monday to Sunday)")

    @validator('schedules')
    def validate_all_days_present(cls, v):
        """Ensure all 7 days are present."""
        days = [s.day.lower() for s in v]
        required_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        if set(days) != set(required_days):
            raise ValueError(f'Must provide exactly 7 days: {", ".join(required_days)}')
        
        # Check for duplicates
        if len(days) != len(set(days)):
            raise ValueError('Duplicate days found in schedule')
        
        return v


class BulkWeeklyScheduleUpdateResponse(BaseModel):
    """Response after bulk updating weekly schedule."""
    message: str
    updated_count: int
    schedules: List[DayScheduleResponse]


# ========== Blocked Slot Schemas ==========

class BlockedSlotCreateRequest(BaseModel):
    """Create a blocked slot request."""
    start_time: datetime = Field(..., description="Start date-time of blocked period")
    end_time: datetime = Field(..., description="End date-time of blocked period")
    is_recurring: bool = Field(False, description="Whether this block recurs weekly")
    day_of_week: Optional[str] = Field(None, description="Day of week for recurring blocks (required if is_recurring=True, must match start_time date)")
    reason: Optional[str] = Field(None, description="Reason for blocking (e.g., 'Lunch break', 'Emergency')")

    @validator('end_time')
    def validate_end_after_start(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

    @validator('day_of_week')
    def validate_day_of_week_format(cls, v):
        """Validate day_of_week format."""
        if v:
            valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            if v.lower() not in valid_days:
                raise ValueError(f'day_of_week must be one of: {", ".join(valid_days)}')
            return v.lower()
        return v

    @model_validator(mode='after')
    def validate_blocked_slot_logic(self):
        """Validate blocked slot business logic after all fields are set."""
        import calendar
        
        is_recurring = self.is_recurring
        day_of_week = self.day_of_week
        start_time = self.start_time
        
        # If recurring, day_of_week is required
        if is_recurring and not day_of_week:
            raise ValueError('day_of_week is required when is_recurring is True')
        
        # If not recurring, day_of_week should not be provided
        if not is_recurring and day_of_week:
            raise ValueError('day_of_week should not be provided for one-time blocks (is_recurring=false). Use the date in start_time instead.')
        
        # If recurring, validate that day_of_week matches the start_time date
        if is_recurring and day_of_week and start_time:
            if isinstance(start_time, datetime):
                actual_day = calendar.day_name[start_time.weekday()].lower()
                if day_of_week.lower() != actual_day:
                    raise ValueError(f'day_of_week ({day_of_week.lower()}) does not match the date in start_time ({actual_day}). For recurring blocks, day_of_week must match the weekday of start_time.')
        
        return self


class BlockedSlotResponse(BaseModel):
    """Blocked slot response."""
    id: str
    doctor_id: str
    start_time: datetime
    end_time: datetime
    is_recurring: bool
    day_of_week: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BlockedSlotsResponse(BaseModel):
    """Response containing blocked slots."""
    blocked_slots: List[BlockedSlotResponse]
    total: int
    doctor_id: str


# ========== Timeslot Creation from Virtual Slot ==========

class CreateTimeslotFromVirtualRequest(BaseModel):
    """Create a timeslot from virtual slot (start_time/end_time)."""
    start_time: datetime = Field(..., description="Start date-time of the slot")
    end_time: datetime = Field(..., description="End date-time of the slot")
    generated_from_schedule: Optional[str] = Field(None, description="Schedule ID that generated this slot")

    @validator('end_time')
    def validate_end_after_start(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v