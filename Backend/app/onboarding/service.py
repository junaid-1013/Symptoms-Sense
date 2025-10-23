"""
Onboarding service for patient and doctor data business logic.
"""
from sqlalchemy.orm import Session
from typing import Optional

from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.models.user import User
from app.onboarding.schema import PatientOnboardingRequest, PatientOnboardingResponse, DoctorOnboardingRequest, DoctorOnboardingResponse, ClinicOnboardingRequest, ClinicOnboardingResponse
from app.core.exceptions import UserNotFoundException, UserAlreadyExistsException

class OnboardingService:
    """Onboarding service class."""

    def __init__(self, db: Session):
        self.db = db

    def get_patient_by_user_id(self, user_id: str) -> Optional[Patient]:
        """Get patient by user ID."""
        return self.db.query(Patient).filter(Patient.user_id == user_id).first()

    def create_patient_profile(self, user_id: str, onboarding_data: PatientOnboardingRequest) -> Patient:
        """Create a new patient profile."""
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundException()

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
        return patient

    def update_patient_profile(self, user_id: str, onboarding_data: PatientOnboardingRequest) -> Patient:
        """Update existing patient profile."""
        patient = self.get_patient_by_user_id(user_id)
        if not patient:
            raise UserNotFoundException("Patient profile not found")

        # Update fields
        patient.age = onboarding_data.age
        patient.gender = onboarding_data.gender
        patient.blood_group = onboarding_data.blood_group
        patient.emergency_contact = onboarding_data.emergency_contact
        patient.address = onboarding_data.address

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundException()
        # Set user_type to patient
        user.user_type = "patient"

        self.db.commit()
        self.db.refresh(patient)
        return patient

    def get_or_create_patient_profile(self, user_id: str, onboarding_data: PatientOnboardingRequest) -> Patient:
        """Get existing patient profile or create new one."""
        patient = self.get_patient_by_user_id(user_id)
        if patient:
            return self.update_patient_profile(user_id, onboarding_data)
        else:
            return self.create_patient_profile(user_id, onboarding_data)

    def get_doctor_by_user_id(self, user_id: str) -> Optional[Doctor]:
        """Get doctor by user ID."""
        return self.db.query(Doctor).filter(Doctor.user_id == user_id).first()

    def create_doctor_profile(self, user_id: str, onboarding_data: DoctorOnboardingRequest) -> Doctor:
        """Create a new doctor profile."""
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundException()

        # Check if doctor profile already exists
        existing_doctor = self.get_doctor_by_user_id(user_id)
        if existing_doctor:
            raise UserAlreadyExistsException("Doctor profile already exists")

        # Create doctor profile
        doctor = Doctor(
            user_id=user_id,
            specialization=onboarding_data.specialization,
            license_no=onboarding_data.license_no,
            experience_years=onboarding_data.experience_years,
            bio=onboarding_data.bio,
            clinic_id=onboarding_data.clinic_id
        )

        # Set user_type to doctor
        user.user_type = "doctor"

        self.db.add(doctor)
        self.db.commit()
        self.db.refresh(doctor)
        return doctor

    def update_doctor_profile(self, user_id: str, onboarding_data: DoctorOnboardingRequest) -> Doctor:
        """Update existing doctor profile."""
        doctor = self.get_doctor_by_user_id(user_id)
        if not doctor:
            raise UserNotFoundException("Doctor profile not found")

        # Update fields
        doctor.specialization = onboarding_data.specialization
        doctor.license_no = onboarding_data.license_no
        doctor.experience_years = onboarding_data.experience_years
        doctor.bio = onboarding_data.bio
        doctor.clinic_id = onboarding_data.clinic_id

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundException()
        # Set user_type to doctor
        user.user_type = "doctor"

        self.db.commit()
        self.db.refresh(doctor)
        return doctor

    def get_or_create_doctor_profile(self, user_id: str, onboarding_data: DoctorOnboardingRequest) -> Doctor:
        """Get existing doctor profile or create new one."""
        doctor = self.get_doctor_by_user_id(user_id)
        if doctor:
            return self.update_doctor_profile(user_id, onboarding_data)
        else:
            return self.create_doctor_profile(user_id, onboarding_data)

    def get_clinic_by_user_id(self, user_id: str) -> Optional[Clinic]:
        """Get clinic by user ID."""
        return self.db.query(Clinic).filter(Clinic.user_id == user_id).first()

    def create_clinic_profile(self, user_id: str, onboarding_data: ClinicOnboardingRequest) -> Clinic:
        """Create a new clinic profile."""
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundException()

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
            total_doctors=onboarding_data.total_doctors
        )

        # Set user_type to clinic
        user.user_type = "clinic"

        self.db.add(clinic)
        self.db.commit()
        self.db.refresh(clinic)
        return clinic

    def update_clinic_profile(self, user_id: str, onboarding_data: ClinicOnboardingRequest) -> Clinic:
        """Update existing clinic profile."""
        clinic = self.get_clinic_by_user_id(user_id)
        if not clinic:
            raise UserNotFoundException("Clinic profile not found")

        # Update fields
        clinic.address = onboarding_data.address
        clinic.registration_no = onboarding_data.registration_no
        clinic.established_year = onboarding_data.established_year
        clinic.total_doctors = onboarding_data.total_doctors

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise UserNotFoundException()
        # Set user_type to clinic
        user.user_type = "clinic"

        self.db.commit()
        self.db.refresh(clinic)
        return clinic

    def get_or_create_clinic_profile(self, user_id: str, onboarding_data: ClinicOnboardingRequest) -> Clinic:
        """Get existing clinic profile or create new one."""
        clinic = self.get_clinic_by_user_id(user_id)
        if clinic:
            return self.update_clinic_profile(user_id, onboarding_data)
        else:
            return self.create_clinic_profile(user_id, onboarding_data)
