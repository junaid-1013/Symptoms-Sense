"""
Doctor schedule controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.db.database import get_db
from app.schedules.dependencies import verify_doctor_owns_schedule
from app.doctors.dependencies import get_current_doctor
from app.auth.dependencies import get_current_user

from app.schedules.schema import (
    DoctorScheduleCreateRequest,
    DoctorScheduleUpdateRequest,
    DoctorSchedulesResponse,
    DoctorScheduleCreateResponse,
    DoctorScheduleUpdateResponse,
    DoctorScheduleDeleteResponse,
    TimeslotsResponse,
    GenerateTimeslotsRequest,
    GenerateTimeslotsResponse,
    AllDoctorsSchedulesResponse
)
from app.schedules.service import DoctorScheduleService
from app.models.user import User
from app.models.doctor import Doctor
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException,
    InsufficientPermissionsException
)

router = APIRouter(prefix="/schedules", tags=["doctor-schedules"])


# ========== Weekly Schedule Endpoints ==========

@router.get("/weekly", response_model=AllDoctorsSchedulesResponse)
async def get_all_doctors_weekly_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get weekly schedules for all doctors.
    Returns all 7 days for each doctor, even if not scheduled.
    """
    schedule_service = DoctorScheduleService(db)
    return schedule_service.get_all_doctors_weekly_schedules()


@router.get("/weekly/me")
async def get_my_weekly_schedule(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Get weekly schedule for the current doctor.
    Returns all 7 days, even if not scheduled.
    """
    schedule_service = DoctorScheduleService(db)
    weekly_schedule = schedule_service.get_doctor_weekly_schedule(current_doctor.id)
    
    # Get doctor name
    doctor_name = f"{current_doctor.user.name}" if current_doctor.user else f"Doctor {current_doctor.id}"
    
    return {
        "message": "Doctor schedule retrieved successfully",
        "success": True,
        "data": {
            doctor_name: weekly_schedule
        }
    }


@router.get("/weekly/{doctor_id}")
async def get_doctor_weekly_schedule(
    doctor_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get weekly schedule for a specific doctor.
    Returns all 7 days, even if not scheduled.
    """
    # Verify doctor exists
    doctor = db.query(Doctor).filter(
        Doctor.id == doctor_id,
        Doctor.deleted_at.is_(None)
    ).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    schedule_service = DoctorScheduleService(db)
    weekly_schedule = schedule_service.get_doctor_weekly_schedule(doctor_id)
    
    # Get doctor name
    doctor_name = f"{doctor.user.name}" if doctor.user else f"Doctor {doctor_id}"
    
    return {
        "message": "Doctor schedule retrieved successfully",
        "success": True,
        "data": {
            doctor_name: weekly_schedule
        }
    }


# ========== Original Doctor Schedule Endpoints ==========

@router.post("/", response_model=DoctorScheduleCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: DoctorScheduleCreateRequest,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Create a new schedule for the current doctor."""
    schedule_service = DoctorScheduleService(db)

    try:
        schedule = schedule_service.create_schedule(
            doctor_id=current_doctor.id,
            data=schedule_data
        )

        return DoctorScheduleCreateResponse(
            message="Schedule created successfully",
            schedule=schedule_service._build_schedule_response(schedule)
        )
    except (ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while creating the schedule: {str(e)}"
        )


@router.get("/", response_model=DoctorSchedulesResponse)
async def get_my_schedules(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get all schedules for the current doctor."""
    schedule_service = DoctorScheduleService(db)
    schedules = schedule_service.get_doctor_schedules(current_doctor.id)

    return DoctorSchedulesResponse(
        schedules=schedules,
        total=len(schedules),
        doctor_id=current_doctor.id
    )


@router.get("/{schedule_id}")
async def get_schedule(
    schedule_id: str,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get a specific schedule by ID."""
    schedule_service = DoctorScheduleService(db)
    schedule = schedule_service.get_schedule_by_id(schedule_id, current_doctor.id)

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )

    return schedule


@router.put("/{schedule_id}", response_model=DoctorScheduleUpdateResponse)
async def update_schedule(
    schedule_id: str,
    schedule_data: DoctorScheduleUpdateRequest,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update a specific schedule."""
    schedule_service = DoctorScheduleService(db)
    verify_doctor_owns_schedule(schedule_id, current_doctor, db)
    try:
        schedule = schedule_service.update_schedule(
            schedule_id=schedule_id,
            doctor_id=current_doctor.id,
            data=schedule_data
        )

        return DoctorScheduleUpdateResponse(
            message="Schedule updated successfully",
            schedule=schedule_service._build_schedule_response(schedule)
        )
    except (UserNotFoundException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating the schedule: {str(e)}"
        )


@router.delete("/{schedule_id}", response_model=DoctorScheduleDeleteResponse)
async def delete_schedule(
    schedule_id: str,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Delete a specific schedule."""
    schedule_service = DoctorScheduleService(db)
    verify_doctor_owns_schedule(schedule_id, current_doctor, db)

    try:
        success = schedule_service.delete_schedule(
            schedule_id=schedule_id,
            doctor_id=current_doctor.id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete schedule"
            )

        # Get remaining schedules
        remaining_schedules = schedule_service.get_doctor_schedules(current_doctor.id)

        return DoctorScheduleDeleteResponse(
            message="Schedule deleted successfully",
            remaining_schedules=DoctorSchedulesResponse(
                schedules=remaining_schedules,
                total=len(remaining_schedules),
                doctor_id=current_doctor.id
            )
        )
    except (UserNotFoundException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while deleting the schedule: {str(e)}"
        )


# ========== Timeslot Endpoints ==========

@router.post("/timeslots/generate", response_model=GenerateTimeslotsResponse)
async def generate_timeslots(
    request: GenerateTimeslotsRequest,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Generate timeslots for a specific date based on doctor's schedules."""
    schedule_service = DoctorScheduleService(db)

    try:
        target_date = date.fromisoformat(request.date)
        generated_slots = schedule_service.generate_timeslots_for_date(
            doctor_id=current_doctor.id,
            target_date=target_date
        )

        return GenerateTimeslotsResponse(
            message=f"Generated {len(generated_slots)} timeslots for {request.date}",
            generated_count=len(generated_slots),
            timeslots=[schedule_service._build_timeslot_response(slot) for slot in generated_slots]
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while generating timeslots: {str(e)}"
        )


@router.get("/timeslots/{date_str}", response_model=TimeslotsResponse)
async def get_timeslots_for_date(
    date_str: str,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get all timeslots for a specific date."""
    schedule_service = DoctorScheduleService(db)

    try:
        target_date = date.fromisoformat(date_str)
        timeslots = schedule_service.get_timeslots_for_date(
            doctor_id=current_doctor.id,
            target_date=target_date
        )

        return TimeslotsResponse(
            timeslots=timeslots,
            total=len(timeslots),
            doctor_id=current_doctor.id,
            date=date_str
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while fetching timeslots: {str(e)}"
        )


@router.get("/timeslots/{date_str}/available", response_model=TimeslotsResponse)
async def get_available_timeslots_for_date(
    date_str: str,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get available timeslots for a specific date."""
    schedule_service = DoctorScheduleService(db)

    try:
        target_date = date.fromisoformat(date_str)
        timeslots = schedule_service.get_available_timeslots_for_date(
            doctor_id=current_doctor.id,
            target_date=target_date
        )

        return TimeslotsResponse(
            timeslots=timeslots,
            total=len(timeslots),
            doctor_id=current_doctor.id,
            date=date_str
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while fetching available timeslots: {str(e)}"
        )