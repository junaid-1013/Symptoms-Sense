from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import or_
from typing import List, Optional

from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.models.user import User
from app.doctors.schema import DoctorBasicInfo, DoctorDetailResponse


class DoctorsService:
    """Doctors service class for patient frontend."""

    def __init__(self, db: Session):
        self.db = db

    def get_all_doctors(self) -> List[DoctorBasicInfo]:
        """Get all active doctors with basic information."""
        doctors = (
            self.db.query(Doctor)
            .filter(Doctor.status == "active")
            .options(
                joinedload(Doctor.user),
                joinedload(Doctor.clinic).joinedload(Clinic.user)
            )
            .all()
        )

        return [
            DoctorBasicInfo(
                id=doctor.id,
                user_id=doctor.user_id,
                name=doctor.user.name if doctor.user else None,
                email=doctor.user.email if doctor.user else None,
                specialization=doctor.specialization,
                experience_years=doctor.experience_years,
                bio=doctor.bio,
                clinic_name=doctor.clinic.user.name if doctor.clinic and doctor.clinic.user else None,
                clinic_address=doctor.clinic.address if doctor.clinic else None,
                status=doctor.status
            )
            for doctor in doctors
        ]

    def get_doctor_by_id(self, doctor_id: str) -> Optional[DoctorDetailResponse]:
        """Get detailed information for a specific doctor."""
        doctor = (
            self.db.query(Doctor)
            .filter(Doctor.id == doctor_id, Doctor.status == "active")
            .options(
                joinedload(Doctor.user),
                joinedload(Doctor.clinic).joinedload(Clinic.user)
            )
            .first()
        )
        if not doctor:
            return None

        return DoctorDetailResponse(
            id=doctor.id,
            user_id=doctor.user_id,
            name=doctor.user.name if doctor.user else None,
            email=doctor.user.email if doctor.user else None,
            specialization=doctor.specialization,
            license_no=doctor.license_no,
            experience_years=doctor.experience_years,
            bio=doctor.bio,
            clinic_id=doctor.clinic_id,
            clinic_name=doctor.clinic.user.name if doctor.clinic and doctor.clinic.user else None,
            clinic_address=doctor.clinic.address if doctor.clinic else None,
            status=doctor.status
        )

    def search_doctors(
            self,
            specialization: Optional[str] = None,
            clinic_name: Optional[str] = None
        ) -> List[DoctorBasicInfo]:
            """Search doctors by specialization or clinic name."""

            # Create an alias for clinic's user
            clinic_user = aliased(User, name="clinic_user")

            # Base query with necessary joins
            query = (
                self.db.query(Doctor)
                .join(User, Doctor.user_id == User.id)
                .outerjoin(Clinic, Doctor.clinic_id == Clinic.id)
                .outerjoin(clinic_user, Clinic.user_id == clinic_user.id)
                .filter(Doctor.status == "active")
            )

            # Apply filters
            if specialization:
                query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

            if clinic_name:
                query = query.filter(
                    or_(
                        clinic_user.name.ilike(f"%{clinic_name}%"),
                        Clinic.address.ilike(f"%{clinic_name}%")
                    )
                )

            # Optimize loading related data
            doctors = query.options(
                joinedload(Doctor.user),
                joinedload(Doctor.clinic).joinedload(Clinic.user)
            ).all()

            return [
                DoctorBasicInfo(
                    id=doctor.id,
                    user_id=doctor.user_id,
                    name=doctor.user.name if doctor.user else None,
                    email=doctor.user.email if doctor.user else None,
                    specialization=doctor.specialization,
                    experience_years=doctor.experience_years,
                    bio=doctor.bio,
                    clinic_name=doctor.clinic.user.name if doctor.clinic and doctor.clinic.user else None,
                    clinic_address=doctor.clinic.address if doctor.clinic else None,
                    status=doctor.status
                )
                for doctor in doctors
            ]