"""
Doctors controller with FastAPI routes for patient frontend.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.doctors.schema import DoctorListResponse, DoctorDetailResponse
from app.doctors.service import DoctorsService

router = APIRouter(prefix="/doctors", tags=["doctors"])

@router.get("/", response_model=DoctorListResponse)
async def get_all_doctors(
    db: Session = Depends(get_db)
):
    """Get all active doctors for patient frontend."""
    doctors_service = DoctorsService(db)

    doctors = doctors_service.get_all_doctors()
    return DoctorListResponse(doctors=doctors, total=len(doctors))

@router.get("/{doctor_id}", response_model=DoctorDetailResponse)
async def get_doctor_detail(
    doctor_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific doctor."""
    doctors_service = DoctorsService(db)

    doctor = doctors_service.get_doctor_by_id(doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    return doctor

@router.get("/search/", response_model=DoctorListResponse)
async def search_doctors(
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    clinic_name: Optional[str] = Query(None, description="Filter by clinic name"),
    db: Session = Depends(get_db)
):
    """Search doctors by specialization or clinic name."""
    doctors_service = DoctorsService(db)

    doctors = doctors_service.search_doctors(specialization=specialization, clinic_name=clinic_name)
    return DoctorListResponse(doctors=doctors, total=len(doctors))
