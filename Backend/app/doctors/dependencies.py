"""
Doctor dependencies for role-based access control.
"""
from typing import Optional
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.core.constants import UserType
from app.core.exceptions import InsufficientPermissionsException, UserNotFoundException


def get_doctor_owned_by_clinic(doctor_id: str, clinic_id: str, db: Session) -> Optional[Doctor]:

    return db.query(Doctor).filter(
        Doctor.id == doctor_id,
        Doctor.clinic_id == clinic_id,
        Doctor.deleted_at.is_(None)
    ).first()


def get_current_clinic(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Clinic:
    """
    Get current user's clinic profile.
    
    Raises:
        InsufficientPermissionsException: If user is not a clinic
        UserNotFoundException: If clinic profile not found
    """
    if current_user.user_type != UserType.CLINIC:
        raise InsufficientPermissionsException("Only clinics can access this endpoint")
    
    clinic = db.query(Clinic).filter(
        Clinic.user_id == current_user.id,
        Clinic.deleted_at.is_(None)
    ).first()
    
    if not clinic:
        raise UserNotFoundException("Clinic profile not found")
    
    return clinic


def get_current_doctor(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Doctor:
    """
    Get current user's doctor profile.
    
    Raises:
        InsufficientPermissionsException: If user is not a doctor
        UserNotFoundException: If doctor profile not found
    """
    if current_user.user_type != UserType.DOCTOR:
        raise InsufficientPermissionsException("Only doctors can access this endpoint")
    
    doctor = db.query(Doctor).filter(
        Doctor.user_id == current_user.id,
        Doctor.deleted_at.is_(None)
    ).first()
    
    if not doctor:
        raise UserNotFoundException("Doctor profile not found")
    
    return doctor


def verify_clinic_owns_doctor(
    doctor_id: str,
    clinic: Clinic,
    db: Session
) -> Doctor:
    """
    Verify that the clinic owns the specified doctor.
    
    Args:
        doctor_id: ID of the doctor to verify
        clinic: Current clinic
        db: Database session
    
    Returns:
        Doctor object if verification succeeds
    
    Raises:
        UserNotFoundException: If doctor not found
        InsufficientPermissionsException: If doctor doesn't belong to clinic
    """
    doctor = get_doctor_owned_by_clinic(doctor_id, clinic.id, db)
    if not doctor:
        raise UserNotFoundException("Doctor not found or does not belong to your clinic")
    return doctor