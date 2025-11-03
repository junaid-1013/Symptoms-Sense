"""
Prescription controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.prescriptions.dependencies import get_current_doctor_for_prescription, verify_doctor_owns_prescription
from app.prescriptions.schema import (
    PrescriptionCreateRequest,
    PrescriptionUpdateRequest,
    PrescriptionResponse,
    PrescriptionListResponse,
    MedicineResponse
)
from app.prescriptions.service import PrescriptionService
from app.models.user import User
from app.models.doctor import Doctor
from app.core.exceptions import (
    UserNotFoundException,
    ValidationException,
    InsufficientPermissionsException
)
from app.core.response import APIResponse, APIResponseGeneric

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


# ========== Doctor Endpoints ==========

@router.post("/", response_model=APIResponseGeneric[PrescriptionResponse], status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreateRequest,
    current_doctor: Doctor = Depends(get_current_doctor_for_prescription),
    db: Session = Depends(get_db)
):
    """Create a new prescription (Doctor only)."""
    prescription_service = PrescriptionService(db)

    try:
        prescription = prescription_service.create_prescription(
            doctor_id=current_doctor.id,
            data=prescription_data
        )

        return APIResponse(
            message="Prescription created successfully",
            data=prescription_service._build_prescription_response(prescription)
        ).dict()
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while creating the prescription: {str(e)}"
        )


@router.get("/", response_model=APIResponseGeneric[PrescriptionListResponse])
async def get_doctor_prescriptions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_doctor: Doctor = Depends(get_current_doctor_for_prescription),
    db: Session = Depends(get_db)
):
    """Get prescriptions created by the current doctor."""
    prescription_service = PrescriptionService(db)
    prescriptions, total = prescription_service.get_prescriptions_by_doctor(
        doctor_id=current_doctor.id,
        page=page,
        page_size=page_size
    )

    return APIResponse(
        message="Prescriptions retrieved successfully",
        data=PrescriptionListResponse(
            prescriptions=[prescription_service._build_prescription_response(p) for p in prescriptions],
            total=total,
            page=page,
            page_size=page_size
        )
    ).dict()


@router.get("/{prescription_id}", response_model=APIResponseGeneric[PrescriptionResponse])
async def get_prescription_detail(
    prescription_id: str,
    current_doctor: Doctor = Depends(get_current_doctor_for_prescription),
    db: Session = Depends(get_db)
):
    """Get prescription details (Doctor only - must own the prescription)."""
    prescription_service = PrescriptionService(db)

    # Verify doctor owns this prescription
    prescription = verify_doctor_owns_prescription(prescription_id, current_doctor, db)

    prescription = prescription_service.get_prescription_with_details(prescription_id)
    return APIResponse(
        message="Prescription details retrieved successfully",
        data=prescription_service._build_prescription_response(prescription)
    ).dict()


@router.put("/{prescription_id}", response_model=APIResponseGeneric[PrescriptionResponse])
async def update_prescription(
    prescription_id: str,
    prescription_data: PrescriptionUpdateRequest,
    current_doctor: Doctor = Depends(get_current_doctor_for_prescription),
    db: Session = Depends(get_db)
):
    """Update a prescription (Doctor only - must own the prescription)."""
    prescription_service = PrescriptionService(db)

    # Verify doctor owns this prescription
    verify_doctor_owns_prescription(prescription_id, current_doctor, db)

    try:
        prescription = prescription_service.update_prescription(
            prescription_id=prescription_id,
            doctor_id=current_doctor.id,
            data=prescription_data
        )

        return APIResponse(
            message="Prescription updated successfully",
            data=prescription_service._build_prescription_response(prescription)
        ).dict()
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except InsufficientPermissionsException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating the prescription: {str(e)}"
        )


@router.delete("/{prescription_id}", response_model=APIResponseGeneric[dict])
async def delete_prescription(
    prescription_id: str,
    current_doctor: Doctor = Depends(get_current_doctor_for_prescription),
    db: Session = Depends(get_db)
):
    """Delete a prescription (Doctor only - must own the prescription)."""
    prescription_service = PrescriptionService(db)

    # Verify doctor owns this prescription
    verify_doctor_owns_prescription(prescription_id, current_doctor, db)

    try:
        success = prescription_service.delete_prescription(
            prescription_id=prescription_id,
            doctor_id=current_doctor.id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )

        return APIResponse(message="Prescription deleted successfully").dict()
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except InsufficientPermissionsException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while deleting the prescription: {str(e)}"
        )


# ========== Patient Endpoints ==========

@router.get("/patient/my-prescriptions", response_model=APIResponseGeneric[PrescriptionListResponse])
async def get_patient_prescriptions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get prescriptions for the current patient."""
    # Get patient profile for current user
    from app.models.patient import Patient
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id,
        Patient.deleted_at.is_(None)
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )

    prescription_service = PrescriptionService(db)
    prescriptions, total = prescription_service.get_prescriptions_by_patient(
        patient_id=patient.id,
        page=page,
        page_size=page_size
    )

    return APIResponse(
        message="Patient prescriptions retrieved successfully",
        data=PrescriptionListResponse(
            prescriptions=[prescription_service._build_prescription_response(p) for p in prescriptions],
            total=total,
            page=page,
            page_size=page_size
        )
    ).dict()


# ========== Medicine Endpoints (Public) ==========

@router.get("/medicines/", response_model=APIResponseGeneric[list[MedicineResponse]])
async def get_medicines(
    search: Optional[str] = Query(None, description="Search medicines by name, category, or manufacturer"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Get all medicines or search medicines."""
    prescription_service = PrescriptionService(db)

    if search:
        medicines, _ = prescription_service.search_medicines(
            search=search,
            page=page,
            page_size=page_size
        )
    else:
        medicines, _ = prescription_service.get_all_medicines(
            page=page,
            page_size=page_size
        )

    return APIResponse(
        message="Medicines retrieved successfully",
        data=[MedicineResponse.model_validate(medicine) for medicine in medicines]
    ).dict()


@router.get("/medicines/{medicine_id}", response_model=APIResponseGeneric[MedicineResponse])
async def get_medicine_detail(
    medicine_id: str,
    db: Session = Depends(get_db)
):
    """Get medicine details."""
    prescription_service = PrescriptionService(db)
    medicine = prescription_service.get_medicine_by_id(medicine_id)

    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )

    return APIResponse(
        message="Medicine details retrieved successfully",
        data=MedicineResponse.model_validate(medicine)
    ).dict()
