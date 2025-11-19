from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.patients.service import PatientsService
from app.patients.schema import PatientListResponse
from app.core.response import APIResponse, APIResponseGeneric

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/", response_model=APIResponseGeneric[PatientListResponse])
def get_all_patients(db: Session = Depends(get_db)):
    """
    GET all patients.
    """
    service = PatientsService(db)
    patients = service.get_all_patients()

    return APIResponse(
        message="All patients retrieved successfully",
        data=PatientListResponse(
            patients=patients,
            total=len(patients)
        )
    ).dict()
