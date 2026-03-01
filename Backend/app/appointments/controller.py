"""
Appointment controller with FastAPI routes.
Controllers are thin: validate request, call service, return response.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.appointments.schema import AppointmentCreateRequest, AppointmentUpdateRequest
from app.appointments.service import AppointmentService
from app.models.user import User
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException,
    InsufficientPermissionsException,
)
from app.core.response import APIResponse, APIResponseGeneric

router = APIRouter(prefix="/appointments", tags=["appointments"])


# ========== Appointment Creation ==========

@router.post("/", response_model=APIResponseGeneric[dict], status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new appointment (patient or clinic)."""
    service = AppointmentService(db)
    try:
        _, appointments = service.create_appointment_as_user(
            current_user.id, current_user.user_type, appointment_data
        )
        return APIResponse(
            message="Appointment created successfully",
            data={"appointments": appointments}
        ).model_dump()
    except (UserNotFoundException, ValidationException, InsufficientPermissionsException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ========== Appointment Update ==========

@router.put("/{appointment_id}", response_model=APIResponseGeneric[dict])
async def update_appointment(
    appointment_id: str,
    appointment_data: AppointmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing appointment (patient or clinic)."""
    service = AppointmentService(db)
    try:
        appointments = service.update_appointment_as_user(
            current_user.id, current_user.user_type, appointment_id, appointment_data
        )
        return APIResponse(
            message="Appointment updated successfully",
            data={"appointments": appointments}
        ).model_dump()
    except (UserNotFoundException, ValidationException, InsufficientPermissionsException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ========== Appointment Approval ==========

@router.post("/{appointment_id}/approve", response_model=APIResponseGeneric[dict])
async def approve_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve an appointment (doctor or clinic)."""
    service = AppointmentService(db)
    try:
        appointments = service.approve_appointment_as_user(
            current_user.id, current_user.user_type, appointment_id
        )
        return APIResponse(
            message="Appointment scheduled successfully",
            data={"appointments": appointments}
        ).model_dump()
    except (UserNotFoundException, ValidationException, InsufficientPermissionsException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ========== Appointment Cancellation ==========

@router.post("/{appointment_id}/cancel", response_model=APIResponseGeneric[dict])
async def cancel_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an appointment (patient, doctor, or clinic)."""
    service = AppointmentService(db)
    try:
        appointments = service.cancel_appointment_as_user(
            current_user.id, current_user.user_type, appointment_id
        )
        return APIResponse(
            message="Appointment cancelled successfully",
            data={"appointments": appointments}
        ).model_dump()
    except (UserNotFoundException, ValidationException, InsufficientPermissionsException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ========== Get My Appointments ==========

@router.get("/my-appointments", response_model=APIResponseGeneric[dict])
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all appointments for the logged-in user (patient, doctor, or clinic)."""
    service = AppointmentService(db)
    try:
        appointments = service.get_my_appointments(current_user.id, current_user.user_type)
        return APIResponse(
            message="Appointments retrieved successfully",
            data={"appointments": appointments}
        ).model_dump()
    except (UserNotFoundException, InsufficientPermissionsException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
