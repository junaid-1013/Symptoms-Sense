"""
Prescription service for prescription data business logic.
"""
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Tuple
from sqlalchemy import and_, or_

from app.models.prescription import Prescription, PrescriptionMedicine, Medicine
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.prescriptions.schema import (
    PrescriptionCreateRequest,
    PrescriptionUpdateRequest,
    PrescriptionResponse,
    PrescriptionMedicineResponse,
    MedicineResponse
)
from app.core.exceptions import UserNotFoundException, ValidationException


class PrescriptionService:
    """Prescription service class."""

    def __init__(self, db: Session):
        self.db = db

    # ========== Prescription Methods ==========

    def get_prescription_by_id(self, prescription_id: str) -> Optional[Prescription]:
        """Get prescription by ID."""
        return self.db.query(Prescription).filter(
            Prescription.id == prescription_id,
            Prescription.deleted_at.is_(None)
        ).first()

    def get_prescription_with_details(self, prescription_id: str) -> Optional[Prescription]:
        """Get prescription with all related details."""
        return self.db.query(Prescription).options(
            joinedload(Prescription.prescription_medicines).joinedload(PrescriptionMedicine.medicine),
            joinedload(Prescription.doctor).joinedload(Doctor.user),
            joinedload(Prescription.patient).joinedload(Patient.user),
            joinedload(Prescription.appointment)
        ).filter(
            Prescription.id == prescription_id,
            Prescription.deleted_at.is_(None)
        ).first()

    def get_prescriptions_by_doctor(self, doctor_id: str, page: int = 1, page_size: int = 20) -> Tuple[List[Prescription], int]:
        """Get prescriptions by doctor ID with pagination."""
        offset = (page - 1) * page_size

        query = self.db.query(Prescription).options(
            joinedload(Prescription.prescription_medicines).joinedload(PrescriptionMedicine.medicine),
            joinedload(Prescription.patient).joinedload(Patient.user),
            joinedload(Prescription.appointment)
        ).filter(
            Prescription.doctor_id == doctor_id,
            Prescription.deleted_at.is_(None)
        )

        total = query.count()
        prescriptions = query.offset(offset).limit(page_size).all()

        return prescriptions, total

    def get_prescriptions_by_patient(self, patient_id: str, page: int = 1, page_size: int = 20) -> Tuple[List[Prescription], int]:
        """Get prescriptions by patient ID with pagination."""
        offset = (page - 1) * page_size

        query = self.db.query(Prescription).options(
            joinedload(Prescription.prescription_medicines).joinedload(PrescriptionMedicine.medicine),
            joinedload(Prescription.doctor).joinedload(Doctor.user),
            joinedload(Prescription.appointment)
        ).filter(
            Prescription.patient_id == patient_id,
            Prescription.deleted_at.is_(None)
        )

        total = query.count()
        prescriptions = query.offset(offset).limit(page_size).all()

        return prescriptions, total

    def create_prescription(self, doctor_id: str, data: PrescriptionCreateRequest) -> Prescription:
        """Create a new prescription."""
        # Validate appointment exists and belongs to doctor
        appointment = self.db.query(Appointment).filter(
            Appointment.id == data.appointment_id,
            Appointment.doctor_id == doctor_id,
            Appointment.deleted_at.is_(None)
        ).first()

        if not appointment:
            raise ValidationException("Appointment not found or does not belong to this doctor")

        # Validate patient exists
        patient = self.db.query(Patient).filter(
            Patient.id == data.patient_id,
            Patient.deleted_at.is_(None)
        ).first()

        if not patient:
            raise UserNotFoundException("Patient not found")

        # Create prescription
        prescription = Prescription(
            appointment_id=data.appointment_id,
            doctor_id=doctor_id,
            patient_id=data.patient_id,
            notes=data.notes,
            instructions=data.instructions
        )

        self.db.add(prescription)
        self.db.flush()  # Get prescription ID without committing

        # Add medicines if provided
        if data.medicines:
            for med_data in data.medicines:
                # Validate medicine exists
                medicine = self.db.query(Medicine).filter(
                    Medicine.id == med_data.medicine_id,
                    Medicine.deleted_at.is_(None)
                ).first()

                if not medicine:
                    raise ValidationException(f"Medicine with ID {med_data.medicine_id} not found")

                prescription_medicine = PrescriptionMedicine(
                    prescription_id=prescription.id,
                    medicine_id=med_data.medicine_id,
                    dosage=med_data.dosage,
                    frequency=med_data.frequency,
                    duration_days=med_data.duration_days
                )
                self.db.add(prescription_medicine)

        self.db.commit()
        self.db.refresh(prescription)

        # Load full details
        return self.get_prescription_with_details(prescription.id)

    def update_prescription(self, prescription_id: str, doctor_id: str, data: PrescriptionUpdateRequest) -> Prescription:
        """Update an existing prescription."""
        prescription = self.db.query(Prescription).filter(
            and_(
                Prescription.id == prescription_id,
                Prescription.doctor_id == doctor_id,
                Prescription.deleted_at.is_(None)
            )
        ).first()

        if not prescription:
            raise UserNotFoundException("Prescription not found or does not belong to this doctor")

        # Update basic fields
        if data.notes is not None:
            prescription.notes = data.notes
        if data.instructions is not None:
            prescription.instructions = data.instructions

        # Update medicines if provided
        if data.medicines is not None:
            # Remove existing medicines
            self.db.query(PrescriptionMedicine).filter(
                PrescriptionMedicine.prescription_id == prescription_id
            ).delete()

            # Add new medicines
            for med_data in data.medicines:
                # Validate medicine exists
                medicine = self.db.query(Medicine).filter(
                    Medicine.id == med_data.medicine_id,
                    Medicine.deleted_at.is_(None)
                ).first()

                if not medicine:
                    raise ValidationException(f"Medicine with ID {med_data.medicine_id} not found")

                prescription_medicine = PrescriptionMedicine(
                    prescription_id=prescription_id,
                    medicine_id=med_data.medicine_id,
                    dosage=med_data.dosage,
                    frequency=med_data.frequency,
                    duration_days=med_data.duration_days
                )
                self.db.add(prescription_medicine)

        self.db.commit()
        self.db.refresh(prescription)

        # Load full details
        return self.get_prescription_with_details(prescription_id)

    def delete_prescription(self, prescription_id: str, doctor_id: str) -> bool:
        """Soft delete a prescription."""
        prescription = self.db.query(Prescription).filter(
            and_(
                Prescription.id == prescription_id,
                Prescription.doctor_id == doctor_id,
                Prescription.deleted_at.is_(None)
            )
        ).first()

        if not prescription:
            return False

        # Soft delete using the mixin method
        prescription.soft_delete()
        self.db.commit()

        return True

    # ========== Medicine Methods ==========

    def get_medicine_by_id(self, medicine_id: str) -> Optional[Medicine]:
        """Get medicine by ID."""
        return self.db.query(Medicine).filter(
            Medicine.id == medicine_id,
            Medicine.deleted_at.is_(None)
        ).first()

    def get_all_medicines(self, page: int = 1, page_size: int = 50) -> Tuple[List[Medicine], int]:
        """Get all medicines with pagination."""
        offset = (page - 1) * page_size

        query = self.db.query(Medicine).filter(Medicine.deleted_at.is_(None))
        total = query.count()
        medicines = query.offset(offset).limit(page_size).all()

        return medicines, total

    def search_medicines(self, search: str, page: int = 1, page_size: int = 50) -> Tuple[List[Medicine], int]:
        """Search medicines by name or category."""
        offset = (page - 1) * page_size

        search_filter = f"%{search}%"
        query = self.db.query(Medicine).filter(
            and_(
                Medicine.deleted_at.is_(None),
                or_(
                    Medicine.name.ilike(search_filter),
                    Medicine.category.ilike(search_filter),
                    Medicine.manufacturer.ilike(search_filter)
                )
            )
        )

        total = query.count()
        medicines = query.offset(offset).limit(page_size).all()

        return medicines, total

    # ========== Helper Methods ==========

    def _build_prescription_response(self, prescription: Prescription) -> PrescriptionResponse:
        """Build prescription response with all details."""
        medicines = []
        for pm in prescription.prescription_medicines:
            medicines.append(PrescriptionMedicineResponse(
                id=pm.id,
                prescription_id=pm.prescription_id,
                medicine_id=pm.medicine_id,
                dosage=pm.dosage,
                frequency=pm.frequency,
                duration_days=pm.duration_days,
                medicine=MedicineResponse.model_validate(pm.medicine) if pm.medicine else None,
                created_at=pm.created_at
            ))

        return PrescriptionResponse(
            id=prescription.id,
            appointment_id=prescription.appointment_id,
            doctor_id=prescription.doctor_id,
            patient_id=prescription.patient_id,
            notes=prescription.notes,
            instructions=prescription.instructions,
            created_at=prescription.created_at,
            updated_at=prescription.updated_at,
            medicines=medicines
        )
