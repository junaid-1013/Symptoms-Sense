"""
Prescription dependencies for role-based access control.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.doctor import Doctor
from app.core.exceptions import InsufficientPermissionsException, UserNotFoundException


def get_current_doctor_for_prescription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Doctor:
    """
    Get current user's doctor profile for prescription operations.

    Raises:
        InsufficientPermissionsException: If user is not a doctor
        UserNotFoundException: If doctor profile not found
    """
    if current_user.user_type != "doctor":
        raise InsufficientPermissionsException("Only doctors can manage prescriptions")

    doctor = db.query(Doctor).filter(
        Doctor.user_id == current_user.id,
        Doctor.deleted_at.is_(None)
    ).first()

    if not doctor:
        raise UserNotFoundException("Doctor profile not found")

    return doctor
