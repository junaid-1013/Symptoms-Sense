"""
Appointment service with business logic.
"""
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.models.doctor import Timeslot
from app.models.user import User
from app.schedules.service import DoctorScheduleService
from app.schedules.schema import CreateTimeslotFromVirtualRequest
from app.appointments.schema import (
    AppointmentCreateRequest,
    AppointmentUpdateRequest,
    AppointmentResponse,
    PatientNestedResponse,
    DoctorNestedResponse,
    ClinicNestedResponse,
    TimeslotNestedResponse
)
from app.core.constants import UserType
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException,
    InsufficientPermissionsException,
)


class AppointmentService:
    """Appointment service class."""

    class AppointmentStatus:
        PENDING = "pending"
        SCHEDULED = "scheduled"
        COMPLETED = "completed"
        CANCELLED = "cancelled"

        LOCKING_STATUSES = {PENDING, SCHEDULED}

    def __init__(self, db: Session):
        self.db = db

    def create_appointment(
        self,
        data: AppointmentCreateRequest,
        created_by: str = UserType.PATIENT
    ) -> Appointment:
        """Create a new appointment."""
        if created_by not in (UserType.PATIENT, UserType.CLINIC):
            raise ValidationException("Only patients or clinics can create appointments")

        # Verify patient exists
        patient = self.db.query(Patient).filter(
            Patient.id == data.patient_id,
            Patient.deleted_at.is_(None)
        ).first()

        if not patient:
            raise UserNotFoundException("Patient not found")

        # Verify doctor exists
        doctor = self.db.query(Doctor).filter(
            Doctor.id == data.doctor_id,
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise UserNotFoundException("Doctor not found")

        # Determine clinic
        clinic_id = data.clinic_id or doctor.clinic_id
        clinic = self.db.query(Clinic).filter(
            Clinic.id == clinic_id,
            Clinic.deleted_at.is_(None)
        ).first()

        if not clinic:
            raise UserNotFoundException("Clinic not found")

        data.clinic_id = clinic.id

        # Handle timeslot - either use existing or create from virtual slot
        timeslot = None
        
        if data.timeslot_id:
            # Use existing timeslot
            timeslot = self.db.query(Timeslot).filter(
                Timeslot.id == data.timeslot_id,
                Timeslot.doctor_id == data.doctor_id,
                Timeslot.deleted_at.is_(None)
            ).first()

            if not timeslot:
                raise UserNotFoundException("Timeslot not found")

            if not timeslot.is_available:
                raise ValidationException("The selected timeslot is no longer available")

            # Check if timeslot already has an appointment (race condition check)
            existing_appointment = self.db.query(Appointment).filter(
                Appointment.timeslot_id == data.timeslot_id,
                Appointment.status.in_(self.AppointmentStatus.LOCKING_STATUSES),
                Appointment.deleted_at.is_(None)
            ).first()

            if existing_appointment:
                raise ValidationException("This timeslot is already booked")
        else:
            # Create timeslot from virtual slot data
            if not data.start_time or not data.end_time:
                raise ValidationException("Either timeslot_id or both start_time and end_time must be provided")
            
            normalized_start = self._normalize_datetime(data.start_time)
            normalized_end = self._normalize_datetime(data.end_time)

            # Validate slot is in the future
            if normalized_start <= datetime.utcnow():
                raise ValidationException("Cannot book appointments in the past")
            
            if normalized_end <= normalized_start:
                raise ValidationException("End time must be after start time")
            
            # Use schedule service to create timeslot from virtual slot
            schedule_service = DoctorScheduleService(self.db)
            try:
                timeslot = schedule_service.create_timeslot_from_virtual(
                    doctor_id=data.doctor_id,
                    data=CreateTimeslotFromVirtualRequest(
                        start_time=normalized_start,
                        end_time=normalized_end,
                        generated_from_schedule=data.generated_from_schedule
                    )
                )
                
                # Re-check availability after creation (race condition)
                if not timeslot.is_available:
                    raise ValidationException("The selected timeslot is no longer available")
                
                # Final check for existing appointment
                existing_appointment = self.db.query(Appointment).filter(
                    Appointment.timeslot_id == timeslot.id,
                    Appointment.status.in_(self.AppointmentStatus.LOCKING_STATUSES),
                    Appointment.deleted_at.is_(None)
                ).first()

                if existing_appointment:
                    raise ValidationException("This timeslot was just booked by another user")
                    
            except Exception as e:
                if isinstance(e, (ValidationException, UserNotFoundException)):
                    raise
                raise ValidationException(f"Failed to create timeslot: {str(e)}")

        # Verify doctor belongs to clinic
        if doctor.clinic_id != data.clinic_id:
            raise ValidationException("Doctor does not belong to the specified clinic")

        # Final validation: Check slot is still available (race condition protection)
        self.db.refresh(timeslot)
        if not timeslot.is_available:
            raise ValidationException("The selected timeslot is no longer available")

        # Mark timeslot as unavailable before creating appointment
        timeslot.is_available = False

        # Create appointment
        appointment = Appointment(
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            clinic_id=data.clinic_id,
            timeslot_id=timeslot.id,  # Use the timeslot ID (either existing or newly created)
            status=self.AppointmentStatus.PENDING,
            appointment_type=data.appointment_type,
            chief_complaint=data.chief_complaint
        )

        self.db.add(appointment)
        self.db.commit()
        
        appointment = self.db.query(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.clinic).joinedload(Clinic.user),
            joinedload(Appointment.timeslot)
        ).filter(Appointment.id == appointment.id).first()
        
        return appointment
    
    def get_patient_appointments(
        self,
        patient_id: str
    ) -> List[AppointmentResponse]:
        """Get all appointments for a patient."""
        appointments = self.db.query(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.clinic).joinedload(Clinic.user),
            joinedload(Appointment.timeslot)
        ).filter(
            Appointment.patient_id == patient_id,
            Appointment.deleted_at.is_(None)
        ).order_by(Appointment.created_at.desc()).all()

        return [self._build_appointment_response(appt) for appt in appointments]
    
    def get_clinic_appointments(
        self,
        clinic_id: str
    ) -> List[AppointmentResponse]:
        """Get all appointments for a clinic."""
        appointments = self.db.query(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.clinic).joinedload(Clinic.user),
            joinedload(Appointment.timeslot)
        ).filter(
            Appointment.clinic_id == clinic_id,
            Appointment.deleted_at.is_(None)
        ).order_by(Appointment.created_at.desc()).all()

        return [self._build_appointment_response(appt) for appt in appointments]
    
    def update_appointment(
        self,
        appointment_id: str,
        data: AppointmentUpdateRequest
    ) -> Appointment:
        """Update an appointment."""
        # Get the existing appointment
        appointment = self.db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.deleted_at.is_(None)
        ).first()
        
        if not appointment:
            raise UserNotFoundException("Appointment not found")
        
        # Check if doctor or timeslot is being changed
        time_related_change = data.doctor_id is not None or data.timeslot_id is not None
        
        # If changing doctor or timeslot, check 24-hour rule
        if time_related_change and appointment.timeslot_id:
            timeslot = self.db.query(Timeslot).filter(
                Timeslot.id == appointment.timeslot_id
            ).first()
            
            if timeslot:
                # Check if appointment is more than 24 hours away
                now = datetime.utcnow()
                appointment_time = self._normalize_datetime(timeslot.start_time)
                
                time_difference = appointment_time - now
                
                if time_difference.total_seconds() < 86400:  # 24 hours = 86400 seconds
                    raise ValidationException(
                        "Cannot change doctor or timeslot less than 24 hours before the appointment"
                    )
        
        # Validate new doctor if provided
        if data.doctor_id:
            doctor = self.db.query(Doctor).filter(
                Doctor.id == data.doctor_id,
                Doctor.deleted_at.is_(None)
            ).first()
            
            if not doctor:
                raise UserNotFoundException("Doctor not found")
            
            # Verify doctor belongs to the same clinic
            if doctor.clinic_id != appointment.clinic_id:
                raise ValidationException("Doctor does not belong to the specified clinic")
        
        # Validate new timeslot if provided
        old_timeslot_id = appointment.timeslot_id
        if data.timeslot_id:
            timeslot = self.db.query(Timeslot).filter(
                Timeslot.id == data.timeslot_id,
                Timeslot.deleted_at.is_(None)
            ).first()
            
            if not timeslot:
                raise UserNotFoundException("Timeslot not found")
            
            # If doctor changed, verify timeslot belongs to new doctor
            if data.doctor_id:
                if timeslot.doctor_id != data.doctor_id:
                    raise ValidationException("Timeslot does not belong to the specified doctor")
            else:
                # If same doctor, verify timeslot belongs to current doctor
                if timeslot.doctor_id != appointment.doctor_id:
                    raise ValidationException("Timeslot does not belong to the current doctor")
            
            if not timeslot.is_available:
                raise ValidationException("The selected timeslot is no longer available")
            
            # Check if timeslot already has an appointment (excluding current appointment)
            existing_appointment = self.db.query(Appointment).filter(
                Appointment.timeslot_id == data.timeslot_id,
                Appointment.id != appointment_id,
                Appointment.status.in_(self.AppointmentStatus.LOCKING_STATUSES),
                Appointment.deleted_at.is_(None)
            ).first()
            
            if existing_appointment:
                raise ValidationException("This timeslot is already booked")
        
        # Make old timeslot available if changing timeslot
        if data.timeslot_id and old_timeslot_id and old_timeslot_id != data.timeslot_id:
            old_timeslot = self.db.query(Timeslot).filter(Timeslot.id == old_timeslot_id).first()
            if old_timeslot:
                old_timeslot.is_available = True
        
        # Update appointment fields
        if data.doctor_id:
            appointment.doctor_id = data.doctor_id
        if data.timeslot_id:
            appointment.timeslot_id = data.timeslot_id
            # Mark new timeslot as unavailable
            new_timeslot = self.db.query(Timeslot).filter(Timeslot.id == data.timeslot_id).first()
            if new_timeslot:
                new_timeslot.is_available = False
        if data.appointment_type is not None:
            appointment.appointment_type = data.appointment_type
        if data.chief_complaint is not None:
            appointment.chief_complaint = data.chief_complaint
        
        self.db.commit()
        
        appointment = self.db.query(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.clinic).joinedload(Clinic.user),
            joinedload(Appointment.timeslot)
        ).filter(Appointment.id == appointment.id).first()
        
        return appointment
    
    def get_appointment_by_id(
        self,
        appointment_id: str
    ) -> Optional[AppointmentResponse]:
        """Get a specific appointment by ID."""
        appointment = self.db.query(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.clinic).joinedload(Clinic.user),
            joinedload(Appointment.timeslot)
        ).filter(
            Appointment.id == appointment_id,
            Appointment.deleted_at.is_(None)
        ).first()
        
        if not appointment:
            return None
        
        return self._build_appointment_response(appointment)
    
    def get_appointment_model_by_id(
        self,
        appointment_id: str
    ) -> Optional[Appointment]:
        """Get appointment model by ID."""
        appointment = self.db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.deleted_at.is_(None)
        ).first()
        
        return appointment

    def _get_patient_by_user_id(self, user_id: str) -> Patient:
        """Get patient profile for user; raises UserNotFoundException if not found."""
        patient = self.db.query(Patient).filter(
            Patient.user_id == user_id,
            Patient.deleted_at.is_(None)
        ).first()
        if not patient:
            raise UserNotFoundException("Patient profile not found")
        return patient

    def _get_doctor_by_user_id(self, user_id: str) -> Doctor:
        """Get doctor profile for user; raises UserNotFoundException if not found."""
        doctor = self.db.query(Doctor).filter(
            Doctor.user_id == user_id,
            Doctor.deleted_at.is_(None)
        ).first()
        if not doctor:
            raise UserNotFoundException("Doctor profile not found")
        return doctor

    def _get_clinic_by_user_id(self, user_id: str) -> Clinic:
        """Get clinic profile for user; raises UserNotFoundException if not found."""
        clinic = self.db.query(Clinic).filter(
            Clinic.user_id == user_id,
            Clinic.deleted_at.is_(None)
        ).first()
        if not clinic:
            raise UserNotFoundException("Clinic profile not found")
        return clinic

    def _doctor_owned_by_clinic(self, doctor_id: str, clinic_id: str) -> bool:
        """Return True if the doctor belongs to the clinic."""
        doctor = self.db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.clinic_id == clinic_id,
            Doctor.deleted_at.is_(None)
        ).first()
        return doctor is not None

    def create_appointment_as_user(
        self, user_id: str, user_type: str, data: AppointmentCreateRequest
    ) -> tuple[Appointment, List[AppointmentResponse]]:
        """
        Create an appointment on behalf of the current user (patient or clinic).
        Resolves patient/clinic from user_id and user_type, validates ownership, then creates.
        Returns (created appointment, list of appointments for response).
        """
        if user_type == UserType.PATIENT:
            patient = self._get_patient_by_user_id(user_id)
            data.patient_id = patient.id
            doctor = self.db.query(Doctor).filter(
                Doctor.id == data.doctor_id,
                Doctor.deleted_at.is_(None)
            ).first()
            if not doctor:
                raise UserNotFoundException("Doctor not found")
            data.clinic_id = doctor.clinic_id
            created_by = UserType.PATIENT
        elif user_type == UserType.CLINIC:
            clinic = self._get_clinic_by_user_id(user_id)
            data.clinic_id = clinic.id
            if not self._doctor_owned_by_clinic(data.doctor_id, clinic.id):
                raise ValidationException("Doctor does not belong to your clinic")
            patient = self.db.query(Patient).filter(
                Patient.id == data.patient_id,
                Patient.deleted_at.is_(None)
            ).first()
            if not patient:
                raise UserNotFoundException("Patient not found")
            created_by = UserType.CLINIC
        else:
            raise InsufficientPermissionsException("Only patients or clinics can create appointments")

        appointment = self.create_appointment(data=data, created_by=created_by)
        if user_type == UserType.PATIENT:
            appointments = self.get_patient_appointments(patient.id)
        else:
            appointments = self.get_clinic_appointments(clinic.id)
        return appointment, appointments

    def update_appointment_as_user(
        self, user_id: str, user_type: str, appointment_id: str, data: AppointmentUpdateRequest
    ) -> List[AppointmentResponse]:
        """
        Update an appointment; verifies the user (patient or clinic) owns it.
        Returns list of appointments for response.
        """
        appointment = self.get_appointment_model_by_id(appointment_id)
        if not appointment:
            raise UserNotFoundException("Appointment not found")
        if user_type == UserType.PATIENT:
            patient = self._get_patient_by_user_id(user_id)
            if appointment.patient_id != patient.id:
                raise InsufficientPermissionsException("You don't have permission to update this appointment")
            self.update_appointment(appointment_id=appointment_id, data=data)
            return self.get_patient_appointments(patient.id)
        elif user_type == UserType.CLINIC:
            clinic = self._get_clinic_by_user_id(user_id)
            if appointment.clinic_id != clinic.id:
                raise InsufficientPermissionsException("You don't have permission to update this appointment")
            self.update_appointment(appointment_id=appointment_id, data=data)
            return self.get_clinic_appointments(clinic.id)
        else:
            raise InsufficientPermissionsException("Only patients or clinics can update appointments")

    def approve_appointment_as_user(
        self, user_id: str, user_type: str, appointment_id: str
    ) -> List[AppointmentResponse]:
        """
        Approve an appointment (doctor or clinic); verifies ownership.
        Returns list of appointments for response.
        """
        appointment = self.get_appointment_model_by_id(appointment_id)
        if not appointment:
            raise UserNotFoundException("Appointment not found")
        if user_type == UserType.DOCTOR:
            doctor = self._get_doctor_by_user_id(user_id)
            if appointment.doctor_id != doctor.id:
                raise InsufficientPermissionsException("You don't have permission to approve this appointment")
            self.approve_appointment(appointment_id=appointment_id, approver_type=UserType.DOCTOR, approver_entity_id=doctor.id)
            return self.get_doctor_appointments(doctor.id)
        elif user_type == UserType.CLINIC:
            clinic = self._get_clinic_by_user_id(user_id)
            if appointment.clinic_id != clinic.id:
                raise InsufficientPermissionsException("You don't have permission to approve this appointment")
            self.approve_appointment(appointment_id=appointment_id, approver_type=UserType.CLINIC, approver_entity_id=clinic.id)
            return self.get_clinic_appointments(clinic.id)
        else:
            raise InsufficientPermissionsException("Only doctors or clinics can approve appointments")

    def cancel_appointment_as_user(self, user_id: str, user_type: str, appointment_id: str) -> List[AppointmentResponse]:
        """
        Cancel an appointment (patient, doctor, or clinic); verifies ownership.
        Returns list of appointments for response.
        """
        appointment = self.get_appointment_model_by_id(appointment_id)
        if not appointment:
            raise UserNotFoundException("Appointment not found")
        if user_type == UserType.PATIENT:
            patient = self._get_patient_by_user_id(user_id)
            if appointment.patient_id != patient.id:
                raise InsufficientPermissionsException("You don't have permission to cancel this appointment")
            self.cancel_appointment(appointment_id=appointment_id)
            return self.get_patient_appointments(patient.id)
        elif user_type == UserType.DOCTOR:
            doctor = self._get_doctor_by_user_id(user_id)
            if appointment.doctor_id != doctor.id:
                raise InsufficientPermissionsException("You don't have permission to cancel this appointment")
            self.cancel_appointment(appointment_id=appointment_id)
            return self.get_doctor_appointments(doctor.id)
        elif user_type == UserType.CLINIC:
            clinic = self._get_clinic_by_user_id(user_id)
            if appointment.clinic_id != clinic.id:
                raise InsufficientPermissionsException("You don't have permission to cancel this appointment")
            self.cancel_appointment(appointment_id=appointment_id)
            return self.get_clinic_appointments(clinic.id)
        else:
            raise InsufficientPermissionsException("Only patients, doctors, or clinics can cancel appointments")

    def get_my_appointments(self, user_id: str, user_type: str) -> List[AppointmentResponse]:
        """
        Get appointments for the current user (patient, doctor, or clinic).
        Raises InsufficientPermissionsException if user_type is not allowed.
        """
        if user_type == UserType.PATIENT:
            patient = self._get_patient_by_user_id(user_id)
            return self.get_patient_appointments(patient.id)
        elif user_type == UserType.DOCTOR:
            doctor = self._get_doctor_by_user_id(user_id)
            return self.get_doctor_appointments(doctor.id)
        elif user_type == UserType.CLINIC:
            clinic = self._get_clinic_by_user_id(user_id)
            return self.get_clinic_appointments(clinic.id)
        else:
            raise InsufficientPermissionsException("Invalid user type")

    def approve_appointment(
        self,
        appointment_id: str,
        approver_type: str,
        approver_entity_id: str
    ) -> Appointment:
        """
        Approve an appointment (change status from pending to scheduled).
        Only the assigned doctor or the owning clinic can approve.
        """
        appointment = self.get_appointment_model_by_id(appointment_id)
        
        if not appointment:
            raise UserNotFoundException("Appointment not found")
        
        if appointment.status != self.AppointmentStatus.PENDING:
            raise ValidationException(f"Cannot approve appointment with status: {appointment.status}")

        approver_type = approver_type.lower() if isinstance(approver_type, str) else approver_type
        if approver_type not in (UserType.DOCTOR, UserType.CLINIC):
            raise ValidationException("Only doctors or clinics can approve appointments")

        if approver_type == UserType.DOCTOR:
            if appointment.doctor_id != approver_entity_id:
                raise ValidationException("Doctor does not have permission to approve this appointment")
        else:
            if appointment.clinic_id != approver_entity_id:
                raise ValidationException("Clinic does not have permission to approve this appointment")
        
        appointment.status = self.AppointmentStatus.SCHEDULED
        
        self.db.commit()
        
        appointment = self.db.query(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.clinic).joinedload(Clinic.user),
            joinedload(Appointment.timeslot)
        ).filter(Appointment.id == appointment.id).first()
        
        return appointment
    
    def cancel_appointment(
        self,
        appointment_id: str
    ) -> Appointment:
        """Cancel an appointment."""
        appointment = self.get_appointment_model_by_id(appointment_id)
        
        if not appointment:
            raise UserNotFoundException("Appointment not found")
        
        # Check 24-hour rule if appointment has a timeslot
        if appointment.timeslot_id and appointment.status in self.AppointmentStatus.LOCKING_STATUSES:
            timeslot = self.db.query(Timeslot).filter(
                Timeslot.id == appointment.timeslot_id
            ).first()
            
            if timeslot:
                # Check if appointment is more than 24 hours away
                now = datetime.utcnow()
                appointment_time = self._normalize_datetime(timeslot.start_time)
                
                time_difference = appointment_time - now
                
                if time_difference.total_seconds() < 86400:  # 24 hours = 86400 seconds
                    raise ValidationException(
                        "Cannot cancel appointment less than 24 hours before the scheduled time"
                    )
        
        # Store original status before changing it
        original_status = appointment.status
        appointment.status = self.AppointmentStatus.CANCELLED
        
        # Make timeslot available if appointment was pending or scheduled
        if appointment.timeslot_id and original_status in self.AppointmentStatus.LOCKING_STATUSES:
            timeslot = self.db.query(Timeslot).filter(
                Timeslot.id == appointment.timeslot_id
            ).first()
            if timeslot:
                timeslot.is_available = True
        
        self.db.commit()
        
        appointment = self.db.query(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.clinic).joinedload(Clinic.user),
            joinedload(Appointment.timeslot)
        ).filter(Appointment.id == appointment.id).first()
        
        return appointment
    
    def get_doctor_appointments(
        self,
        doctor_id: str
    ) -> List[AppointmentResponse]:
        """Get all appointments for a doctor."""
        appointments = self.db.query(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.clinic).joinedload(Clinic.user),
            joinedload(Appointment.timeslot)
        ).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.deleted_at.is_(None)
        ).order_by(Appointment.created_at.desc()).all()

        return [self._build_appointment_response(appt) for appt in appointments]

    @staticmethod
    def _normalize_datetime(value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None
        if hasattr(value, "tzinfo") and value.tzinfo is not None:
            return value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    def _build_appointment_response(self, appointment: Appointment) -> AppointmentResponse:
        """Build AppointmentResponse from appointment model with nested objects."""
        # Build patient nested response
        patient_data = PatientNestedResponse(
            id=appointment.patient.id,
            name=appointment.patient.user.name,
            email=appointment.patient.user.email,
            age=appointment.patient.age,
            gender=appointment.patient.gender
        )
        
        # Build doctor nested response
        doctor_data = DoctorNestedResponse(
            id=appointment.doctor.id,
            name=appointment.doctor.user.name,
            specializations=appointment.doctor.specializations
        )
        
        # Build clinic nested response
        clinic_data = ClinicNestedResponse(
            id=appointment.clinic.id,
            name=appointment.clinic.user.name,
            address=appointment.clinic.address
        )
        
        # Build timeslot nested response
        timeslot_data = None
        if appointment.timeslot:
            # Extract date and time from datetime
            start_datetime = appointment.timeslot.start_time
            end_datetime = appointment.timeslot.end_time
            
            timeslot_data = TimeslotNestedResponse(
                id=appointment.timeslot.id,
                date=start_datetime.strftime("%Y-%m-%d"),
                start_time=start_datetime.strftime("%H:%M:%S"),
                end_time=end_datetime.strftime("%H:%M:%S")
            )
        
        return AppointmentResponse(
            id=appointment.id,
            patient=patient_data,
            doctor=doctor_data,
            clinic=clinic_data,
            timeslot=timeslot_data,
            status=appointment.status,
            appointment_type=appointment.appointment_type,
            chief_complaint=appointment.chief_complaint,
            created_at=appointment.created_at,
            updated_at=appointment.updated_at
        )