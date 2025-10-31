"""
Clinics service for patient frontend operations.
"""
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.models.clinic import Clinic
from app.models.doctor import Doctor
from app.clinics.schema import ClinicBasicInfo, ClinicDetailResponse, ClinicDoctorBasicInfo, ClinicRegisterDoctorRequest
from app.models.user import User
from app.core.security import SecurityUtils
from app.core.exceptions import UserAlreadyExistsException, ValidationException

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

    def register_doctor(self, clinic_id: str, data: ClinicRegisterDoctorRequest) -> Doctor:
        """Register a new doctor for the clinic."""
        # Verify clinic exists
        clinic = self.db.query(Clinic).filter(
            Clinic.id == clinic_id,
            Clinic.deleted_at.is_(None)
        ).first()

        if not clinic:
            raise ValidationException("Clinic not found")

        # Check if user with email already exists
        existing_user = self.db.query(User).filter(
            User.email == data.email,
            User.deleted_at.is_(None)
        ).first()

        if existing_user:
            raise UserAlreadyExistsException(f"Email is already registered.")

        # Create new user for doctor
        hashed_password = SecurityUtils.get_password_hash(data.password)

        user = User(
            email=data.email,
            name=data.name,
            phone=data.phone,
            password=hashed_password,
            user_type="doctor",
            is_active=True
        )
        self.db.add(user)
        self.db.flush()
        user_id = user.id

        # Create doctor profile linked to clinic
        doctor = Doctor(
            user_id=user_id,
            clinic_id=clinic_id,
            status="active"
        )

        self.db.add(doctor)
        self.db.commit()
        self.db.refresh(doctor)

        # Update clinic's total_doctors count
        self._update_clinic_doctor_count(clinic_id)

        # Load relationships
        doctor = self.db.query(Doctor).options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).filter(Doctor.id == doctor.id).first()

        return doctor

    def get_all_clinic_doctors_basic(self, clinic_id: str) -> List[ClinicDoctorBasicInfo]:
        """
        Get all doctors in a clinic with basic info (for clinic owner).
        """
        doctors = self.db.query(Doctor).options(
            joinedload(Doctor.user)
        ).filter(
            Doctor.clinic_id == clinic_id,
            Doctor.deleted_at.is_(None)  # Exclude soft-deleted
        ).order_by(Doctor.created_at.desc()).all()

        return [self._build_clinic_doctor_basic_info(doctor) for doctor in doctors]

    def _build_clinic_doctor_basic_info(self, doctor: Doctor) -> ClinicDoctorBasicInfo:
        """Build ClinicDoctorBasicInfo from doctor model."""
        return ClinicDoctorBasicInfo(
            id=doctor.id,
            user_id=doctor.user_id,
            name=doctor.user.name if doctor.user else None,
            email=doctor.user.email if doctor.user else None,
            status=doctor.status,
            created_at=doctor.created_at
        )

    def _update_clinic_doctor_count(self, clinic_id: str) -> None:
        """
        Update the total_doctors count for a clinic.
        """
        clinic = self.db.query(Clinic).filter(
            Clinic.id == clinic_id,
            Clinic.deleted_at.is_(None)
        ).first()

        if clinic:
            # Count active, non-deleted doctors
            doctor_count = self.db.query(Doctor).filter(
                Doctor.clinic_id == clinic_id,
                Doctor.deleted_at.is_(None),
                Doctor.status == "active"
            ).count()

            clinic.total_doctors = doctor_count
            self.db.commit()
