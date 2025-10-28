"""
Prescription dependencies for role-based access control.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.doctor import Doctor
from app.models.prescription import Prescription
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


def verify_doctor_owns_prescription(
    prescription_id: str,
    doctor: Doctor,
    db: Session
) -> Prescription:
    """
    Verify that the doctor owns the specified prescription.

    Args:
        prescription_id: ID of the prescription to verify
        doctor: Current doctor
        db: Database session

    Returns:
        Prescription object if verification succeeds

    Raises:
        UserNotFoundException: If prescription not found
        InsufficientPermissionsException: If prescription doesn't belong to doctor
    """
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.deleted_at.is_(None)
    ).first()

    if not prescription:
        raise UserNotFoundException("Prescription not found")

    if prescription.doctor_id != doctor.id:
        raise InsufficientPermissionsException(
            "You can only manage your own prescriptions"
        )

    return prescription
