"""
Medicine-reminder controller.
"""
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserType
from app.core.config import config
from app.core.email_templates import reminder_added, reminder_removed
from app.core.mailer import send_email
from app.core.response import APIResponse, APIResponseGeneric
from app.core import scheduler as sched
from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.reminders.schema import (
    ReminderCreateRequest,
    ReminderCreateResponse,
    ReminderDeleteResponse,
    ReminderListResponse,
    ReminderConfigResponse,
)
from app.reminders.service import ReminderService
from app.core.exceptions import UserNotFoundException, InsufficientPermissionsException

router = APIRouter(prefix="/reminders", tags=["reminders"])
logger = logging.getLogger(__name__)

def _cleanup_job(reminder_id: str) -> None:
    """Best-effort cleanup after deactivation; inactive jobs cannot deliver mail."""
    try:
        sched.unschedule_reminder(reminder_id)
    except Exception:
        logger.exception("Job cleanup deferred until reconciliation for reminder %s", reminder_id)

@router.get("/config", response_model=APIResponseGeneric[ReminderConfigResponse])
async def reminder_config():
    """Public scheduling convention; contains no patient data or credentials."""
    return APIResponse(
        message="Reminder configuration",
        data=ReminderConfigResponse(timezone=config.DEFAULT_TIMEZONE),
    ).model_dump()

def _require_patient(current_user: User) -> None:
    if current_user.user_type != UserType.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please login as a patient to manage medicine reminders",
        )

@router.get("", response_model=APIResponseGeneric[ReminderListResponse])
async def list_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all active reminders for the logged-in patient."""
    _require_patient(current_user)
    service = ReminderService(db)
    try:
        patient = service.get_patient_by_user_id(current_user.id)
    except UserNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    items, total = service.list_reminders(patient.id)
    return APIResponse(
        message="Reminders retrieved successfully",
        data=ReminderListResponse(reminders=items, total=total),
    ).model_dump()

@router.post("", response_model=APIResponseGeneric[ReminderCreateResponse], status_code=status.HTTP_201_CREATED)
async def create_reminder(
    payload: ReminderCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new medicine reminder and schedule its recurring email job."""
    _require_patient(current_user)
    service = ReminderService(db)
    try:
        patient = service.get_patient_by_user_id(current_user.id)
    except UserNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    reminder = service.create_reminder(patient_id=patient.id, data=payload)
    reminder_id = reminder.id
    patient_id = patient.id

    user_email = current_user.email
    try:
        sched.schedule_reminder(reminder)
        service.activate_reminder(reminder)
    except Exception:
        logger.exception("Could not activate reminder %s", reminder_id)
        db.rollback()
        try:
            service.delete_reminder(reminder_id, patient_id)
        except Exception:
            db.rollback()
            logger.exception("Could not finalize failed reminder %s; reconciliation required", reminder_id)
        _cleanup_job(reminder_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not schedule your reminder. Please try again later.",
        )

    subject, body, html_body = reminder_added(
        current_user.name, payload.medicine_name, payload.dosage, payload.medicine_type,
        payload.days_of_week, f"{payload.reminder_time} ({config.DEFAULT_TIMEZONE})",
    )
    background_tasks.add_task(send_email, to=user_email, subject=subject, body=body, html_body=html_body)

    return APIResponse(
        message="Reminder added successfully",
        data=ReminderCreateResponse(message="Reminder added successfully", success=True),
    ).model_dump()

@router.delete("/{reminder_id}", response_model=APIResponseGeneric[ReminderDeleteResponse])
async def delete_reminder(
    reminder_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a reminder and remove its scheduled job."""
    _require_patient(current_user)
    service = ReminderService(db)
    try:
        patient = service.get_patient_by_user_id(current_user.id)
    except UserNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    try:
        reminder, changed = service.delete_reminder(reminder_id=reminder_id, patient_id=patient.id)
    except UserNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InsufficientPermissionsException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    _cleanup_job(reminder_id)

    if changed:
        subject, body, html_body = reminder_removed(current_user.name, reminder.medicine_name)
        background_tasks.add_task(
            send_email, to=current_user.email, subject=subject, body=body, html_body=html_body,
        )

    return APIResponse(
        message="Reminder removed successfully",
        data=ReminderDeleteResponse(message="Reminder removed successfully", success=True),
    ).model_dump()
