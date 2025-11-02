"""
Appointment service with business logic.
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.models.doctor import Timeslot
from app.appointments.schema import (
    AppointmentCreateRequest,
    AppointmentUpdateRequest,
    AppointmentResponse
)
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException
)


class AppointmentService:
    """Appointment service class."""

    def __init__(self, db: Session):
        self.db = db

    def create_appointment(
        self,
        data: AppointmentCreateRequest,
        created_by: str = "patient"  # "patient" or "clinic"
    ) -> Appointment:
        """Create a new appointment."""
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

        # Verify clinic exists
        clinic = self.db.query(Clinic).filter(
            Clinic.id == data.clinic_id,
            Clinic.deleted_at.is_(None)
        ).first()

        if not clinic:
            raise UserNotFoundException("Clinic not found")

        # Timeslot is required and must be validated
        if not data.timeslot_id:
            raise ValidationException("Timeslot ID is required for appointments")
        
        timeslot = self.db.query(Timeslot).filter(
            Timeslot.id == data.timeslot_id,
            Timeslot.doctor_id == data.doctor_id,
            Timeslot.deleted_at.is_(None)
        ).first()

        if not timeslot:
            raise UserNotFoundException("Timeslot not found")

        if not timeslot.is_available:
            raise ValidationException("The selected timeslot is no longer available")

        # Check if timeslot already has an appointment
        existing_appointment = self.db.query(Appointment).filter(
            Appointment.timeslot_id == data.timeslot_id,
            Appointment.status.in_(['pending', 'scheduled']),
            Appointment.deleted_at.is_(None)
        ).first()

        if existing_appointment:
            raise ValidationException("This timeslot is already booked")

        # Verify doctor belongs to clinic
        if doctor.clinic_id != data.clinic_id:
            raise ValidationException("Doctor does not belong to the specified clinic")

        # Mark timeslot as unavailable before creating appointment
        timeslot.is_available = False

        # Create appointment
        appointment = Appointment(
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            clinic_id=data.clinic_id,
            timeslot_id=data.timeslot_id,
            status='pending',  # Default status
            appointment_type=data.appointment_type,
            chief_complaint=data.chief_complaint
        )

        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)

        return appointment
    
    def get_patient_appointments(
        self,
        patient_id: str
    ) -> List[AppointmentResponse]:
        """Get all appointments for a patient."""
        appointments = self.db.query(Appointment).filter(
            Appointment.patient_id == patient_id,
            Appointment.deleted_at.is_(None)
        ).order_by(Appointment.created_at.desc()).all()

        return [self._build_appointment_response(appt) for appt in appointments]
    
    def get_clinic_appointments(
        self,
        clinic_id: str
    ) -> List[AppointmentResponse]:
        """Get all appointments for a clinic."""
        appointments = self.db.query(Appointment).filter(
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
                appointment_time = timeslot.start_time
                
                # Handle timezone-aware datetime
                if hasattr(appointment_time, 'tzinfo') and appointment_time.tzinfo is not None:
                    # Convert to naive datetime for comparison
                    appointment_time = appointment_time.replace(tzinfo=None)
                    now = datetime.utcnow()
                
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
                Appointment.status.in_(['pending', 'scheduled']),
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
        self.db.refresh(appointment)
        
        return appointment
    
    def get_appointment_by_id(
        self,
        appointment_id: str
    ) -> Optional[AppointmentResponse]:
        """Get a specific appointment by ID."""
        appointment = self.db.query(Appointment).filter(
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
    
    def approve_appointment(
        self,
        appointment_id: str
    ) -> Appointment:
        """Approve an appointment (change status from pending to scheduled)."""
        appointment = self.get_appointment_model_by_id(appointment_id)
        
        if not appointment:
            raise UserNotFoundException("Appointment not found")
        
        if appointment.status != 'pending':
            raise ValidationException(f"Cannot approve appointment with status: {appointment.status}")
        
        appointment.status = 'scheduled'
        
        self.db.commit()
        self.db.refresh(appointment)
        
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
        if appointment.timeslot_id and appointment.status in ['pending', 'scheduled']:
            timeslot = self.db.query(Timeslot).filter(
                Timeslot.id == appointment.timeslot_id
            ).first()
            
            if timeslot:
                # Check if appointment is more than 24 hours away
                now = datetime.utcnow()
                appointment_time = timeslot.start_time
                
                # Handle timezone-aware datetime
                if hasattr(appointment_time, 'tzinfo') and appointment_time.tzinfo is not None:
                    # Convert to naive datetime for comparison
                    appointment_time = appointment_time.replace(tzinfo=None)
                    now = datetime.utcnow()
                
                time_difference = appointment_time - now
                
                if time_difference.total_seconds() < 86400:  # 24 hours = 86400 seconds
                    raise ValidationException(
                        "Cannot cancel appointment less than 24 hours before the scheduled time"
                    )
        
        # Store original status before changing it
        original_status = appointment.status
        appointment.status = 'cancelled'
        
        # Make timeslot available if appointment was pending or scheduled
        if appointment.timeslot_id and original_status in ['pending', 'scheduled']:
            timeslot = self.db.query(Timeslot).filter(
                Timeslot.id == appointment.timeslot_id
            ).first()
            if timeslot:
                timeslot.is_available = True
        
        self.db.commit()
        self.db.refresh(appointment)
        
        return appointment
    
    def get_doctor_appointments(
        self,
        doctor_id: str
    ) -> List[AppointmentResponse]:
        """Get all appointments for a doctor."""
        appointments = self.db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.deleted_at.is_(None)
        ).order_by(Appointment.created_at.desc()).all()

        return [self._build_appointment_response(appt) for appt in appointments]

    def _build_appointment_response(self, appointment: Appointment) -> AppointmentResponse:
        """Build AppointmentResponse from appointment model."""
        return AppointmentResponse(
            id=appointment.id,
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            clinic_id=appointment.clinic_id,
            timeslot_id=appointment.timeslot_id,
            status=appointment.status,
            appointment_type=appointment.appointment_type,
            chief_complaint=appointment.chief_complaint,
            created_at=appointment.created_at,
            updated_at=appointment.updated_at
        )

