"""
Appointment controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.appointments.dependencies import verify_clinic_owns_doctor
from app.appointments.schema import AppointmentCreateRequest, AppointmentUpdateRequest
from app.appointments.service import AppointmentService
from app.models.user import User
from app.models.patient import Patient
from app.models.clinic import Clinic
from app.models.doctor import Doctor
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


# ========== Appointment Creation ==========

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new appointment.
    Both patient and clinic can create an appointment.
    """
    appointment_service = AppointmentService(db)
    user_type = current_user.user_type

    # Handle patient appointment creation
    if user_type == "patient":
        # Get patient profile
        patient = db.query(Patient).filter(
            Patient.user_id == current_user.id,
            Patient.deleted_at.is_(None)
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
        
        appointment_data.patient_id = patient.id
        created_by = "patient"
    
    # Handle clinic appointment creation
    elif user_type == "clinic":
        # Get clinic profile
        clinic = db.query(Clinic).filter(
            Clinic.user_id == current_user.id,
            Clinic.deleted_at.is_(None)
        ).first()
        
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic profile not found"
            )
        
        # Override clinic_id to ensure clinics can only create appointments for themselves
        appointment_data.clinic_id = clinic.id
        
        # Verify doctor belongs to clinic
        if not verify_clinic_owns_doctor(
            doctor_id=appointment_data.doctor_id,
            clinic_id=clinic.id,
            db=db
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Doctor does not belong to your clinic"
            )
        
        created_by = "clinic"
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients or clinics can create appointments"
        )

    try:
        # Create appointment
        appointment_service.create_appointment(
            data=appointment_data,
            created_by=created_by
        )

        # Get all appointments based on who created it
        if user_type == "patient":
            # Patient gets their own appointments
            all_appointments = appointment_service.get_patient_appointments(patient.id)
        else:
            # Clinic gets all appointments for their clinic
            all_appointments = appointment_service.get_clinic_appointments(clinic.id)

        # Build response in standard format
        return {
            "status": "success",
            "message": "Appointment created successfully",
            "data": {
                "appointments": all_appointments,
            }
        }
    except (UserNotFoundException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while creating the appointment: {str(e)}"
        )


# ========== Appointment Update ==========

@router.put("/{appointment_id}", response_model=dict)
async def update_appointment(
    appointment_id: str,
    appointment_data: AppointmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing appointment.
    Handles both patient and clinic appointment updates.
    """
    appointment_service = AppointmentService(db)
    user_type = current_user.user_type

    # Get existing appointment to verify ownership
    existing_appointment = appointment_service.get_appointment_by_id(appointment_id)
    
    if not existing_appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Verify ownership based on user type
    if user_type == "patient":
        # Get patient profile
        patient = db.query(Patient).filter(
            Patient.user_id == current_user.id,
            Patient.deleted_at.is_(None)
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
        
        # Verify patient owns the appointment
        if existing_appointment.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this appointment"
            )
    
    elif user_type == "clinic":
        # Get clinic profile
        clinic = db.query(Clinic).filter(
            Clinic.user_id == current_user.id,
            Clinic.deleted_at.is_(None)
        ).first()
        
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic profile not found"
            )
        
        # Verify clinic owns the appointment
        if existing_appointment.clinic_id != clinic.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this appointment"
            )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients or clinics can update appointments"
        )

    try:
        # Update appointment
        appointment_service.update_appointment(
            appointment_id=appointment_id,
            data=appointment_data
        )

        # Get all appointments based on who created it
        if user_type == "patient":
            # Get patient profile again for appointments list
            patient = db.query(Patient).filter(
                Patient.user_id == current_user.id,
                Patient.deleted_at.is_(None)
            ).first()
            all_appointments = appointment_service.get_patient_appointments(patient.id)
        else: 
            # Get clinic profile again for appointments list
            clinic = db.query(Clinic).filter(
                Clinic.user_id == current_user.id,
                Clinic.deleted_at.is_(None)
            ).first()
            all_appointments = appointment_service.get_clinic_appointments(clinic.id)

        # Build response in standard format
        return {
            "status": "success",
            "message": "Appointment updated successfully",
            "data": {
                "appointments": all_appointments,
            }
        }
    except (UserNotFoundException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating the appointment: {str(e)}"
        )


# ========== Appointment Approval ==========

@router.post("/{appointment_id}/approve", response_model=dict)
async def approve_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve an appointment (change status from pending to scheduled).
    Can be done by the doctor or the clinic.
    """
    appointment_service = AppointmentService(db)
    user_type = current_user.user_type

    # Get existing appointment to verify access
    existing_appointment = appointment_service.get_appointment_by_id(appointment_id)
    
    if not existing_appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Verify access based on user type
    if user_type == "doctor":
        # Get doctor profile
        doctor = db.query(Doctor).filter(
            Doctor.user_id == current_user.id,
            Doctor.deleted_at.is_(None)
        ).first()
        
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor profile not found"
            )
        
        # Verify doctor owns the appointment
        if existing_appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to approve this appointment"
            )
        
        approver_id = doctor.id
        approver_type = "doctor"
    
    elif user_type == "clinic":
        # Get clinic profile
        clinic = db.query(Clinic).filter(
            Clinic.user_id == current_user.id,
            Clinic.deleted_at.is_(None)
        ).first()
        
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic profile not found"
            )
        
        # Verify clinic owns the appointment
        if existing_appointment.clinic_id != clinic.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to approve this appointment"
            )
        
        approver_id = clinic.id
        approver_type = "clinic"
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors or clinics can approve appointments"
        )

    try:
        # Approve appointment
        appointment_service.approve_appointment(appointment_id)

        # Get all appointments based on who scheduled it
        if approver_type == "doctor":
            all_appointments = appointment_service.get_doctor_appointments(approver_id)
        else:
            all_appointments = appointment_service.get_clinic_appointments(approver_id)

        # Build response in standard format
        return {
            "status": "success",
            "message": "Appointment scheduled successfully",
            "data": {
                "appointments": all_appointments,
            }
        }
    except (UserNotFoundException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while approving the appointment: {str(e)}"
        )


# ========== Appointment Cancellation ==========

@router.post("/{appointment_id}/cancel", response_model=dict)
async def cancel_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an appointment.
    Can be done by the patient, doctor, or clinic.
    Must be done at least 24 hours before the appointment.
    """
    appointment_service = AppointmentService(db)
    user_type = current_user.user_type

    # Get existing appointment to verify access
    existing_appointment = appointment_service.get_appointment_by_id(appointment_id)
    
    if not existing_appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Verify access based on user type
    if user_type == "patient":
        # Get patient profile
        patient = db.query(Patient).filter(
            Patient.user_id == current_user.id,
            Patient.deleted_at.is_(None)
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
        
        # Verify patient owns the appointment
        if existing_appointment.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to cancel this appointment"
            )
        
        canceller_id = patient.id
        canceller_type = "patient"
    
    elif user_type == "doctor":
        # Get doctor profile
        doctor = db.query(Doctor).filter(
            Doctor.user_id == current_user.id,
            Doctor.deleted_at.is_(None)
        ).first()
        
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor profile not found"
            )
        
        # Verify doctor owns the appointment
        if existing_appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to cancel this appointment"
            )
        
        canceller_id = doctor.id
        canceller_type = "doctor"
    
    elif user_type == "clinic":
        # Get clinic profile
        clinic = db.query(Clinic).filter(
            Clinic.user_id == current_user.id,
            Clinic.deleted_at.is_(None)
        ).first()
        
        if not clinic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinic profile not found"
            )
        
        # Verify clinic owns the appointment
        if existing_appointment.clinic_id != clinic.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to cancel this appointment"
            )
        
        canceller_id = clinic.id
        canceller_type = "clinic"
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients, doctors, or clinics can cancel appointments"
        )

    try:
        # Cancel appointment
        appointment_service.cancel_appointment(appointment_id)

        # Get all appointments based on who cancelled it
        if canceller_type == "patient":
            all_appointments = appointment_service.get_patient_appointments(canceller_id)
        elif canceller_type == "doctor":
            all_appointments = appointment_service.get_doctor_appointments(canceller_id)
        else:  # clinic
            all_appointments = appointment_service.get_clinic_appointments(canceller_id)

        # Build response in standard format
        return {
            "status": "success",
            "message": "Appointment cancelled successfully",
            "data": {
                "appointments": all_appointments,
            }
        }
    except (UserNotFoundException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while cancelling the appointment: {str(e)}"
        )


# ========== Get My Appointments ==========

@router.get("/my-appointments", response_model=dict)
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all appointments for the logged-in user.
    Returns appointments based on user type (patient, doctor, or clinic).
    """
    appointment_service = AppointmentService(db)
    user_type = current_user.user_type

    try:
        if user_type == "patient":
            # Get patient profile
            patient = db.query(Patient).filter(
                Patient.user_id == current_user.id,
                Patient.deleted_at.is_(None)
            ).first()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient profile not found"
                )
            
            appointments = appointment_service.get_patient_appointments(patient.id)
        
        elif user_type == "doctor":
            # Get doctor profile
            doctor = db.query(Doctor).filter(
                Doctor.user_id == current_user.id,
                Doctor.deleted_at.is_(None)
            ).first()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor profile not found"
                )
            
            appointments = appointment_service.get_doctor_appointments(doctor.id)
        
        elif user_type == "clinic":
            # Get clinic profile
            clinic = db.query(Clinic).filter(
                Clinic.user_id == current_user.id,
                Clinic.deleted_at.is_(None)
            ).first()
            
            if not clinic:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Clinic profile not found"
                )
            
            appointments = appointment_service.get_clinic_appointments(clinic.id)
        
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user type"
            )

        # Build response in standard format
        return {
            "status": "success",
            "message": "Appointments retrieved successfully",
            "data": {
                "appointments": appointments,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while retrieving appointments: {str(e)}"
        )

