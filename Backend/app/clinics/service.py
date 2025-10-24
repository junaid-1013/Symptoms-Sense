"""
Clinics service for patient frontend operations.
"""
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.clinic import Clinic
from app.models.doctor import Doctor
from app.clinics.schema import ClinicBasicInfo, ClinicDetailResponse
from app.models.user import User

class ClinicsService:
    """Clinics service class for patient frontend."""

    def __init__(self, db: Session):
        self.db = db

    def get_all_clinics(self) -> List[ClinicBasicInfo]:
        """Get all active clinics with basic information."""
        clinics = self.db.query(Clinic).filter(Clinic.status == "active").all()

        result = []
        for clinic in clinics:
            # Get user information
            user = self.db.query(User).filter(User.id == clinic.user_id).first()

            # Count actual doctors in this clinic
            doctor_count = self.db.query(Doctor).filter(
                Doctor.clinic_id == clinic.id,
                Doctor.status == "active"
            ).count()

            result.append(ClinicBasicInfo(
                id=clinic.id,
                user_id=clinic.user_id,
                name=user.name if user else None,
                email=user.email if user else None,
                address=clinic.address,
                established_year=clinic.established_year,
                total_doctors=doctor_count,  # Use actual count
                status=clinic.status
            ))

        return result

    def get_clinic_by_id(self, clinic_id: str) -> Optional[ClinicDetailResponse]:
        """Get detailed information for a specific clinic."""
        clinic = self.db.query(Clinic).filter(Clinic.id == clinic_id, Clinic.status == "active").first()
        if not clinic:
            return None

        # Get user information
        user = self.db.query(User).filter(User.id == clinic.user_id).first()

        # Count actual doctors in this clinic
        doctor_count = self.db.query(Doctor).filter(
            Doctor.clinic_id == clinic.id,
            Doctor.status == "active"
        ).count()

        return ClinicDetailResponse(
            id=clinic.id,
            user_id=clinic.user_id,
            name=user.name if user else None,
            email=user.email if user else None,
            address=clinic.address,
            registration_no=clinic.registration_no,
            established_year=clinic.established_year,
            total_doctors=doctor_count,  # Use actual count
            status=clinic.status
        )

    def search_clinics(self, address: Optional[str] = None) -> List[ClinicBasicInfo]:
        """Search clinics by address."""
        query = self.db.query(Clinic).filter(Clinic.status == "active")

        if address:
            query = query.filter(Clinic.address.ilike(f"%{address}%"))

        clinics = query.all()

        result = []
        for clinic in clinics:
            # Get user information
            user = self.db.query(User).filter(User.id == clinic.user_id).first()

            # Count actual doctors in this clinic
            doctor_count = self.db.query(Doctor).filter(
                Doctor.clinic_id == clinic.id,
                Doctor.status == "active"
            ).count()

            result.append(ClinicBasicInfo(
                id=clinic.id,
                user_id=clinic.user_id,
                name=user.name if user else None,
                email=user.email if user else None,
                address=clinic.address,
                established_year=clinic.established_year,
                total_doctors=doctor_count,  # Use actual count
                status=clinic.status
            ))

        return result
