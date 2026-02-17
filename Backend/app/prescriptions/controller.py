"""
Prescription controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.prescriptions.dependencies import get_current_doctor_for_prescription
from app.auth.dependencies import get_current_user
from app.prescriptions.schema import (
    CompleteAppointmentRequest,
    CompleteAppointmentResponse,
    UpdateAppointmentRecordsRequest,
    UpdateAppointmentRecordsResponse
)
from app.prescriptions.service import PrescriptionService
from app.models.doctor import Doctor
from app.models.user import User
from app.core.exceptions import ValidationException
from app.core.response import APIResponse, APIResponseGeneric

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post(
    "/complete-appointment",
    response_model=APIResponseGeneric[CompleteAppointmentResponse],
    status_code=status.HTTP_201_CREATED
)
async def complete_appointment(
    appointment_data: CompleteAppointmentRequest,
    current_doctor: Doctor = Depends(get_current_doctor_for_prescription),
    db: Session = Depends(get_db)
):
    prescription_service = PrescriptionService(db)

    try:
        result = prescription_service.complete_appointment(
            doctor_id=current_doctor.id,
            data=appointment_data
        )

        return APIResponse(
            message="Appointment completed successfully",
            data=result
        ).dict()
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while completing the appointment: {str(e)}"
        )


@router.patch(
    "/update-appointment-records",
    response_model=APIResponseGeneric[UpdateAppointmentRecordsResponse]
)
async def update_appointment_records(
    update_data: UpdateAppointmentRecordsRequest,
    current_doctor: Doctor = Depends(get_current_doctor_for_prescription),
    db: Session = Depends(get_db)
):
    prescription_service = PrescriptionService(db)
    try:
        result = prescription_service.update_appointment_records(
            doctor_id=current_doctor.id,
            data=update_data
        )
        return APIResponse(
            message="Appointment records updated successfully",
            data=result
        ).dict()
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )


from app.prescriptions.schema import PrescriptionListResponse, MedicineCreateRequest, MedicineUpdateRequest, MedicineResponse


@router.get("/", response_model=APIResponseGeneric[PrescriptionListResponse])
async def get_prescriptions(
    patient_id: str | None = None,
    doctor_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not patient_id and not doctor_id and current_user.user_type not in ("patient", "doctor"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="patient_id or doctor_id is required for this user type"
        )

    svc = PrescriptionService(db)
    rows, total = svc.list_prescriptions_for_user(
        current_user_id=current_user.id,
        user_type=current_user.user_type,
        patient_id=patient_id,
        doctor_id=doctor_id,
        page=page,
        page_size=page_size
    )
    data = [svc._build_prescription_response(p) for p in rows]
    return APIResponse(
        message="Prescriptions retrieved successfully",
        data=PrescriptionListResponse(
            prescriptions=data,
            total=total,
            page=page,
            page_size=page_size
        )
    ).dict()


@router.get(
    "/{appointment_id}",
    response_model=APIResponseGeneric[list[dict]]
)
async def get_prescriptions_by_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = PrescriptionService(db)
    rows = svc.list_prescriptions_by_appointment(appointment_id)
    data = [svc._build_prescription_response(p).model_dump() for p in rows]
    return APIResponse(
        message="Appointment prescriptions retrieved successfully",
        data=data
    ).dict()


# ========== Medicine management (doctor/clinic) ==========

def _require_doctor_or_clinic(user: User):
    if user.user_type not in ("doctor", "clinic"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors or clinics can manage medicines")


@router.post("/medicines", response_model=APIResponseGeneric[list[MedicineResponse]], status_code=status.HTTP_201_CREATED)
async def create_medicine(
    body: MedicineCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_doctor_or_clinic(current_user)
    svc = PrescriptionService(db)
    med = svc.create_medicine(current_user.user_type, body)
    meds = svc.list_all_active_medicines()
    return APIResponse(
        message="Medicine created successfully",
        data=[MedicineResponse.model_validate(m) for m in meds]
    ).dict()


@router.put("/medicines/{medicine_id}", response_model=APIResponseGeneric[list[MedicineResponse]])
async def update_medicine(
    medicine_id: str,
    body: MedicineUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_doctor_or_clinic(current_user)
    svc = PrescriptionService(db)
    med = svc.update_medicine(current_user.user_type, medicine_id, body)
    meds = svc.list_all_active_medicines()
    return APIResponse(
        message="Medicine updated successfully",
        data=[MedicineResponse.model_validate(m) for m in meds]
    ).dict()


@router.delete("/medicines/{medicine_id}", response_model=APIResponseGeneric[list[MedicineResponse]])
async def delete_medicine(
    medicine_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_doctor_or_clinic(current_user)
    svc = PrescriptionService(db)
    ok = svc.delete_medicine(current_user.user_type, medicine_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
    meds = svc.list_all_active_medicines()
    return APIResponse(
        message="Medicine deleted successfully",
        data=[MedicineResponse.model_validate(m) for m in meds]
    ).dict()


@router.get(
    "/diagnoses/{appointment_id}",
    response_model=APIResponseGeneric[list[dict]]
)
async def get_diagnoses_by_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all diagnoses for an appointment (auth required).
    """
    svc = PrescriptionService(db)
    rows = svc.list_diagnoses_by_appointment(appointment_id)
    data = [
        {
            "id": d.id,
            "appointment_id": d.appointment_id,
            "doctor_id": d.doctor_id,
            "patient_id": d.patient_id,
            "symptoms": d.symptoms,
            "diagnosis": d.diagnosis,
            "details": d.details,
            "created_at": d.created_at
        }
        for d in rows
    ]
    return APIResponse(
        message="Appointment diagnoses retrieved successfully",
        data=data
    ).dict()


@router.get(
    "/medicines/{appointment_id}",
    response_model=APIResponseGeneric[list[dict]]
)
async def get_prescription_medicines_by_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = PrescriptionService(db)
    rows = svc.list_prescription_medicines_by_appointment(appointment_id)
    # Expand medicine details
    data = [
        {
            "id": pm.id,
            "prescription_id": pm.prescription_id,
            "medicine_id": pm.medicine_id,
            "dosage": pm.dosage,
            "frequency": pm.frequency,
            "duration_days": pm.duration_days,
            "created_at": pm.created_at,
            "medicine": {
                "id": pm.medicine.id if pm.medicine else None,
                "name": pm.medicine.name if pm.medicine else None,
                "description": pm.medicine.description if pm.medicine else None,
                "manufacturer": pm.medicine.manufacturer if pm.medicine else None,
                "category": pm.medicine.category if pm.medicine else None,
                "created_at": pm.medicine.created_at if pm.medicine else None,
            }
        }
        for pm in rows
    ]
    return APIResponse(
        message="Appointment prescription medicines retrieved successfully",
        data=data
    ).dict()
