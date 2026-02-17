"""
Clinics controller with FastAPI routes for patient frontend.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.clinics.schema import ClinicListResponse, ClinicDetailResponse
from app.clinics.service import ClinicsService
from app.doctors.schema import DoctorCreateRequest, DoctorCreateResponse, ClinicDoctorsResponse
from app.doctors.service import DoctorsService
from app.doctors.dependencies import get_current_clinic
from app.models.clinic import Clinic
from app.core.exceptions import UserAlreadyExistsException, ValidationException
from app.clinics.schema import ClinicRegisterDoctorRequest, ClinicRegisterDoctorResponse, ClinicDoctorsResponse as ClinicDoctorsResponseSchema
from app.core.response import APIResponse, APIResponseGeneric

router = APIRouter(prefix="/clinics", tags=["clinics"])

@router.get("/", response_model=APIResponseGeneric[ClinicListResponse])
async def get_all_clinics(
    db: Session = Depends(get_db)
):
    """Get all active clinics for patient frontend."""
    clinics_service = ClinicsService(db)

    clinics = clinics_service.get_all_clinics()
    return APIResponse(
        message="Clinics retrieved successfully",
        data=ClinicListResponse(clinics=clinics, total=len(clinics))
    ).dict()


@router.get("/search/", response_model=APIResponseGeneric[ClinicListResponse])
async def search_clinics(
    address: Optional[str] = Query(None, description="Filter by address"),
    db: Session = Depends(get_db)
):
    """Search clinics by address."""
    clinics_service = ClinicsService(db)

    clinics = clinics_service.search_clinics(address=address)
    return APIResponse(
        message="Clinic search results",
        data=ClinicListResponse(clinics=clinics, total=len(clinics))
    ).dict()

# ========== Clinic Doctor Registration Endpoints ==========

@router.post("/register-doctor", response_model=APIResponseGeneric[ClinicDoctorsResponseSchema], status_code=status.HTTP_201_CREATED)
async def register_doctor(
    doctor_data: ClinicRegisterDoctorRequest,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """Register a new doctor for the clinic."""
    clinics_service = ClinicsService(db)

    try:
        # Create the new doctor
        clinics_service.register_doctor(
            clinic_id=current_clinic.id,
            data=doctor_data
        )

        # Get all clinic doctors (including the newly created one)
        all_doctors = clinics_service.get_all_clinic_doctors_basic(current_clinic.id)

        # Build response with all clinic doctors
        return APIResponse(
            message="Doctor registered successfully",
            data=ClinicDoctorsResponseSchema(
                doctors=all_doctors,
                total=len(all_doctors),
                clinic_id=current_clinic.id,
                clinic_name=current_clinic.user.name if current_clinic.user else None
            )
        ).dict()
    except (UserAlreadyExistsException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while registering the doctor: {str(e)}"
        )

@router.get("/doctors", response_model=APIResponseGeneric[ClinicDoctorsResponseSchema])
async def get_clinic_doctors(
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """Get all doctors registered in the clinic."""
    clinics_service = ClinicsService(db)

    doctors = clinics_service.get_all_clinic_doctors_basic(current_clinic.id)

    return APIResponse(
        message="Clinic doctors retrieved successfully",
        data=ClinicDoctorsResponseSchema(
            doctors=doctors,
            total=len(doctors),
            clinic_id=current_clinic.id,
            clinic_name=current_clinic.user.name if current_clinic.user else None
        )
    ).dict()


@router.get("/{clinic_id}", response_model=APIResponseGeneric[ClinicDetailResponse])
async def get_clinic_detail(
    clinic_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific clinic."""
    clinics_service = ClinicsService(db)

    clinic = clinics_service.get_clinic_by_id(clinic_id)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )

    return APIResponse(
        message="Clinic details retrieved successfully",
        data=clinic
    ).dict()
