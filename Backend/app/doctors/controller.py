"""
Doctor controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.doctors.dependencies import get_current_clinic, get_current_doctor, verify_clinic_owns_doctor
from app.doctors.schema import (
    DoctorListResponse, 
    DoctorDetailResponse,
    DoctorCreateRequest,
    DoctorCreateResponse,
    DoctorUpdateByClinicRequest,
    DoctorUpdateOwnRequest,
    DoctorUpdateResponse,
    DoctorDeleteResponse,
    ClinicDoctorsResponse
)
from app.doctors.service import DoctorsService
from app.models.user import User
from app.models.clinic import Clinic
from app.models.doctor import Doctor
from app.core.exceptions import (
    UserNotFoundException, 
    UserAlreadyExistsException,
    InsufficientPermissionsException,
    ValidationException
)

router = APIRouter(prefix="/doctors", tags=["doctors"])


# ========== Public/Patient Endpoints ==========

@router.get("/", response_model=DoctorListResponse)
async def get_all_doctors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    doctors, total = doctors_service.get_all_doctors(page=page, page_size=page_size)
    
    return DoctorListResponse(
        doctors=doctors,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/search", response_model=DoctorListResponse)
async def search_doctors(
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    clinic_id: Optional[str] = Query(None, description="Filter by clinic ID"),
    search: Optional[str] = Query(None, description="Search in name or specialization"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    doctors, total = doctors_service.search_doctors(
        specialization=specialization,
        clinic_id=clinic_id,
        search=search,
        page=page,
        page_size=page_size
    )
    
    return DoctorListResponse(
        doctors=doctors,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/clinic/{clinic_id}", response_model=DoctorListResponse)
async def get_clinic_doctors(
    clinic_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    doctors, total = doctors_service.get_clinic_doctors(
        clinic_id=clinic_id,
        page=page,
        page_size=page_size
    )
    
    return DoctorListResponse(
        doctors=doctors,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{doctor_id}", response_model=DoctorDetailResponse)
async def get_doctor_detail(
    doctor_id: str,
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    doctor = doctors_service.get_doctor_by_id(doctor_id)
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    return doctor


# ========== Clinic Endpoints ==========

@router.post("/", response_model=DoctorCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    doctor_data: DoctorCreateRequest,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    
    try:
        # Create the new doctor
        doctors_service.create_doctor(
            clinic_id=current_clinic.id,
            data=doctor_data
        )
        
        # Get all clinic doctors (including the newly created one)
        all_doctors = doctors_service.get_all_clinic_doctors_detailed(current_clinic.id)
        
        # Build response with all clinic doctors
        return DoctorCreateResponse(
            message="Doctor created successfully",
            clinic_doctors=ClinicDoctorsResponse(
                doctors=all_doctors,
                total=len(all_doctors),
                clinic_id=current_clinic.id,
                clinic_name=current_clinic.user.name if current_clinic.user else None
            )
        )
    except (UserAlreadyExistsException, ValidationException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while creating the doctor: {str(e)}"
        )


@router.put("/{doctor_id}", response_model=DoctorUpdateResponse)
async def update_doctor(
    doctor_id: str,
    doctor_data: DoctorUpdateByClinicRequest,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    
    # Verify clinic owns this doctor
    verify_clinic_owns_doctor(doctor_id, current_clinic, db)
    
    try:
        # Update the doctor
        updated_doctor = doctors_service.update_doctor_by_clinic(
            doctor_id=doctor_id,
            clinic_id=current_clinic.id,
            data=doctor_data
        )
        
        # Get all clinic doctors (including the just-updated one)
        all_doctors = doctors_service.get_all_clinic_doctors_detailed(current_clinic.id)
        
        # Build response with all clinic doctors
        return DoctorUpdateResponse(
            message="Doctor updated successfully",
            clinic_doctors=ClinicDoctorsResponse(
                doctors=all_doctors,
                total=len(all_doctors),
                clinic_id=current_clinic.id,
                clinic_name=current_clinic.user.name if current_clinic.user else None
            )
        )
    except (UserNotFoundException, InsufficientPermissionsException, UserAlreadyExistsException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating the doctor: {str(e)}"
        )


@router.delete("/{doctor_id}", response_model=DoctorDeleteResponse)
async def delete_doctor(
    doctor_id: str,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    
    # Verify clinic owns this doctor
    verify_clinic_owns_doctor(doctor_id, current_clinic, db)
    
    try:
        # Delete the doctor (soft delete)
        success = doctors_service.delete_doctor(
            doctor_id=doctor_id,
            clinic_id=current_clinic.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete doctor"
            )
        
        # Get remaining clinic doctors (automatically excludes soft-deleted)
        remaining_doctors = doctors_service.get_all_clinic_doctors_detailed(current_clinic.id)
        
        # Build response with remaining doctors
        return DoctorDeleteResponse(
            message="Doctor deleted successfully",
            clinic_doctors=ClinicDoctorsResponse(
                doctors=remaining_doctors,
                total=len(remaining_doctors),
                clinic_id=current_clinic.id,
                clinic_name=current_clinic.user.name if current_clinic.user else None
            )
        )
    except (UserNotFoundException, InsufficientPermissionsException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while deleting the doctor: {str(e)}"
        )


# ========== Doctor Endpoints ==========

@router.get("/me/profile", response_model=DoctorDetailResponse)
async def get_own_profile(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    return doctors_service._build_doctor_detail_response(current_doctor)


@router.put("/me/profile", response_model=DoctorDetailResponse)
async def update_own_profile(
    doctor_data: DoctorUpdateOwnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doctors_service = DoctorsService(db)
    
    try:
        doctor = doctors_service.update_doctor_own_profile(
            user_id=current_user.id,
            data=doctor_data
        )
        
        return doctors_service._build_doctor_detail_response(doctor)
    except (UserNotFoundException, UserAlreadyExistsException) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating the doctor profile: {str(e)}"
        )