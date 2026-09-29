"""
Doctor schedule controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.db.database import get_db
from app.doctors.dependencies import get_current_doctor, get_current_clinic
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
    DoctorScheduleCreateResponse,
    DoctorTimeslotViewResponse
)
from app.schedules.service import DoctorScheduleService
from app.models.user import User
from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException,
    InsufficientPermissionsException
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
        ).model_dump()
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
    Get weekly schedule for the current doctor with blocked slots.
    Returns all 7 days, even if not scheduled.
    - Recurring blocked slots are shown per day in schedules
    - One-time blocked slots are shown separately with dates
    """
    schedule_service = DoctorScheduleService(db)
    weekly_data = schedule_service.get_doctor_weekly_schedule_with_blocked_slots(current_doctor.id)
    
    # Get doctor name
    doctor_name = f"{current_doctor.user.name}" if current_doctor.user else f"Doctor {current_doctor.id}"
    
    return APIResponse(
        message="Doctor schedule with blocked slots retrieved successfully",
        data={
            doctor_name: weekly_data
        }
    ).model_dump()


@router.get("/weekly/{doctor_id}", response_model=APIResponseGeneric[dict])
async def get_doctor_weekly_schedule(
    doctor_id: str,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Get weekly schedule for a specific doctor with blocked slots (Clinic only).
    Returns all 7 days, even if not scheduled.
    - Recurring blocked slots are shown per day in schedules
    - One-time blocked slots are shown separately with dates
    
    Only accessible by clinics to view their doctors' schedules.
    """
    schedule_service = DoctorScheduleService(db)
    try:
        weekly_data, doctor_name = schedule_service.get_doctor_weekly_schedule_for_clinic(
            current_clinic.id, doctor_id
        )
        return APIResponse(
            message="Doctor schedule with blocked slots retrieved successfully",
            data={doctor_name: weekly_data}
        ).model_dump()
    except (UserNotFoundException, InsufficientPermissionsException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ========== Timeslot Endpoints ==========

# @router.get("/timeslots/{date_str}/view", response_model=APIResponseGeneric[DoctorTimeslotViewResponse])
# async def get_doctor_timeslot_view(
#     date_str: str,
#     current_doctor: Doctor = Depends(get_current_doctor),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get complete timeslot view for the current doctor for a specific date.
#     Shows all slots: available, booked (with appointment details), and blocked.
#     This is the main endpoint for doctors to view their schedule/timetable.
#     """
#     schedule_service = DoctorScheduleService(db)
    
#     try:
#         target_date = date.fromisoformat(date_str)
        
#         # Allow viewing past dates for historical reference
#         view = schedule_service.get_doctor_timeslot_view_for_date(
#             doctor_id=current_doctor.id,
#             target_date=target_date
#         )
        
#         return APIResponse(
#             message="Doctor timeslot view retrieved successfully",
#             data=view
#         ).model_dump()
#     except ValueError:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid date format. Use YYYY-MM-DD"
#         )
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"An unexpected error occurred: {str(e)}"
#         )


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
    schedule_service = DoctorScheduleService(db)
    try:
        timeslots, doc_id, target_date = schedule_service.get_available_timeslots_public(
            doctor_id, date_str
        )
        return APIResponse(
            message="Available timeslots retrieved successfully",
            data=TimeslotsResponse(
                timeslots=timeslots,
                total=len(timeslots),
                doctor_id=doc_id,
                date=date_str
            )
        ).model_dump()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except (UserNotFoundException, ValidationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
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
        is_first_time = not schedule_service.has_any_schedule(current_doctor.id)
        result = schedule_service.bulk_update_weekly_schedule(
            doctor_id=current_doctor.id,
            data=schedule_data
        )

        response_data = APIResponse(
            message=result.message,
            data=result
        ).model_dump()
        
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
        ).model_dump()
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
    ).model_dump()


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
        ).model_dump()
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

