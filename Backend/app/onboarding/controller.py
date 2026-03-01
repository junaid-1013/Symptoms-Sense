"""
Onboarding controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Callable, TypeVar, Type
from pydantic import BaseModel

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.onboarding.schema import (
    PatientOnboardingRequest, PatientOnboardingResponse,
    DoctorOnboardingRequest, DoctorOnboardingResponse,
    ClinicOnboardingRequest, ClinicOnboardingResponse
)
from app.onboarding.service import OnboardingService
from app.core.constants import UserType
from app.core.response import APIResponse, APIResponseGeneric
from app.models.user import User
from app.core.exceptions import UserNotFoundException, UserAlreadyExistsException

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

T = TypeVar('T', bound=BaseModel)

# ========== Helper Function to Eliminate Duplication ==========

def create_profile(
    service_method: Callable,
    user_id: str,
    data: BaseModel,
    response_model: Type[T],
    profile_type: str
) -> T:
    try:
        result = service_method(user_id, data)
        return response_model.model_validate(result)
    except (UserNotFoundException, UserAlreadyExistsException) as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create {profile_type} profile"
        )


# ========== Patient Onboarding ==========

@router.post("/patient", response_model=APIResponseGeneric[PatientOnboardingResponse], status_code=status.HTTP_201_CREATED)
async def onboard_patient(
    onboarding_data: PatientOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboard a patient"""
    try:
        service = OnboardingService(db)
        patient = service.create_patient_profile(current_user.id, onboarding_data)
        response_data = service.build_patient_response(patient)
        return APIResponse(
            message="Patient onboarded successfully",
            data=PatientOnboardingResponse.model_validate(response_data)
        ).model_dump()
    except (UserNotFoundException, UserAlreadyExistsException) as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create patient profile: {str(e)}"
        )


@router.get("/patient/get-profile", response_model=APIResponseGeneric[PatientOnboardingResponse])
async def get_patient_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current patient's onboarding data."""
    service = OnboardingService(db)
    patient = service.get_patient_profile_for_display(current_user.id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    response_data = service.build_patient_response(patient)
    return APIResponse(
        message="Patient profile retrieved successfully",
        data=PatientOnboardingResponse.model_validate(response_data)
    ).model_dump()


# ========== Doctor Onboarding ==========

@router.post("/doctor", response_model=APIResponseGeneric[DoctorOnboardingResponse], status_code=status.HTTP_201_CREATED)
async def onboard_doctor(
    onboarding_data: DoctorOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboard a doctor"""
    # Verify user is a doctor
    if current_user.user_type != UserType.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can onboard as doctors"
        )

    service = OnboardingService(db)
    doc = create_profile(
        service.create_doctor_profile,
        current_user.id,
        onboarding_data,
        DoctorOnboardingResponse,
        "doctor"
    )
    return APIResponse(
        message="Doctor onboarded successfully",
        data=DoctorOnboardingResponse.model_validate(doc)
    ).model_dump()


@router.get("/doctor/get-profile", response_model=APIResponseGeneric[DoctorOnboardingResponse])
async def get_doctor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current doctor's onboarding data."""
    service = OnboardingService(db)

    doctor = service.get_doctor_by_user_id(current_user.id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )

    return APIResponse(
        message="Doctor profile retrieved successfully",
        data=DoctorOnboardingResponse.model_validate(doctor)
    ).model_dump()

# ========== Clinic Onboarding ==========

@router.post("/clinic", response_model=APIResponseGeneric[ClinicOnboardingResponse], status_code=status.HTTP_201_CREATED)
async def onboard_clinic(
    onboarding_data: ClinicOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboard a clinic"""
    try:
        service = OnboardingService(db)
        clinic = service.create_clinic_profile(current_user.id, onboarding_data)
        response_data = service.build_clinic_response(clinic)
        return APIResponse(
            message="Clinic onboarded successfully",
            data=ClinicOnboardingResponse.model_validate(response_data)
        ).model_dump()
    except (UserNotFoundException, UserAlreadyExistsException) as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create clinic profile: {str(e)}"
        )

@router.get("/clinic/get-profile", response_model=APIResponseGeneric[ClinicOnboardingResponse])
async def get_clinic_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current clinic's onboarding data."""
    service = OnboardingService(db)
    clinic = service.get_clinic_profile_for_display(current_user.id)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic profile not found"
        )
    response_data = service.build_clinic_response(clinic)
    return APIResponse(
        message="Clinic profile retrieved successfully",
        data=ClinicOnboardingResponse.model_validate(response_data)
    ).model_dump()

# @router.put("/patient/update-profile", response_model=PatientOnboardingResponse)
# async def update_patient_profile(
#     onboarding_data: PatientOnboardingRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Update patient's onboarding data."""
#     onboarding_service = OnboardingService(db)

#     try:
#         patient = onboarding_service.update_patient_profile(current_user.id, onboarding_data)
#         return PatientOnboardingResponse.from_orm(patient)
#     except UserNotFoundException as e:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=str(e)
#         )
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )
