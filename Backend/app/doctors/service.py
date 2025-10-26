"""
Doctor service with business logic and soft-delete filtering.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional, Tuple
from datetime import datetime, timezone

from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.models.user import User
from app.doctors.schema import (
    DoctorCreateRequest, 
    DoctorUpdateByClinicRequest, 
    DoctorUpdateOwnRequest,
    DoctorBasicInfo,
    DoctorDetailResponse
)
from app.core.security import SecurityUtils
from app.core.exceptions import (
    UserNotFoundException, 
    ValidationException,
    InsufficientPermissionsException, 
    UserAlreadyExistsException
)


class DoctorsService:
    """Doctor service class."""

    def __init__(self, db: Session):
        self.db = db

    # ========== CRUD Methods ==========

    def create_doctor(
        self,
        clinic_id: str,
        data: DoctorCreateRequest
    ) -> Doctor:
        """Create a new doctor profile under a clinic."""
        # Verify clinic exists
        clinic = self.db.query(Clinic).filter(
            Clinic.id == clinic_id,
            Clinic.deleted_at.is_(None)
        ).first()
        
        if not clinic:
            raise UserNotFoundException("Clinic not found")

        # Check if user with email already exists
        existing_user = self.db.query(User).filter(
            User.email == data.email,
            User.deleted_at.is_(None)
        ).first()
        
        if existing_user:
            # Check if user already has a doctor profile
            existing_doctor = self.db.query(Doctor).filter(
                Doctor.user_id == existing_user.id,
                Doctor.deleted_at.is_(None)
            ).first()
            
            if existing_doctor:
                raise UserAlreadyExistsException(
                    f"Email is already registered as a doctor."
                )
            
            # Link existing user to new doctor profile
            user_id = existing_user.id
        else:
            # Create new user for doctor
            if not data.password:
                raise ValidationException(
                    f"Password is required to create a new user account."
                )
            
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

        # Check if license number already exists
        if data.license_no:
            existing_license = self.db.query(Doctor).filter(
                Doctor.license_no == data.license_no,
                Doctor.deleted_at.is_(None)
            ).first()
            
            if existing_license:
                raise UserAlreadyExistsException(
                    f"License number is already registered to another doctor."
                )

        # Create doctor profile
        doctor = Doctor(
            user_id=user_id,
            clinic_id=clinic_id,
            specialization=data.specialization,
            license_no=data.license_no,
            experience_years=data.experience_years,
            bio=data.bio,
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

    def update_doctor_by_clinic(
        self,
        doctor_id: str,
        clinic_id: str,
        data: DoctorUpdateByClinicRequest
    ) -> Doctor:
        """Update doctor profile."""
        doctor = self.db.query(Doctor).options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).filter(
            Doctor.id == doctor_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise UserNotFoundException("Doctor not found")

        # Verify doctor belongs to clinic
        if doctor.clinic_id != clinic_id:
            raise InsufficientPermissionsException(
                "You can only update doctors in your clinic"
            )

        user = doctor.user
        
        # ========== Update User Fields (Personal Info) ==========
        
        if data.name:
            user.name = data.name
        
        if data.email and data.email != user.email:
            # Check if email already exists
            existing_user = self.db.query(User).filter(
                User.email == data.email,
                User.id != user.id,
                User.deleted_at.is_(None)
            ).first()
            
            if existing_user:
                raise UserAlreadyExistsException(
                    f"Email is already registered to another user."
                )
            
            user.email = data.email
        
        if data.phone is not None: 
            user.phone = data.phone

        # ========== Update Doctor Fields ==========
        
        if data.specialization:
            doctor.specialization = data.specialization
        
        if data.license_no and data.license_no != doctor.license_no:
            # Check if license number already exists
            existing_license = self.db.query(Doctor).filter(
                Doctor.license_no == data.license_no,
                Doctor.id != doctor_id,
                Doctor.deleted_at.is_(None)
            ).first()
            
            if existing_license:
                raise UserAlreadyExistsException(
                    f"License number is already registered to another doctor."
                )
            
            doctor.license_no = data.license_no
        
        if data.experience_years is not None:
            doctor.experience_years = data.experience_years
        
        if data.bio is not None:
            doctor.bio = data.bio
        
        # Track status change for doctor count update
        status_changed = False
        old_status = doctor.status
        
        if data.status and data.status != doctor.status:
            doctor.status = data.status
            status_changed = True

        self.db.commit()
        self.db.refresh(doctor)
        
        # Update clinic's total_doctors count if status changed
        if status_changed:
            self._update_clinic_doctor_count(clinic_id)
        
        return doctor

    def update_doctor_own_profile(
        self,
        user_id: str,
        data: DoctorUpdateOwnRequest
    ) -> Doctor:
        """
        Update doctor's own profile (doctor can update all except name and email). """
        doctor = self.db.query(Doctor).options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).filter(
            Doctor.user_id == user_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise UserNotFoundException("Doctor profile not found")

        user = doctor.user
        
        # ========== Update User Fields ==========
        
        if data.phone is not None:
            user.phone = data.phone

        # ========== Update Doctor Fields ==========
        
        # Update specialization if provided
        if data.specialization:
            doctor.specialization = data.specialization
        
        # Update license number if provided
        if data.license_no and data.license_no != doctor.license_no:
            existing_license = self.db.query(Doctor).filter(
                Doctor.license_no == data.license_no,
                Doctor.id != doctor.id,
                Doctor.deleted_at.is_(None)
            ).first()
            
            if existing_license:
                raise UserAlreadyExistsException(
                    f"License number is already registered to another doctor."
                )
            
            doctor.license_no = data.license_no
        
        # Update experience years if provided
        if data.experience_years is not None:
            doctor.experience_years = data.experience_years
        
        # Update bio if provided
        if data.bio is not None:
            doctor.bio = data.bio

        self.db.commit()
        self.db.refresh(doctor)
        return doctor

    def delete_doctor(
        self,
        doctor_id: str,
        clinic_id: str
    ) -> bool:
        """ Soft delete doctor (clinic only). """
        doctor = self.db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise UserNotFoundException("Doctor not found")

        # Verify doctor belongs to clinic
        if doctor.clinic_id != clinic_id:
            raise InsufficientPermissionsException(
                "You can only delete doctors in your clinic"
            )

        # Soft delete
        doctor.soft_delete()
        doctor.status = "inactive"

        self.db.commit()
        
        # Update clinic's total_doctors count
        self._update_clinic_doctor_count(clinic_id)
        
        return True

    # ========== Query Methods ==========

    def get_all_doctors(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[DoctorBasicInfo], int]:
        """
        Get all active doctors (public/patient view).
        
        """
        query = self.db.query(Doctor).options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).filter(
            Doctor.deleted_at.is_(None),
            Doctor.status == "active"
        )

        total = query.count()
        doctors = query.offset((page - 1) * page_size).limit(page_size).all()

        return [self._build_doctor_basic_info(doctor) for doctor in doctors], total

    def get_doctor_by_id(self, doctor_id: str) -> Optional[DoctorDetailResponse]:
        """
        Get doctor by ID (public/patient view).
        """
        doctor = self.db.query(Doctor).options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).filter(
            Doctor.id == doctor_id,
            Doctor.deleted_at.is_(None),
            Doctor.status == "active"
        ).first()

        if not doctor:
            return None

        return self._build_doctor_detail_response(doctor)

    def search_doctors(
        self,
        specialization: Optional[str] = None,
        clinic_id: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[DoctorBasicInfo], int]:
        """
        Search doctors with filters.
        
        Args:
            specialization: Filter by specialization (partial match)
            clinic_id: Filter by clinic ID
            search: Search in name or specialization
            page: Page number (1-indexed)
            page_size: Number of items per page
        
        Returns:
            Tuple of (list of doctors, total count)
        """
        query = self.db.query(Doctor).join(
            User, Doctor.user_id == User.id
        ).filter(
            Doctor.deleted_at.is_(None),
            Doctor.status == "active",
            User.deleted_at.is_(None)
        )

        if specialization:
            query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

        if clinic_id:
            query = query.filter(Doctor.clinic_id == clinic_id)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_term),
                    Doctor.specialization.ilike(search_term)
                )
            )

        total = query.count()

        doctors = query.options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).offset((page - 1) * page_size).limit(page_size).all()

        return [self._build_doctor_basic_info(doctor) for doctor in doctors], total

    def get_clinic_doctors(
        self,
        clinic_id: str,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[DoctorBasicInfo], int]:
        """
        Get all doctors in a clinic (public/patient view).
        """
        query = self.db.query(Doctor).options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).filter(
            Doctor.clinic_id == clinic_id,
            Doctor.deleted_at.is_(None),
            Doctor.status == "active"
        )

        total = query.count()
        doctors = query.offset((page - 1) * page_size).limit(page_size).all()

        return [self._build_doctor_basic_info(doctor) for doctor in doctors], total

    def get_doctor_by_user_id(self, user_id: str) -> Optional[Doctor]:
        """
        Get doctor by user ID.
        
        Args:
            user_id: ID of the user
        
        Returns:
            Doctor object or None if not found
        """
        return self.db.query(Doctor).options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).filter(
            Doctor.user_id == user_id,
            Doctor.deleted_at.is_(None)
        ).first()

    # ==========  NEW METHOD - ADD THIS ========== 

    def get_all_clinic_doctors_detailed(self, clinic_id: str) -> List[DoctorDetailResponse]:
        """
        Get all doctors in a clinic with detailed info (for clinic owner).
        """
        doctors = self.db.query(Doctor).options(
            joinedload(Doctor.user),
            joinedload(Doctor.clinic).joinedload(Clinic.user)
        ).filter(
            Doctor.clinic_id == clinic_id,
            Doctor.deleted_at.is_(None)  # Exclude soft-deleted
        ).order_by(Doctor.created_at.desc()).all()

        return [self._build_doctor_detail_response(doctor) for doctor in doctors]

    # ========== Helper Methods ==========

    def _build_doctor_basic_info(self, doctor: Doctor) -> DoctorBasicInfo:
        """Build DoctorBasicInfo from doctor model."""
        return DoctorBasicInfo(
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

    def _build_doctor_detail_response(self, doctor: Doctor) -> DoctorDetailResponse:
        """Build DoctorDetailResponse from doctor model."""
        return DoctorDetailResponse(
            id=doctor.id,
            user_id=doctor.user_id,
            name=doctor.user.name if doctor.user else None,
            email=doctor.user.email if doctor.user else None,
            phone=doctor.user.phone if doctor.user else None,
            specialization=doctor.specialization,
            license_no=doctor.license_no,
            experience_years=doctor.experience_years,
            bio=doctor.bio,
            clinic_id=doctor.clinic_id,
            clinic_name=doctor.clinic.user.name if doctor.clinic and doctor.clinic.user else None,
            clinic_address=doctor.clinic.address if doctor.clinic else None,
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