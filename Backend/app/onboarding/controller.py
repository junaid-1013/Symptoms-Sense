"""
Onboarding controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.onboarding.schema import PatientOnboardingRequest, PatientOnboardingResponse, DoctorOnboardingRequest, DoctorOnboardingResponse, ClinicOnboardingRequest, ClinicOnboardingResponse
from app.onboarding.service import OnboardingService
from app.models.user import User
from app.auth.controller import get_current_user
from app.core.exceptions import UserNotFoundException, UserAlreadyExistsException

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

@router.post("/patient", response_model=PatientOnboardingResponse)
async def onboard_patient(
    onboarding_data: PatientOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboard a patient"""
    onboarding_service = OnboardingService(db)

    try:
        patient = onboarding_service.create_patient_profile(current_user.id, onboarding_data)
        return PatientOnboardingResponse.from_orm(patient)
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except UserAlreadyExistsException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/patient/get-profile", response_model=PatientOnboardingResponse)
async def get_patient_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current patient's onboarding data."""
    onboarding_service = OnboardingService(db)

    patient = onboarding_service.get_patient_by_user_id(current_user.id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )

    return PatientOnboardingResponse.from_orm(patient)

@router.post("/doctor", response_model=DoctorOnboardingResponse)
async def onboard_doctor(
    onboarding_data: DoctorOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboard a doctor"""
    onboarding_service = OnboardingService(db)

    try:
        doctor = onboarding_service.create_doctor_profile(current_user.id, onboarding_data)
        return DoctorOnboardingResponse.from_orm(doctor)
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except UserAlreadyExistsException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/doctor/get-profile", response_model=DoctorOnboardingResponse)
async def get_doctor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current doctor's onboarding data."""
    onboarding_service = OnboardingService(db)

    doctor = onboarding_service.get_doctor_by_user_id(current_user.id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )

    return DoctorOnboardingResponse.from_orm(doctor)

@router.post("/clinic", response_model=ClinicOnboardingResponse)
async def onboard_clinic(
    onboarding_data: ClinicOnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboard a clinic"""
    onboarding_service = OnboardingService(db)

    try:
        clinic = onboarding_service.create_clinic_profile(current_user.id, onboarding_data)
        return ClinicOnboardingResponse.from_orm(clinic)
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except UserAlreadyExistsException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/clinic/get-profile", response_model=ClinicOnboardingResponse)
async def get_clinic_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current clinic's onboarding data."""
    onboarding_service = OnboardingService(db)

    clinic = onboarding_service.get_clinic_by_user_id(current_user.id)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic profile not found"
        )

    return ClinicOnboardingResponse.from_orm(clinic)

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
