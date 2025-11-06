"""
Doctor schedule controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.db.database import get_db
from app.doctors.dependencies import get_current_doctor
from app.auth.dependencies import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schedules.schema import (
    TimeslotsResponse,
    BulkWeeklyScheduleUpdateRequest,
    BulkWeeklyScheduleUpdateResponse,
    BlockedSlotCreateRequest,
    BlockedSlotResponse,
    BlockedSlotsResponse,
    DoctorScheduleCreateRequest,
    DoctorScheduleCreateResponse
)
from app.schedules.service import DoctorScheduleService
from app.models.user import User
from app.models.doctor import Doctor
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException
)
from app.core.response import APIResponse, APIResponseGeneric

router = APIRouter(prefix="/schedules", tags=["doctor-schedules"])

# Optional authentication for public endpoints
optional_security = HTTPBearer(auto_error=False)

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None."""
    if not credentials:
        return None
    try:
        # Use the token directly
        from app.core.security import SecurityUtils
        payload = SecurityUtils.verify_token(credentials.credentials, "access")
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        from app.auth.service import AuthService
        auth_service = AuthService(db)
        user = auth_service.get_user_by_id(user_id)
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None


# ========== Weekly Schedule Endpoints ==========

@router.post("/", response_model=APIResponseGeneric[DoctorScheduleCreateResponse], status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: DoctorScheduleCreateRequest,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Create a single day schedule for the current doctor.
    Use this to add a schedule for one day, or use bulk update for weekly schedule.
    """
    schedule_service = DoctorScheduleService(db)

    try:
        schedule = schedule_service.create_schedule(
            doctor_id=current_doctor.id,
            data=schedule_data
        )

        return APIResponse(
            message="Schedule created successfully",
            data=DoctorScheduleCreateResponse(
                schedule=schedule_service._build_schedule_response(schedule)
            )
        ).dict()
    except (ValidationException, UserNotFoundException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while creating the schedule: {str(e)}"
        )


@router.get("/weekly/me", response_model=APIResponseGeneric[dict])
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
    
    return APIResponse(
        message="Doctor schedule retrieved successfully",
        data={
            doctor_name: weekly_schedule
        }
    ).dict()


@router.get("/weekly/{doctor_id}", response_model=APIResponseGeneric[dict])
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
    
    return APIResponse(
        message="Doctor schedule retrieved successfully",
        data={
            doctor_name: weekly_schedule
        }
    ).dict()


# ========== Timeslot Endpoints ==========

@router.get("/doctors/{doctor_id}/timeslots/{date_str}/available", response_model=APIResponseGeneric[TimeslotsResponse])
async def get_doctor_available_timeslots_for_date(
    doctor_id: str,
    date_str: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Public endpoint to get available timeslots for a specific doctor and date.
    Can be accessed by anyone (patients, clinics) to view available slots for booking.
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

    try:
        target_date = date.fromisoformat(date_str)
        
        # Validate date is not in the past
        if target_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot view timeslots for past dates"
            )
        
        timeslots = schedule_service.get_available_timeslots_for_date(
            doctor_id=doctor_id,
            target_date=target_date
        )

        return APIResponse(
            message="Available timeslots retrieved successfully",
            data=TimeslotsResponse(
                timeslots=timeslots,
                total=len(timeslots),
                doctor_id=doctor_id,
                date=date_str
            )
        ).dict()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while fetching available timeslots: {str(e)}"
        )


# ========== Bulk Weekly Schedule Update Endpoints ==========

@router.put("/weekly/bulk", response_model=APIResponseGeneric[BulkWeeklyScheduleUpdateResponse])
async def bulk_update_weekly_schedule(
    schedule_data: BulkWeeklyScheduleUpdateRequest,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Create or update weekly schedule from 7-day array.
    - First-time creation: Returns 201 Created
    - Subsequent updates: Returns 200 OK
    Frontend always sends 7 days array (Monday to Sunday).
    Days marked as offDay=True will have no schedule created.
    """
    schedule_service = DoctorScheduleService(db)

    try:
        # Check if this is first-time creation (no existing schedules)
        from app.models.doctor import DoctorSchedule
        existing_schedules = db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == current_doctor.id,
            DoctorSchedule.deleted_at.is_(None)
        ).first()
        
        is_first_time = existing_schedules is None

        result = schedule_service.bulk_update_weekly_schedule(
            doctor_id=current_doctor.id,
            data=schedule_data
        )

        response_data = APIResponse(
            message=result.message,
            data=result
        ).dict()
        
        # Return 201 Created for first-time creation, 200 OK for updates
        status_code = status.HTTP_201_CREATED if is_first_time else status.HTTP_200_OK
        return JSONResponse(
            content=response_data,
            status_code=status_code
        )
    except (ValidationException, UserNotFoundException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating the schedule: {str(e)}"
        )


# ========== Blocked Slot Endpoints ==========

@router.post("/blocked-slots", response_model=APIResponseGeneric[BlockedSlotResponse], status_code=status.HTTP_201_CREATED)
async def create_blocked_slot(
    blocked_slot_data: BlockedSlotCreateRequest,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Create a blocked slot for the current doctor."""
    schedule_service = DoctorScheduleService(db)

    try:
        blocked_slot = schedule_service.create_blocked_slot(
            doctor_id=current_doctor.id,
            data=blocked_slot_data
        )

        return APIResponse(
            message="Blocked slot created successfully",
            data=schedule_service._build_blocked_slot_response(blocked_slot)
        ).dict()
    except (ValidationException, UserNotFoundException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while creating the blocked slot: {str(e)}"
        )


@router.get("/blocked-slots", response_model=APIResponseGeneric[BlockedSlotsResponse])
async def get_blocked_slots(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get all blocked slots for the current doctor."""
    schedule_service = DoctorScheduleService(db)
    blocked_slots = schedule_service.get_blocked_slots(current_doctor.id)

    return APIResponse(
        message="Blocked slots retrieved successfully",
        data=BlockedSlotsResponse(
            blocked_slots=blocked_slots,
            total=len(blocked_slots),
            doctor_id=current_doctor.id
        )
    ).dict()


@router.delete("/blocked-slots/{blocked_slot_id}", response_model=APIResponseGeneric[dict])
async def delete_blocked_slot(
    blocked_slot_id: str,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Delete a blocked slot."""
    schedule_service = DoctorScheduleService(db)

    try:
        success = schedule_service.delete_blocked_slot(
            blocked_slot_id=blocked_slot_id,
            doctor_id=current_doctor.id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete blocked slot"
            )

        return APIResponse(
            message="Blocked slot deleted successfully",
            data={"deleted": True}
        ).dict()
    except (UserNotFoundException) as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while deleting the blocked slot: {str(e)}"
        )

