"""
Onboarding service for patient, doctor, and clinic data business logic.
"""
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.models.user import User
from app.onboarding.schema import (
    PatientOnboardingRequest, 
    DoctorOnboardingRequest, 
    ClinicOnboardingRequest
)
from app.core.exceptions import UserNotFoundException, UserAlreadyExistsException


class OnboardingService:
    """Onboarding service class."""

    def __init__(self, db: Session):
        self.db = db

    # ========== Patient Methods ==========

    def get_patient_by_user_id(self, user_id: str) -> Optional[Patient]:
        """Get patient by user ID."""
        return self.db.query(Patient).filter(
            Patient.user_id == user_id,
            Patient.deleted_at.is_(None)
        ).first()

    def create_patient_profile(self, user_id: str, onboarding_data: PatientOnboardingRequest) -> Patient:
        """Create a new patient profile."""
        # Check if user exists
        user = self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()
        
        if not user:
            raise UserNotFoundException("User not found")

        # Check if patient profile already exists
        existing_patient = self.get_patient_by_user_id(user_id)
        if existing_patient:
            raise UserAlreadyExistsException("Patient profile already exists")

        # Create patient profile
        patient = Patient(
            user_id=user_id,
            age=onboarding_data.age,
            gender=onboarding_data.gender,
            blood_group=onboarding_data.blood_group,
            emergency_contact=onboarding_data.emergency_contact,
            address=onboarding_data.address
        )

        # Set user_type to patient
        user.user_type = "patient"

        self.db.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        
        # Load user relationship for complete response
        patient = self.db.query(Patient).options(
            joinedload(Patient.user)
        ).filter(Patient.id == patient.id).first()
        
        return patient

    def update_patient_profile(self, user_id: str, onboarding_data: PatientOnboardingRequest) -> Patient:
        """Update existing patient profile."""
        patient = self.db.query(Patient).options(
            joinedload(Patient.user)
        ).filter(
            Patient.user_id == user_id,
            Patient.deleted_at.is_(None)
        ).first()
        
        if not patient:
            raise UserNotFoundException("Patient profile not found")

        # Update fields
        patient.age = onboarding_data.age
        patient.gender = onboarding_data.gender
        patient.blood_group = onboarding_data.blood_group
        patient.emergency_contact = onboarding_data.emergency_contact
        patient.address = onboarding_data.address

        self.db.commit()
        self.db.refresh(patient)
        return patient

    # ========== Doctor Methods ==========

    def get_doctor_by_user_id(self, user_id: str) -> Optional[Doctor]:
        """Get doctor by user ID (excludes soft-deleted)."""
        return self.db.query(Doctor).filter(
            Doctor.user_id == user_id,
            Doctor.deleted_at.is_(None)
        ).first()

    def create_doctor_profile(self, user_id: str, onboarding_data: DoctorOnboardingRequest) -> Doctor:
        """Create a new doctor profile."""
        # Check if user exists
        user = self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()

        if not user:
            raise UserNotFoundException("User not found")

        
        # Doctor must exist (created by clinic)
        doctor_profile = self.db.query(Doctor).filter(
            Doctor.user_id == user_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor_profile:
            raise UserNotFoundException("Doctor profile not found. Please ensure you were registered by a clinic first.")

        if doctor_profile.specializations and doctor_profile.license_no:
            raise UserAlreadyExistsException("Doctor already onboarded")
        
        # Update doctor profile with onboarding data
        doctor_profile.specializations = onboarding_data.specializations
        doctor_profile.services = onboarding_data.services if onboarding_data.services else []
        doctor_profile.education = onboarding_data.education
        doctor_profile.experience = onboarding_data.experience if onboarding_data.experience else []
        doctor_profile.license_no = onboarding_data.license_no
        doctor_profile.experience_years = onboarding_data.experience_years
        doctor_profile.bio = onboarding_data.bio
        # clinic_id is already set from clinic registration

        user.user_type = "doctor"
        self.db.commit()
        self.db.refresh(doctor_profile)
        return doctor_profile

    # def update_doctor_profile(self, user_id: str, onboarding_data: DoctorOnboardingRequest) -> Doctor:
    #     """Update existing doctor profile."""
    #     doctor = self.get_doctor_by_user_id(user_id)
    #     if not doctor:
    #         raise UserNotFoundException("Doctor profile not found")

    #     # Verify clinic exists if clinic_id is provided
    #     if onboarding_data.clinic_id:
    #         clinic = self.db.query(Clinic).filter(
    #             Clinic.id == onboarding_data.clinic_id,
    #             Clinic.deleted_at.is_(None)
    #         ).first()
            
    #         if not clinic:
    #             raise UserNotFoundException("Clinic not found")

    #     # Update fields
    #     doctor.specialization = onboarding_data.specialization
    #     doctor.license_no = onboarding_data.license_no
    #     doctor.experience_years = onboarding_data.experience_years
    #     doctor.bio = onboarding_data.bio
    #     doctor.clinic_id = onboarding_data.clinic_id

    #     self.db.commit()
    #     self.db.refresh(doctor)
    #     return doctor

    # ========== Clinic Methods ==========

    def get_clinic_by_user_id(self, user_id: str) -> Optional[Clinic]:
        """Get clinic by user ID (excludes soft-deleted)."""
        return self.db.query(Clinic).filter(
            Clinic.user_id == user_id,
            Clinic.deleted_at.is_(None)
        ).first()

    def create_clinic_profile(self, user_id: str, onboarding_data: ClinicOnboardingRequest) -> Clinic:
        """Create a new clinic profile."""
        # Check if user exists
        user = self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()
        
        if not user:
            raise UserNotFoundException("User not found")

        # Check if clinic profile already exists
        existing_clinic = self.get_clinic_by_user_id(user_id)
        if existing_clinic:
            raise UserAlreadyExistsException("Clinic profile already exists")

        # Create clinic profile
        clinic = Clinic(
            user_id=user_id,
            address=onboarding_data.address,
            registration_no=onboarding_data.registration_no,
            established_year=onboarding_data.established_year,
            total_doctors=0 
        )
        # Set user_type to Clinic
        user.user_type = "clinic"
        self.db.add(clinic)
        self.db.commit()
        self.db.refresh(clinic)
        
        # Load user relationship for complete response
        clinic = self.db.query(Clinic).options(
            joinedload(Clinic.user)
        ).filter(Clinic.id == clinic.id).first()
        
        return clinic

    def update_clinic_profile(self, user_id: str, onboarding_data: ClinicOnboardingRequest) -> Clinic:
        """Update existing clinic profile."""
        clinic = self.db.query(Clinic).options(
            joinedload(Clinic.user)
        ).filter(
            Clinic.user_id == user_id,
            Clinic.deleted_at.is_(None)
        ).first()
        
        if not clinic:
            raise UserNotFoundException("Clinic profile not found")

        # Update fields
        clinic.address = onboarding_data.address
        clinic.registration_no = onboarding_data.registration_no
        clinic.established_year = onboarding_data.established_year

        self.db.commit()
        self.db.refresh(clinic)
        return clinic

    def recalculate_clinic_doctors_count(self, clinic_id: str) -> int:
        """
        Recalculate and update the total_doctors count for a clinic.
        This should be called whenever doctors are added/removed.
        """
        clinic = self.db.query(Clinic).filter(
            Clinic.id == clinic_id,
            Clinic.deleted_at.is_(None)
        ).first()
        
        if not clinic:
            raise UserNotFoundException("Clinic not found")

        # Count active doctors
        doctor_count = self.db.query(Doctor).filter(
            Doctor.clinic_id == clinic_id,
            Doctor.deleted_at.is_(None),
            Doctor.status == "active"
        ).count()

        # Update the count
        clinic.total_doctors = doctor_count
        self.db.commit()
        
        return doctor_count

    # ========== Helper Methods for Complete Responses ==========

    def build_patient_response(self, patient: Patient) -> dict:
        """Build complete patient response with user details."""
        return {
            # Patient fields
            "id": patient.id,
            "user_id": patient.user_id,
            "age": patient.age,
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "emergency_contact": patient.emergency_contact,
            "address": patient.address,
            "created_at": patient.created_at,
            
            # User fields
            "user_email": patient.user.email if patient.user else None,
            "user_name": patient.user.name if patient.user else None,
            "user_phone": patient.user.phone if patient.user else None,
            "user_type": patient.user.user_type if patient.user else None,
            "is_active": patient.user.is_active if patient.user else None,
            "last_login": patient.user.last_login if patient.user else None,
            "google_id": patient.user.google_id if patient.user else None,
            "avatar_url": patient.user.avatar_url if patient.user else None,
            "is_email_verified": patient.user.is_email_verified if patient.user else None,
            "email_verification_token": patient.user.email_verification_token if patient.user else None,
            "password_reset_token": patient.user.password_reset_token if patient.user else None,
            "password_reset_expires": patient.user.password_reset_expires if patient.user else None,
        }

    def build_clinic_response(self, clinic: Clinic) -> dict:
        """Build complete clinic response with user details."""
        return {
            # Clinic fields
            "id": clinic.id,
            "user_id": clinic.user_id,
            "address": clinic.address,
            "registration_no": clinic.registration_no,
            "established_year": clinic.established_year,
            "total_doctors": clinic.total_doctors,
            "status": clinic.status,
            "created_at": clinic.created_at,
            
            # User fields
            "user_email": clinic.user.email if clinic.user else None,
            "user_name": clinic.user.name if clinic.user else None,
            "user_phone": clinic.user.phone if clinic.user else None,
            "user_type": clinic.user.user_type if clinic.user else None,
            "is_active": clinic.user.is_active if clinic.user else None,
            "last_login": clinic.user.last_login if clinic.user else None,
            "google_id": clinic.user.google_id if clinic.user else None,
            "avatar_url": clinic.user.avatar_url if clinic.user else None,
            "is_email_verified": clinic.user.is_email_verified if clinic.user else None,
            "email_verification_token": clinic.user.email_verification_token if clinic.user else None,
            "password_reset_token": clinic.user.password_reset_token if clinic.user else None,
            "password_reset_expires": clinic.user.password_reset_expires if clinic.user else None,
        }