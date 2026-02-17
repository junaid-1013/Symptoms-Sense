"""
Appointment dependencies.
"""
from sqlalchemy.orm import Session

def verify_clinic_owns_doctor(
    doctor_id: str,
    clinic_id: str,
    db: Session
) -> bool:
    """
    Verify that the doctor belongs to the clinic.
    """
    from app.models.doctor import Doctor
    
    doctor = db.query(Doctor).filter(
        Doctor.id == doctor_id,
        Doctor.clinic_id == clinic_id,
        Doctor.deleted_at.is_(None)
    ).first()
    
    return doctor is not None

