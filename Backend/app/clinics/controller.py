"""
Clinics controller with FastAPI routes for patient frontend.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.clinics.schema import ClinicListResponse, ClinicDetailResponse
from app.clinics.service import ClinicsService

router = APIRouter(prefix="/clinics", tags=["clinics"])

@router.get("/", response_model=ClinicListResponse)
async def get_all_clinics(
    db: Session = Depends(get_db)
):
    """Get all active clinics for patient frontend."""
    clinics_service = ClinicsService(db)

    clinics = clinics_service.get_all_clinics()
    return ClinicListResponse(clinics=clinics, total=len(clinics))

@router.get("/{clinic_id}", response_model=ClinicDetailResponse)
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

    return clinic

@router.get("/search/", response_model=ClinicListResponse)
async def search_clinics(
    address: Optional[str] = Query(None, description="Filter by address"),
    db: Session = Depends(get_db)
):
    """Search clinics by address."""
    clinics_service = ClinicsService(db)

    clinics = clinics_service.search_clinics(address=address)
    return ClinicListResponse(clinics=clinics, total=len(clinics))
