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
    blockedSlots: Optional[List[Dict]] = None  # Recurring blocked slots for this day


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


class DoctorTimeslotViewItem(BaseModel):
    """Single timeslot item in doctor's view with appointment and status info."""
    id: Optional[str] = None  # None for virtual/available slots
    start_time: datetime
    end_time: datetime
    status: str  # "available", "booked", "blocked"
    appointment: Optional[Dict] = None  # Appointment details if booked
    blocked_slot_id: Optional[str] = None  # Blocked slot ID if blocked
    reason: Optional[str] = None  # Reason for blocking
    is_recurring_block: Optional[bool] = None  # If blocked slot is recurring


class DoctorTimeslotViewResponse(BaseModel):
    """Complete timeslot view for a doctor showing all slots (available, booked, blocked)."""
    date: str
    doctor_id: str
    slots: List[DoctorTimeslotViewItem]
    total: int
    available_count: int
    booked_count: int
    blocked_count: int


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
    startHour: Optional[str] = Field(None, description="Start time in 12-hour format (e.g., '08:00 AM'). Required when offDay is false.")
    endHour: Optional[str] = Field(None, description="End time in 12-hour format (e.g., '05:00 PM'). Required when offDay is false.")
    offDay: bool = Field(False, description="Whether this day is off. When true, startHour and endHour are ignored.")

    @validator('day')
    def validate_day(cls, v):
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        if v.lower() not in valid_days:
            raise ValueError(f'day must be one of: {", ".join(valid_days)}')
        return v.lower()
        
    @validator('startHour', 'endHour')
    def validate_time_format(cls, v):
     
        """Validate 12-hour time format."""
        if v is None:
            return v
        try:
            # Try to parse as 12-hour format
          
            datetime.strptime(v, '%I:%M %p')
            return v
        except ValueError:
            try:
                # Try 24-hour format and convert
                dt = datetime.strptime(v, '%H:%M')
                return dt.strftime('%I:%M %p').lstrip('0')
            except ValueError:
                raise ValueError('Time must be in format HH:MM AM/PM or HH:MM')

    @model_validator(mode='after')
    def validate_off_day_logic(self):
        """Validate that startHour and endHour are provided when offDay is false."""
        if not self.offDay:
            if not self.startHour:
                raise ValueError('startHour is required when offDay is false')
            if not self.endHour:
                raise ValueError('endHour is required when offDay is false')
        return self


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


class WeeklyScheduleWithBlockedSlotsResponse(BaseModel):
    """Weekly schedule response with blocked slots."""
    schedules: List[DayScheduleResponse]
    oneTimeBlockedSlots: List[Dict]  # One-time blocked slots with dates


# ========== Blocked Slot Schemas ==========

class BlockedSlotCreateRequest(BaseModel):
    """
    Create a blocked slot request.
    
    For recurring blocks (is_recurring=true):
    - Provide start_time and end_time (time strings, e.g., "13:00" or "1:00 PM")
    - Provide day_of_week (e.g., "monday")
    - date is optional (ignored if provided)
    
    For one-time blocks (is_recurring=false):
    - Provide start_time and end_time (time strings, e.g., "13:00" or "1:00 PM")
    - Provide date (required, e.g., "2024-01-15")
    - day_of_week is optional (ignored if provided)
    """
    start_time: str = Field(..., description="Start time (e.g., '13:00' or '1:00 PM')")
    end_time: str = Field(..., description="End time (e.g., '14:00' or '2:00 PM')")
    is_recurring: bool = Field(False, description="Whether this block recurs weekly")
    day_of_week: Optional[str] = Field(None, description="Day of week for recurring blocks (required if is_recurring=True, e.g., 'monday')")
    date: Optional[str] = Field(None, description="Date for one-time blocks (required if is_recurring=False, format: YYYY-MM-DD)")
    reason: Optional[str] = Field(None, description="Reason for blocking (e.g., 'Lunch break', 'Emergency')")

    @validator('start_time', 'end_time')
    def validate_time_format(cls, v):
        """Validate time string format (HH:MM or HH:MM AM/PM)."""
        try:
            # Try 24-hour format
            datetime.strptime(v, '%H:%M')
            return v
        except ValueError:
            try:
                # Try 12-hour format
                datetime.strptime(v, '%I:%M %p')
                return v
            except ValueError:
                try:
                    # Try 12-hour format without leading zero (handle manually)
                    import re
                    match = re.match(r'(\d{1,2}):(\d{2})\s+(AM|PM)', v, re.IGNORECASE)
                    if match:
                        return v
                    raise ValueError('Time must be in format HH:MM (24-hour) or HH:MM AM/PM (12-hour), e.g., "13:00" or "1:00 PM"')
                except (ValueError, AttributeError):
                    raise ValueError('Time must be in format HH:MM (24-hour) or HH:MM AM/PM (12-hour), e.g., "13:00" or "1:00 PM"')

    @validator('day_of_week')
    def validate_day_of_week_format(cls, v):
        """Validate day_of_week format."""
        if v:
            valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            if v.lower() not in valid_days:
                raise ValueError(f'day_of_week must be one of: {", ".join(valid_days)}')
            return v.lower()
        return v

    @validator('date')
    def validate_date_format(cls, v):
        """Validate date format."""
        if v:
            try:
                datetime.strptime(v, '%Y-%m-%d')
                return v
            except ValueError:
                raise ValueError('Date must be in format YYYY-MM-DD, e.g., "2024-01-15"')
        return v

    @model_validator(mode='after')
    def validate_blocked_slot_logic(self):
        """Validate blocked slot business logic after all fields are set."""
        is_recurring = self.is_recurring
        day_of_week = self.day_of_week
        date = self.date
        
        # Parse times to validate
        start_time_obj = self._parse_time_string(self.start_time)
        end_time_obj = self._parse_time_string(self.end_time)
        
        if end_time_obj <= start_time_obj:
            raise ValueError('end_time must be after start_time')
        
        if is_recurring:
            # For recurring blocks: require day_of_week, date not needed
            if not day_of_week:
                raise ValueError('day_of_week is required when is_recurring is True (e.g., "monday")')
            # date is optional and ignored for recurring blocks
        else:
            # For one-time blocks: require date, day_of_week not needed
            if not date:
                raise ValueError('date is required when is_recurring is False (format: YYYY-MM-DD, e.g., "2024-01-15")')
            # day_of_week is optional and ignored for one-time blocks
        
        return self
    
    @staticmethod
    def _parse_time_string(time_str: str) -> time:
        """Parse time string to time object."""
        try:
            # Try 24-hour format
            dt = datetime.strptime(time_str, '%H:%M')
            return dt.time()
        except ValueError:
            try:
                # Try 12-hour format
                dt = datetime.strptime(time_str, '%I:%M %p')
                return dt.time()
            except ValueError:
                # Try 12-hour format without leading zero (handle manually)
                import re
                match = re.match(r'(\d{1,2}):(\d{2})\s+(AM|PM)', time_str, re.IGNORECASE)
                if match:
                    hour = int(match.group(1))
                    minute = int(match.group(2))
                    am_pm = match.group(3).upper()
                    if am_pm == 'PM' and hour != 12:
                        hour += 12
                    elif am_pm == 'AM' and hour == 12:
                        hour = 0
                    return time(hour, minute)
                raise ValueError(f'Invalid time format: {time_str}')


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