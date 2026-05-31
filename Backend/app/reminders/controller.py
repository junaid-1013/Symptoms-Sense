"""
Medicine-reminder controller.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserType
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
)
from app.reminders.service import ReminderService
from app.core.exceptions import UserNotFoundException, InsufficientPermissionsException

router = APIRouter(prefix="/reminders", tags=["reminders"])

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

    user_email = current_user.email
    sched.schedule_reminder(reminder, user_email)

    background_tasks.add_task(
        send_email,
        to=user_email,
        subject="Medicine Reminder Added",
        body=(
            f"Hi {current_user.name or 'there'},\n\n"
            f"Your medicine reminder has been set up:\n"
            f"  Medicine: {payload.medicine_name}\n"
            f"  Dosage: {payload.dosage}\n"
            f"  Type: {payload.medicine_type}\n"
            f"  Days: {', '.join(payload.days_of_week)}\n"
            f"  Time: {payload.reminder_time}\n\n"
            "You'll receive an email reminder at the scheduled time."
        ),
    )

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
        reminder = service.delete_reminder(reminder_id=reminder_id, patient_id=patient.id)
    except UserNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InsufficientPermissionsException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    sched.unschedule_reminder(reminder_id)

    background_tasks.add_task(
        send_email,
        to=current_user.email,
        subject="Medicine Reminder Removed",
        body=(
            f"Hi {current_user.name or 'there'},\n\n"
            f"Your medicine reminder for '{reminder.medicine_name}' has been removed.\n\n"
            "You will no longer receive emails for this reminder."
        ),
    )

    return APIResponse(
        message="Reminder removed successfully",
        data=ReminderDeleteResponse(message="Reminder removed successfully", success=True),
    ).model_dump()