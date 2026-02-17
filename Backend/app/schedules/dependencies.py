"""
Doctor schedule dependencies.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.doctor import Doctor, DoctorSchedule


def get_current_doctor(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Doctor:
    """
    Get the current doctor from the authenticated user.
    """
    doctor = db.query(Doctor).filter(
        Doctor.user_id == current_user.id,
        Doctor.deleted_at.is_(None)
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Doctor profile not found."
        )

    return doctor


def verify_doctor_owns_schedule(
    schedule_id: str,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
) -> DoctorSchedule:
    """
    Verify that the current doctor owns the specified schedule.
    """
    schedule = db.query(DoctorSchedule).filter(
        DoctorSchedule.id == schedule_id,
        DoctorSchedule.doctor_id == current_doctor.id,
        DoctorSchedule.deleted_at.is_(None)
    ).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Schedule not found or does not belong to you."
        )

    return schedule
