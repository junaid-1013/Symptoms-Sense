"""
Doctor schedule service with business logic.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, cast, Time
from typing import List, Optional, Tuple, Dict
from datetime import datetime, time, timedelta, date
import calendar
import json

from app.models.doctor import Doctor, DoctorSchedule, Timeslot
from app.models.user import User
from app.schedules.schema import (
    DoctorScheduleCreateRequest,
    DoctorScheduleUpdateRequest,
    DoctorScheduleResponse,
    TimeslotResponse,
    DayScheduleResponse,
    DoctorWeekScheduleResponse,
    AllDoctorsSchedulesResponse
)
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException,
    InsufficientPermissionsException
)


class DoctorScheduleService:
    """Doctor schedule service class."""

    def __init__(self, db: Session):
        self.db = db

    # ========== Helper Methods ==========

    def _time_to_datetime(self, time_obj: time) -> datetime:
        """Convert time object to datetime using a reference date."""
        reference_date = date(2000, 1, 1)
        return datetime.combine(reference_date, time_obj)

    # ========== Schedule CRUD Methods ==========

    def create_schedule(
        self,
        doctor_id: str,
        data: DoctorScheduleCreateRequest
    ) -> DoctorSchedule:
        """Create a new schedule for a doctor."""
        # Verify doctor exists
        doctor = self.db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise UserNotFoundException("Doctor not found")

        # Convert time to datetime for database storage
        start_datetime = self._time_to_datetime(data.start_time)
        end_datetime = self._time_to_datetime(data.end_time)

        # Check for overlapping schedules on the same day
        existing_schedule = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == data.day_of_week,
            DoctorSchedule.deleted_at.is_(None),
            or_(
                and_(
                    cast(DoctorSchedule.start_time, Time) < data.end_time,
                    cast(DoctorSchedule.end_time, Time) > data.start_time
                )
            )
        ).first()

        if existing_schedule:
            raise ValidationException(
                f"Schedule overlaps with existing schedule on {data.day_of_week}"
            )

        # Create schedule
        schedule = DoctorSchedule(
            doctor_id=doctor_id,
            day_of_week=data.day_of_week,
            start_time=start_datetime,
            end_time=end_datetime,
            slot_duration=data.slot_duration,
            is_active=True,
        )

        self.db.add(schedule)
        
        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise
        self.db.refresh(schedule)

        return schedule

    def update_schedule(
        self,
        schedule_id: str,
        doctor_id: str,
        data: DoctorScheduleUpdateRequest
    ) -> DoctorSchedule:
        """Update a doctor's schedule."""
        schedule = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.id == schedule_id,
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.deleted_at.is_(None)
        ).first()

        if not schedule:
            raise UserNotFoundException("Schedule not found")

        # If updating day_of_week or times, check for overlaps
        if data.day_of_week or data.start_time or data.end_time:
            day_of_week = data.day_of_week if data.day_of_week else schedule.day_of_week
            start_time = data.start_time if data.start_time else schedule.start_time
            end_time = data.end_time if data.end_time else schedule.end_time

            # Convert datetime to time if needed for comparison
            if isinstance(start_time, datetime):
                start_time = start_time.time()
            if isinstance(end_time, datetime):
                end_time = end_time.time()

            # Check for overlapping schedules (excluding current schedule)
            existing_schedule = self.db.query(DoctorSchedule).filter(
                DoctorSchedule.doctor_id == doctor_id,
                DoctorSchedule.day_of_week == day_of_week,
                DoctorSchedule.id != schedule_id,
                DoctorSchedule.deleted_at.is_(None),
                and_(
                    cast(DoctorSchedule.start_time, Time) < end_time,
                    cast(DoctorSchedule.end_time, Time) > start_time
                )
            ).first()

            if existing_schedule:
                raise ValidationException(
                    f"Updated schedule would overlap with existing schedule on {day_of_week}"
                )

        # Update fields
        if data.day_of_week:
            schedule.day_of_week = data.day_of_week
        if data.start_time:
            schedule.start_time = self._time_to_datetime(data.start_time)
        if data.end_time:
            schedule.end_time = self._time_to_datetime(data.end_time)
        if data.slot_duration:
            schedule.slot_duration = data.slot_duration
        if data.is_active is not None:
            schedule.is_active = data.is_active

        self.db.commit()
        self.db.refresh(schedule)

        return schedule

    def delete_schedule(
        self,
        schedule_id: str,
        doctor_id: str
    ) -> bool:
        """Delete a doctor's schedule."""
        schedule = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.id == schedule_id,
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.deleted_at.is_(None)
        ).first()

        if not schedule:
            raise UserNotFoundException("Schedule not found")

        # Soft delete
        schedule.soft_delete()
        self.db.commit()

        return True

    def get_doctor_schedules(self, doctor_id: str) -> List[DoctorScheduleResponse]:
        """Get all schedules for a doctor."""
        schedules = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.deleted_at.is_(None)
        ).order_by(DoctorSchedule.day_of_week, DoctorSchedule.start_time).all()

        return [self._build_schedule_response(schedule) for schedule in schedules]

    def get_schedule_by_id(self, schedule_id: str, doctor_id: str) -> Optional[DoctorScheduleResponse]:
        """Get a specific schedule by ID."""
        schedule = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.id == schedule_id,
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.deleted_at.is_(None)
        ).first()

        if not schedule:
            return None

        return self._build_schedule_response(schedule)

    # ========== New Weekly Schedule Methods ==========

    def get_doctor_weekly_schedule(self, doctor_id: str) -> List[DayScheduleResponse]:
        """Get complete 7-day weekly schedule for a doctor."""
        # Get all schedules for this doctor
        schedules = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.deleted_at.is_(None)
        ).all()

        # Create a dictionary for quick lookup
        schedule_dict = {schedule.day_of_week.lower(): schedule for schedule in schedules}

        # Days of the week in order
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        weekly_schedule = []
        
        for day in days:
            if day in schedule_dict:
                schedule = schedule_dict[day]
                
                # Extract time from datetime if needed
                start_time = schedule.start_time.time() if isinstance(schedule.start_time, datetime) else schedule.start_time
                end_time = schedule.end_time.time() if isinstance(schedule.end_time, datetime) else schedule.end_time
                
                weekly_schedule.append(DayScheduleResponse(
                    day=day.capitalize(),
                    startHour=self._format_time_12hr(start_time),
                    endHour=self._format_time_12hr(end_time),
                    repeats="Weekly",
                    offDay=not schedule.is_active,
                ))
            else:
                # No schedule for this day - mark as off day
                weekly_schedule.append(DayScheduleResponse(
                    day=day.capitalize(),
                    startHour="08:00 AM",
                    endHour="08:00 AM",
                    repeats="Weekly",
                    offDay=True,
                ))
        
        return weekly_schedule

    def get_all_doctors_weekly_schedules(self) -> AllDoctorsSchedulesResponse:
        """Get weekly schedules for all doctors."""
        # Get all doctors with their users
        doctors = self.db.query(Doctor).join(User, Doctor.user_id == User.id).filter(
            Doctor.deleted_at.is_(None),
            User.deleted_at.is_(None)
        ).all()

        all_schedules = {}
        
        for doctor in doctors:
            # Get doctor's name from related user
            doctor_name = f"{doctor.user.name} " if doctor.user else f"Doctor {doctor.id}"
            
            # Get weekly schedule for this doctor
            weekly_schedule = self.get_doctor_weekly_schedule(doctor.id)
            
            all_schedules[doctor_name] = weekly_schedule
        
        return AllDoctorsSchedulesResponse(
            message="Doctor schedules retrieved successfully",
            success=True,
            data=all_schedules
        )

    # ========== Timeslot Generation Methods ==========

    def generate_timeslots_for_date(
        self,
        doctor_id: str,
        target_date: date
    ) -> List[Timeslot]:
        """Generate timeslots for a specific date based on doctor's schedules."""
        # Get day of week for target date
        day_of_week = calendar.day_name[target_date.weekday()].lower()

        # Get active schedules for this day
        schedules = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == day_of_week,
            DoctorSchedule.is_active == True,
            DoctorSchedule.deleted_at.is_(None)
        ).all()

        if not schedules:
            return []

        generated_timeslots = []

        for schedule in schedules:
            # Extract time from datetime if stored as datetime
            start_time_obj = schedule.start_time.time() if isinstance(schedule.start_time, datetime) else schedule.start_time
            end_time_obj = schedule.end_time.time() if isinstance(schedule.end_time, datetime) else schedule.end_time
            
            # Combine date with schedule times
            schedule_start = datetime.combine(target_date, start_time_obj)
            schedule_end = datetime.combine(target_date, end_time_obj)

            is_available = True  # By default, slots are available
            # Generate slots
            current_time = schedule_start
            while current_time + timedelta(minutes=schedule.slot_duration) <= schedule_end:
                slot_end = current_time + timedelta(minutes=schedule.slot_duration)

                # Check if timeslot already exists
                existing_slot = self.db.query(Timeslot).filter(
                    Timeslot.doctor_id == doctor_id,
                    Timeslot.start_time == current_time,
                    Timeslot.end_time == slot_end,
                    Timeslot.deleted_at.is_(None)
                ).first()

                if not existing_slot:
                    # Create new timeslot
                    timeslot = Timeslot(
                        doctor_id=doctor_id,
                        start_time=current_time,
                        end_time=slot_end,
                        is_available=is_available,
                        generated_from_schedule=schedule.id
                    )
                    self.db.add(timeslot)
                    generated_timeslots.append(timeslot)

                current_time = slot_end

        self.db.commit()

        # Refresh to get IDs
        for slot in generated_timeslots:
            self.db.refresh(slot)

        return generated_timeslots

    def get_timeslots_for_date(
        self,
        doctor_id: str,
        target_date: date
    ) -> List[TimeslotResponse]:
        """Get all timeslots for a specific date."""
        start_of_day = datetime.combine(target_date, time.min)
        end_of_day = datetime.combine(target_date, time.max)

        timeslots = self.db.query(Timeslot).filter(
            Timeslot.doctor_id == doctor_id,
            Timeslot.start_time >= start_of_day,
            Timeslot.start_time <= end_of_day,
            Timeslot.deleted_at.is_(None)
        ).order_by(Timeslot.start_time).all()

        return [self._build_timeslot_response(timeslot) for timeslot in timeslots]

    def get_available_timeslots_for_date(
        self,
        doctor_id: str,
        target_date: date
    ) -> List[TimeslotResponse]:
        """Get available timeslots for a specific date."""
        start_of_day = datetime.combine(target_date, time.min)
        end_of_day = datetime.combine(target_date, time.max)

        timeslots = self.db.query(Timeslot).filter(
            Timeslot.doctor_id == doctor_id,
            Timeslot.start_time >= start_of_day,
            Timeslot.start_time <= end_of_day,
            Timeslot.is_available == True,
            Timeslot.deleted_at.is_(None)
        ).order_by(Timeslot.start_time).all()

        return [self._build_timeslot_response(timeslot) for timeslot in timeslots]

    # ========== Helper Methods ==========

    def _format_time_12hr(self, time_obj) -> str:
        """Convert time or datetime object to 12-hour format string."""
        if not time_obj:
            return "08:00 AM"
        
        # Handle datetime objects - extract time
        if isinstance(time_obj, datetime):
            time_obj = time_obj.time()
        
        # Convert to datetime for formatting
        dt = datetime.combine(date.today(), time_obj)
        return dt.strftime("%I:%M %p").lstrip('0')  # Remove leading zero from hour

    def _build_schedule_response(self, schedule: DoctorSchedule) -> DoctorScheduleResponse:
        """Build DoctorScheduleResponse from schedule model."""
  
        # Extract time from datetime if needed
        if isinstance(schedule.start_time, datetime):
            start_time = schedule.start_time.time()
        else:
            start_time = schedule.start_time
            
        if isinstance(schedule.end_time, datetime):
            end_time = schedule.end_time.time()
        else:
            end_time = schedule.end_time
                
        return DoctorScheduleResponse(
            id=schedule.id,
            doctor_id=schedule.doctor_id,
            day_of_week=schedule.day_of_week,
            start_time=start_time,
            end_time=end_time,
            slot_duration=schedule.slot_duration,
            is_active=schedule.is_active,
            created_at=schedule.created_at,
        )

    def _build_timeslot_response(self, timeslot: Timeslot) -> TimeslotResponse:
        """Build TimeslotResponse from timeslot model."""
        return TimeslotResponse(
            id=timeslot.id,
            doctor_id=timeslot.doctor_id,
            start_time=timeslot.start_time,
            end_time=timeslot.end_time,
            is_available=timeslot.is_available,
            generated_from_schedule=timeslot.generated_from_schedule
        )