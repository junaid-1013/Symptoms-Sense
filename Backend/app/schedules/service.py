"""
Doctor schedule service with business logic.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, text, func
from typing import List, Optional, Tuple, Dict
from datetime import datetime, time, timedelta, date
import calendar
import json

from app.models.doctor import Doctor, DoctorSchedule, Timeslot, BlockedSlot
from app.models.user import User
from app.models.appointment import Appointment
from app.schedules.schema import (
    DoctorScheduleCreateRequest,
    DoctorScheduleUpdateRequest,
    DoctorScheduleResponse,
    TimeslotResponse,
    DayScheduleResponse,
    DoctorWeekScheduleResponse,
    AllDoctorsSchedulesResponse,
    BulkWeeklyScheduleUpdateRequest,
    WeeklyDaySchedule,
    BulkWeeklyScheduleUpdateResponse,
    BlockedSlotCreateRequest,
    BlockedSlotResponse,
    BlockedSlotsResponse,
    CreateTimeslotFromVirtualRequest
)
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException,
    InsufficientPermissionsException
)
from app.core.config import config


class DoctorScheduleService:
    """Doctor schedule service class."""

    def __init__(self, db: Session):
        self.db = db

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

        # Check for exact duplicate schedule first
        exact_duplicate = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == data.day_of_week,
            DoctorSchedule.start_time == data.start_time,
            DoctorSchedule.end_time == data.end_time,
            DoctorSchedule.deleted_at.is_(None)
        ).first()

        if exact_duplicate:
            raise ValidationException(
                f"An exact duplicate schedule already exists for {data.day_of_week} "
                f"({data.start_time} - {data.end_time}). Use the existing schedule ID: {exact_duplicate.id}"
            )

        # Check for overlapping schedules on the same day
        existing_schedule = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == data.day_of_week,
            DoctorSchedule.deleted_at.is_(None),
            and_(
                DoctorSchedule.start_time < data.end_time,
                DoctorSchedule.end_time > data.start_time
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
            start_time=data.start_time,
            end_time=data.end_time,
            slot_duration=data.slot_duration,
            is_active=True,
        )

        self.db.add(schedule)
        self.db.commit()
        self.db.refresh(schedule)

        # Note: Timeslots are now generated on-demand when fetching available slots
        # This prevents database bloat and allows for dynamic slot availability

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

            # Check for overlapping schedules (excluding current schedule)
            existing_schedule = self.db.query(DoctorSchedule).filter(
                DoctorSchedule.doctor_id == doctor_id,
                DoctorSchedule.day_of_week == day_of_week,
                DoctorSchedule.id != schedule_id,
                DoctorSchedule.deleted_at.is_(None),
                and_(
                    DoctorSchedule.start_time < end_time,
                    DoctorSchedule.end_time > start_time
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
            schedule.start_time = data.start_time
        if data.end_time:
            schedule.end_time = data.end_time
        if data.slot_duration:
            schedule.slot_duration = data.slot_duration
        if data.is_active is not None:
            schedule.is_active = data.is_active

        self.db.commit()
        self.db.refresh(schedule)

        # Note: Timeslots are generated on-demand, so no cleanup needed
        # Existing booked timeslots remain intact

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

        # Check for upcoming appointments linked to this schedule
        # Note: This is informational - we allow deletion but warn about appointments
        from app.models.appointment import Appointment
        now = datetime.utcnow()
        upcoming_appointments = self.db.query(Appointment).join(
            Timeslot, Appointment.timeslot_id == Timeslot.id
        ).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.status.in_(['pending', 'scheduled']),
            Timeslot.generated_from_schedule == schedule_id,
            Timeslot.start_time > now,
            Appointment.deleted_at.is_(None),
            Timeslot.deleted_at.is_(None)
        ).count()

        # Note: Timeslots are generated on-demand, so no cleanup needed
        # Existing booked timeslots remain intact (they reference the schedule)

        # Soft delete
        schedule.soft_delete()
        self.db.commit()

        if upcoming_appointments > 0:
            # Return a message but don't block deletion
            # The schedule is soft-deleted, so it won't generate new slots
            # but existing appointments remain valid
            pass

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
                
                weekly_schedule.append(DayScheduleResponse(
                    day=day.capitalize(),
                    startHour=self._format_time_12hr(schedule.start_time),
                    endHour=self._format_time_12hr(schedule.end_time),
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
            # Combine date with schedule times
            schedule_start = datetime.combine(target_date, schedule.start_time)
            schedule_end = datetime.combine(target_date, schedule.end_time)

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

    def _generate_timeslots_for_upcoming_days(self, doctor_id: str, schedule: DoctorSchedule, days_ahead: int = 14) -> None:
        """Generate timeslots for the next N days matching the schedule's weekday."""
        today = date.today()
        target_weekday = schedule.day_of_week.lower()
        for offset in range(0, days_ahead + 1):
            d = today + timedelta(days=offset)
            if calendar.day_name[d.weekday()].lower() == target_weekday:
                self.generate_timeslots_for_date(doctor_id=doctor_id, target_date=d)

    def _cleanup_future_timeslots_for_schedule(self, schedule_id: str) -> None:
        """Soft-delete future timeslots generated from a schedule when no appointments exist."""
        now = datetime.utcnow()
        timeslots = self.db.query(Timeslot).options(joinedload(Timeslot.appointments)).filter(
            Timeslot.generated_from_schedule == schedule_id,
            Timeslot.start_time > now,
            Timeslot.deleted_at.is_(None)
        ).all()
        changed = False
        for slot in timeslots:
            if not slot.appointments:
                slot.soft_delete()
                changed = True
        if changed:
            self.db.commit()

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
        """
        Get available timeslots for a specific date.
        Generates slots on-demand from schedules, excludes blocked slots and booked appointments.
        """
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

        # Get existing booked/blocked timeslots for this date
        start_of_day = datetime.combine(target_date, time.min)
        end_of_day = datetime.combine(target_date, time.max)
        
        existing_timeslots = self.db.query(Timeslot).filter(
            Timeslot.doctor_id == doctor_id,
            Timeslot.start_time >= start_of_day,
            Timeslot.start_time <= end_of_day,
            Timeslot.deleted_at.is_(None)
        ).all()
        
        booked_timeslots = {slot.start_time: slot for slot in existing_timeslots if not slot.is_available}

        # Get blocked slots for this date
        blocked_periods = self._get_blocked_periods_for_date(doctor_id, target_date)

        # Generate available slots on-demand
        available_slots = []
        
        for schedule in schedules:
            schedule_start = datetime.combine(target_date, schedule.start_time)
            schedule_end = datetime.combine(target_date, schedule.end_time)

            current_time = schedule_start
            while current_time + timedelta(minutes=schedule.slot_duration) <= schedule_end:
                slot_end = current_time + timedelta(minutes=schedule.slot_duration)
                
                # Skip if slot is blocked
                if self._is_slot_blocked(current_time, slot_end, blocked_periods):
                    current_time = slot_end
                    continue
                
                # Check if already booked
                if current_time in booked_timeslots:
                    current_time = slot_end
                    continue
                
                # Check if timeslot exists in DB (for booked appointments)
                existing_slot = next(
                    (slot for slot in existing_timeslots if slot.start_time == current_time),
                    None
                )
                
                if existing_slot:
                    # Use existing slot if available
                    if existing_slot.is_available:
                        available_slots.append(self._build_timeslot_response(existing_slot))
                else:
                    # Create virtual timeslot response (not stored in DB until booked)
                    # This is a virtual slot generated on-demand
                    virtual_slot_response = TimeslotResponse(
                        id=None,  # None for virtual slots - will be created when booked
                        doctor_id=doctor_id,
                        start_time=current_time,
                        end_time=slot_end,
                        is_available=True,
                        generated_from_schedule=schedule.id
                    )
                    available_slots.append(virtual_slot_response)

                current_time = slot_end

        # Sort by start time
        available_slots.sort(key=lambda x: x.start_time)

        return available_slots

    # ========== Bulk Weekly Schedule Update Methods ==========

    def bulk_update_weekly_schedule(
        self,
        doctor_id: str,
        data: BulkWeeklyScheduleUpdateRequest
    ) -> BulkWeeklyScheduleUpdateResponse:
        """
        Bulk update weekly schedule from 7-day array.
        Replaces all existing schedules for the doctor.
        
        Note: Existing appointments linked to old schedules remain valid.
        Only future timeslot generation will use the new schedules.
        """
        # Verify doctor exists
        doctor = self.db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise UserNotFoundException("Doctor not found")

        # Get existing schedules
        existing_schedules = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.deleted_at.is_(None)
        ).all()

        # Check for upcoming appointments linked to schedules being deleted
        now = datetime.utcnow()
        upcoming_appointments_count = 0
        if existing_schedules:
            schedule_ids = [s.id for s in existing_schedules]
            # Count upcoming appointments that reference timeslots from these schedules
            upcoming_appointments = self.db.query(Appointment).join(
                Timeslot, Appointment.timeslot_id == Timeslot.id
            ).filter(
                Appointment.doctor_id == doctor_id,
                Appointment.status.in_(['pending', 'scheduled']),
                Timeslot.generated_from_schedule.in_(schedule_ids),
                Timeslot.start_time > now,
                Appointment.deleted_at.is_(None),
                Timeslot.deleted_at.is_(None)
            ).count()
            
            upcoming_appointments_count = upcoming_appointments

        # Soft delete all existing schedules first
        # Note: This is safe because:
        # 1. Existing timeslots and appointments remain intact
        # 2. Timeslots keep their generated_from_schedule reference (soft-deleted schedule still exists)
        # 3. Only future timeslot generation will use new schedules
        for schedule in existing_schedules:
            schedule.soft_delete()
        
        # Commit the soft deletes so they're not picked up in overlap checks
        self.db.commit()

        # Create new schedules from the 7-day array
        # Use single slotDuration for all days
        created_schedules = []
        for day_schedule in data.schedules:
            if not day_schedule.offDay:
                # Parse time from 12-hour format
                start_time_obj = self._parse_time_12hr(day_schedule.startHour)
                end_time_obj = self._parse_time_12hr(day_schedule.endHour)

                # No need to check for overlaps - we've already deleted all existing schedules
                # Create new schedule with single slotDuration for all days
                schedule = DoctorSchedule(
                    doctor_id=doctor_id,
                    day_of_week=day_schedule.day,
                    start_time=start_time_obj,
                    end_time=end_time_obj,
                    slot_duration=data.slotDuration,  # Use single slotDuration from request
                    is_active=True,
                )
                self.db.add(schedule)
                created_schedules.append(schedule)

        # Commit new schedules
        self.db.commit()

        # Refresh all created schedules
        for schedule in created_schedules:
            self.db.refresh(schedule)

        # Get updated weekly schedule
        updated_weekly = self.get_doctor_weekly_schedule(doctor_id)

        # Build message with appointment info if applicable
        message = "Weekly schedule updated successfully"
        if upcoming_appointments_count > 0:
            message += f". Note: {upcoming_appointments_count} upcoming appointment(s) remain linked to the previous schedule configuration."

        return BulkWeeklyScheduleUpdateResponse(
            message=message,
            updated_count=len(created_schedules),
            schedules=updated_weekly
        )

    # ========== Blocked Slot Methods ==========

    def create_blocked_slot(
        self,
        doctor_id: str,
        data: BlockedSlotCreateRequest
    ) -> BlockedSlot:
        """Create a blocked slot for a doctor."""
        # Verify doctor exists
        doctor = self.db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise UserNotFoundException("Doctor not found")

        # Check for duplicate blocked slot
        if data.is_recurring:
            # For recurring blocks, check if same time period and day_of_week already exists
            # Compare time components (hour, minute, second) ignoring the date
            # Get all recurring blocks for this doctor and day
            recurring_blocks = self.db.query(BlockedSlot).filter(
                BlockedSlot.doctor_id == doctor_id,
                BlockedSlot.is_recurring == True,
                BlockedSlot.day_of_week == data.day_of_week,
                BlockedSlot.deleted_at.is_(None)
            ).all()
            
            # Check if any existing block has the same time (ignoring date)
            existing_block = None
            request_start_time = data.start_time.time()
            request_end_time = data.end_time.time()
            
            for block in recurring_blocks:
                if (block.start_time.time() == request_start_time and 
                    block.end_time.time() == request_end_time):
                    existing_block = block
                    break
        else:
            # For one-time blocks, check exact match on start_time, end_time
            existing_block = self.db.query(BlockedSlot).filter(
                BlockedSlot.doctor_id == doctor_id,
                BlockedSlot.is_recurring == False,
                BlockedSlot.start_time == data.start_time,
                BlockedSlot.end_time == data.end_time,
                BlockedSlot.deleted_at.is_(None)
            ).first()

        if existing_block:
            raise ValidationException(
                f"A blocked slot already exists for this time period. "
                f"Use the existing blocked slot ID: {existing_block.id} or delete it first."
            )

        blocked_slot = BlockedSlot(
            doctor_id=doctor_id,
            start_time=data.start_time,
            end_time=data.end_time,
            is_recurring=data.is_recurring,
            day_of_week=data.day_of_week,
            reason=data.reason
        )

        self.db.add(blocked_slot)
        self.db.commit()
        self.db.refresh(blocked_slot)

        return blocked_slot

    def get_blocked_slots(self, doctor_id: str) -> List[BlockedSlotResponse]:
        """Get all blocked slots for a doctor."""
        blocked_slots = self.db.query(BlockedSlot).filter(
            BlockedSlot.doctor_id == doctor_id,
            BlockedSlot.deleted_at.is_(None)
        ).order_by(BlockedSlot.start_time).all()

        return [self._build_blocked_slot_response(bs) for bs in blocked_slots]

    def delete_blocked_slot(
        self,
        blocked_slot_id: str,
        doctor_id: str
    ) -> bool:
        """Delete a blocked slot."""
        blocked_slot = self.db.query(BlockedSlot).filter(
            BlockedSlot.id == blocked_slot_id,
            BlockedSlot.doctor_id == doctor_id,
            BlockedSlot.deleted_at.is_(None)
        ).first()

        if not blocked_slot:
            raise UserNotFoundException("Blocked slot not found")

        blocked_slot.soft_delete()
        self.db.commit()

        return True

    def create_timeslot_from_virtual(
        self,
        doctor_id: str,
        data: CreateTimeslotFromVirtualRequest
    ) -> Timeslot:
        """
        Create a timeslot from virtual slot data (start_time/end_time).
        Used when booking an appointment from a virtual slot.
        Validates that the slot matches the doctor's schedule and is not blocked.
        """
        # Verify doctor exists
        doctor = self.db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise UserNotFoundException("Doctor not found")

        # Validate slot time matches doctor's schedule
        slot_date = data.start_time.date()
        day_of_week = calendar.day_name[slot_date.weekday()].lower()
        
        # Get active schedules for this day
        schedules = self.db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == day_of_week,
            DoctorSchedule.is_active == True,
            DoctorSchedule.deleted_at.is_(None)
        ).all()

        if not schedules:
            raise ValidationException(f"Doctor has no schedule for {day_of_week}")

        # Check if slot matches any schedule
        slot_matches_schedule = False
        matching_schedule = None
        
        for schedule in schedules:
            schedule_start = datetime.combine(slot_date, schedule.start_time)
            schedule_end = datetime.combine(slot_date, schedule.end_time)
            
            # Check if slot falls within schedule and aligns with slot duration
            if (schedule_start <= data.start_time < schedule_end and
                schedule_start < data.end_time <= schedule_end):
                # Verify slot duration matches
                slot_duration_minutes = (data.end_time - data.start_time).total_seconds() / 60
                if slot_duration_minutes == schedule.slot_duration:
                    slot_matches_schedule = True
                    matching_schedule = schedule
                    break

        if not slot_matches_schedule:
            raise ValidationException("The selected slot does not match the doctor's schedule")

        # Check if slot is blocked
        blocked_periods = self._get_blocked_periods_for_date(doctor_id, slot_date)
        if self._is_slot_blocked(data.start_time, data.end_time, blocked_periods):
            raise ValidationException("The selected slot is blocked")

        # Check if timeslot already exists
        existing_slot = self.db.query(Timeslot).filter(
            Timeslot.doctor_id == doctor_id,
            Timeslot.start_time == data.start_time,
            Timeslot.end_time == data.end_time,
            Timeslot.deleted_at.is_(None)
        ).first()

        if existing_slot:
            # Return existing slot if available
            if not existing_slot.is_available:
                raise ValidationException("This timeslot is already booked")
            return existing_slot

        # Create new timeslot
        timeslot = Timeslot(
            doctor_id=doctor_id,
            start_time=data.start_time,
            end_time=data.end_time,
            is_available=True,
            generated_from_schedule=matching_schedule.id if matching_schedule else data.generated_from_schedule,
            slot_type="generated"
        )

        self.db.add(timeslot)
        self.db.commit()
        self.db.refresh(timeslot)

        return timeslot

    def _get_blocked_periods_for_date(
        self,
        doctor_id: str,
        target_date: date
    ) -> List[Tuple[datetime, datetime]]:
        """Get all blocked periods for a specific date."""
        day_of_week = calendar.day_name[target_date.weekday()].lower()
        start_of_day = datetime.combine(target_date, time.min)
        end_of_day = datetime.combine(target_date, time.max)

        blocked_slots = self.db.query(BlockedSlot).filter(
            BlockedSlot.doctor_id == doctor_id,
            BlockedSlot.deleted_at.is_(None)
        ).all()

        blocked_periods = []
        for block in blocked_slots:
            if block.is_recurring:
                # Recurring block - check if day matches
                if block.day_of_week and block.day_of_week.lower() == day_of_week:
                    # Extract time from start_time and end_time
                    block_start = datetime.combine(target_date, block.start_time.time())
                    block_end = datetime.combine(target_date, block.end_time.time())
                    blocked_periods.append((block_start, block_end))
            else:
                # One-time block - check if it falls on target date
                if start_of_day <= block.start_time < end_of_day or \
                   start_of_day < block.end_time <= end_of_day or \
                   (block.start_time <= start_of_day and block.end_time >= end_of_day):
                    blocked_periods.append((block.start_time, block.end_time))

        return blocked_periods

    def _is_slot_blocked(
        self,
        slot_start: datetime,
        slot_end: datetime,
        blocked_periods: List[Tuple[datetime, datetime]]
    ) -> bool:
        """Check if a slot overlaps with any blocked period."""
        for block_start, block_end in blocked_periods:
            if slot_start < block_end and slot_end > block_start:
                return True
        return False

    # ========== Helper Methods ==========

    def _parse_time_12hr(self, time_str: str) -> time:
        """Parse 12-hour format time string to time object."""
        try:
            # Try 12-hour format first
            dt = datetime.strptime(time_str, '%I:%M %p')
            return dt.time()
        except ValueError:
            try:
                # Try 24-hour format
                dt = datetime.strptime(time_str, '%H:%M')
                return dt.time()
            except ValueError:
                raise ValidationException(f"Invalid time format: {time_str}. Use HH:MM AM/PM or HH:MM")

    def _format_time_12hr(self, time_obj: time) -> str:
        """Convert time object to 12-hour format string."""
        if not time_obj:
            return "08:00 AM"
        
        # Convert to datetime for formatting
        dt = datetime.combine(date.today(), time_obj)
        return dt.strftime("%I:%M %p").lstrip('0')  # Remove leading zero from hour

    def _build_schedule_response(self, schedule: DoctorSchedule) -> DoctorScheduleResponse:
        """Build DoctorScheduleResponse from schedule model."""
        
        return DoctorScheduleResponse(
            id=schedule.id,
            doctor_id=schedule.doctor_id,
            day_of_week=schedule.day_of_week,
            start_time=schedule.start_time,
            end_time=schedule.end_time,
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

    def _build_blocked_slot_response(self, blocked_slot: BlockedSlot) -> BlockedSlotResponse:
        """Build BlockedSlotResponse from blocked slot model."""
        return BlockedSlotResponse(
            id=blocked_slot.id,
            doctor_id=blocked_slot.doctor_id,
            start_time=blocked_slot.start_time,
            end_time=blocked_slot.end_time,
            is_recurring=blocked_slot.is_recurring,
            day_of_week=blocked_slot.day_of_week,
            reason=blocked_slot.reason,
            created_at=blocked_slot.created_at
        )