"""
Prescription service for prescription data business logic.
"""
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime, timezone

from app.models.prescription import Prescription, PrescriptionMedicine, Medicine
from app.models.diagnosis import Diagnosis
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.prescriptions.schema import (
    CompleteAppointmentRequest,
    CompleteAppointmentResponse,
    DiagnosisResponse,
    PrescriptionResponse,
    PrescriptionMedicineResponse,
    MedicineResponse,
    UpdateAppointmentRecordsRequest,
    UpdateAppointmentRecordsResponse,
    PrescriptionMedicineUpdate,
    MedicineCreateRequest,
    MedicineUpdateRequest
)
from app.core.constants import UserType
from app.core.exceptions import ValidationException


class PrescriptionService:
    """Prescription service class."""

    def __init__(self, db: Session):
        self.db = db

    def complete_appointment(
        self,
        doctor_id: str,
        data: CompleteAppointmentRequest
    ) -> CompleteAppointmentResponse:
        # Validate appointment exists and belongs to doctor
        appointment = self.db.query(Appointment).filter(
            Appointment.id == data.appointment_id,
            Appointment.doctor_id == doctor_id,
            Appointment.deleted_at.is_(None)
        ).first()

        if not appointment:
            raise ValidationException("Appointment not found or does not belong to this doctor")

        # Validate appointment is in scheduled state
        from app.appointments.service import AppointmentService
        if appointment.status != AppointmentService.AppointmentStatus.SCHEDULED:
            raise ValidationException(
                f"Cannot complete appointment with status: {appointment.status}. "
                "Appointment must be 'scheduled'."
            )

        # Validate current time is within the appointment's timeslot window
        if not appointment.timeslot:
            raise ValidationException("Appointment has no timeslot assigned")
        start_time = appointment.timeslot.start_time
        end_time = appointment.timeslot.end_time
        
        def to_aware_utc(dt: datetime) -> datetime:
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)

        now_utc = datetime.now(timezone.utc)
        start_utc = to_aware_utc(start_time)
        end_utc = to_aware_utc(end_time)

        if not (start_utc <= now_utc <= end_utc):
            raise ValidationException("You can only complete this appointment during its scheduled time window")

        try:
            # Create Diagnosis
            diagnosis = Diagnosis(
                appointment_id=data.appointment_id,
                doctor_id=doctor_id,
                patient_id=appointment.patient_id,
                symptoms=data.symptoms,
                diagnosis=data.diagnosis,
                details=data.diagnosis_details
            )
            self.db.add(diagnosis)
            self.db.flush()

            # Create Prescription
            prescription = Prescription(
                appointment_id=data.appointment_id,
                doctor_id=doctor_id,
                patient_id=appointment.patient_id,
                notes=data.prescription_notes,
                instructions=data.prescription_instructions
            )
            self.db.add(prescription)
            self.db.flush()

            # Process medicines - find by name or create new
            for med_input in data.medicines:
                # Try to find existing medicine by name (case-insensitive, trimmed)
                medicine = self.db.query(Medicine).filter(
                    Medicine.name.ilike(med_input.name.strip()),
                    Medicine.deleted_at.is_(None)
                ).first()

                # If not found, create new medicine
                if not medicine:
                    medicine = Medicine(
                        name=med_input.name.strip(),
                        description=med_input.description,
                        manufacturer=med_input.manufacturer,
                        category=med_input.category
                    )
                    self.db.add(medicine)
                    self.db.flush()  # Get medicine ID

                # Create PrescriptionMedicine link
                prescription_medicine = PrescriptionMedicine(
                    prescription_id=prescription.id,
                    medicine_id=medicine.id,
                    dosage=med_input.dosage,
                    frequency=med_input.frequency,
                    duration_days=med_input.duration_days
                )
                self.db.add(prescription_medicine)

            # Mark appointment as completed
            appointment.status = AppointmentService.AppointmentStatus.COMPLETED

            # Commit all changes
            self.db.commit()

            # Refresh to get IDs and relationships
            self.db.refresh(diagnosis)
            self.db.refresh(prescription)
            self.db.refresh(appointment)

            # Load prescription with medicines for response
            prescription = self._get_prescription_with_medicines(prescription.id)
            from app.appointments.service import AppointmentService
            appt_service = AppointmentService(self.db)
            doctor_appointments = appt_service.get_doctor_appointments(doctor_id)

            # Build response
            return CompleteAppointmentResponse(
                diagnosis=DiagnosisResponse(
                    id=diagnosis.id,
                    appointment_id=diagnosis.appointment_id,
                    doctor_id=diagnosis.doctor_id,
                    patient_id=diagnosis.patient_id,
                    symptoms=diagnosis.symptoms,
                    diagnosis=diagnosis.diagnosis,
                    details=diagnosis.details,
                    created_at=diagnosis.created_at
                ),
                prescription=self._build_prescription_response(prescription),
                appointment_status=appointment.status,
                appointments=doctor_appointments 
            )

        except Exception as e:
            self.db.rollback()
            if isinstance(e, ValidationException):
                raise
            raise ValidationException(f"Failed to complete appointment: {str(e)}")

    def update_appointment_records(
        self,
        doctor_id: str,
        data: UpdateAppointmentRecordsRequest
    ) -> UpdateAppointmentRecordsResponse:
        # Validate appointment exists and belongs to doctor
        appointment = self.db.query(Appointment).filter(
            Appointment.id == data.appointment_id,
            Appointment.doctor_id == doctor_id,
            Appointment.deleted_at.is_(None)
        ).first()
        if not appointment:
            raise ValidationException("Appointment not found or does not belong to this doctor")

        # Allow updates for scheduled or completed appointments
        from app.appointments.service import AppointmentService
        if appointment.status not in (
            AppointmentService.AppointmentStatus.SCHEDULED,
            AppointmentService.AppointmentStatus.COMPLETED
        ):
            raise ValidationException(
                f"Cannot update appointment with status: {appointment.status}. "
                "Appointment must be 'scheduled' or 'completed'."
            )

        # Time window check
        if not appointment.timeslot:
            raise ValidationException("Appointment has no timeslot assigned")
        start_time = appointment.timeslot.start_time
        end_time = appointment.timeslot.end_time

        def to_aware_utc(dt: datetime) -> datetime:
            appt_tz = getattr(appointment.created_at, "tzinfo", None)
            if dt.tzinfo is None:
                if appt_tz is not None:
                    return dt.replace(tzinfo=appt_tz).astimezone(timezone.utc)
                from app.core.config import config
                from zoneinfo import ZoneInfo
                local_tz = ZoneInfo(config.DEFAULT_TIMEZONE)
                return dt.replace(tzinfo=local_tz).astimezone(timezone.utc)
            return dt.astimezone(timezone.utc)

        now_utc = datetime.now(timezone.utc)
        start_utc = to_aware_utc(start_time)
        end_utc = to_aware_utc(end_time)
        if not (start_utc <= now_utc <= end_utc):
            raise ValidationException("You can only update this appointment during its scheduled time window")

        updated_diagnosis = None
        updated_prescription = None

        try:
            # Resolve target diagnosis (by id or latest for this appointment)
            if any(v is not None for v in [data.symptoms, data.diagnosis, data.diagnosis_details]) or data.diagnosis_id:
                if data.diagnosis_id:
                    updated_diagnosis = self.db.query(Diagnosis).filter(
                        Diagnosis.id == data.diagnosis_id,
                        Diagnosis.appointment_id == data.appointment_id,
                        Diagnosis.doctor_id == doctor_id,
                        Diagnosis.deleted_at.is_(None)
                    ).first()
                else:
                    updated_diagnosis = self.db.query(Diagnosis).filter(
                        Diagnosis.appointment_id == data.appointment_id,
                        Diagnosis.doctor_id == doctor_id,
                        Diagnosis.deleted_at.is_(None)
                    ).order_by(Diagnosis.created_at.desc()).first()
                if not updated_diagnosis:
                    raise ValidationException("Diagnosis not found for this appointment/doctor")

                if data.symptoms is not None:
                    updated_diagnosis.symptoms = data.symptoms
                if data.diagnosis is not None:
                    updated_diagnosis.diagnosis = data.diagnosis
                if data.diagnosis_details is not None:
                    updated_diagnosis.details = data.diagnosis_details

            # Resolve target prescription (by id or latest for this appointment)
            needs_prescription = (
                data.prescription_notes is not None or
                data.prescription_instructions is not None or
                (data.add_medicines and len(data.add_medicines) > 0) or
                (data.update_medicines and len(data.update_medicines) > 0) or
                (data.remove_prescription_medicines and len(data.remove_prescription_medicines) > 0) or
                data.prescription_id is not None
            )
            if needs_prescription:
                if data.prescription_id:
                    updated_prescription = self.db.query(Prescription).filter(
                        Prescription.id == data.prescription_id,
                        Prescription.appointment_id == data.appointment_id,
                        Prescription.doctor_id == doctor_id,
                        Prescription.deleted_at.is_(None)
                    ).first()
                else:
                    updated_prescription = self.db.query(Prescription).filter(
                        Prescription.appointment_id == data.appointment_id,
                        Prescription.doctor_id == doctor_id,
                        Prescription.deleted_at.is_(None)
                    ).order_by(Prescription.created_at.desc()).first()

                if not updated_prescription:
                    raise ValidationException("Prescription not found for this appointment/doctor")

                if data.prescription_notes is not None:
                    updated_prescription.notes = data.prescription_notes
                if data.prescription_instructions is not None:
                    updated_prescription.instructions = data.prescription_instructions

                # Remove medicines
                if data.remove_prescription_medicines:
                    for pm_id in data.remove_prescription_medicines:
                        pm = self.db.query(PrescriptionMedicine).filter(
                            PrescriptionMedicine.id == pm_id,
                            PrescriptionMedicine.prescription_id == updated_prescription.id,
                            PrescriptionMedicine.deleted_at.is_(None)
                        ).first()
                        if pm:
                            self.db.delete(pm)

                # Update medicines
                if data.update_medicines:
                    for upd in data.update_medicines:
                        pm = self.db.query(PrescriptionMedicine).filter(
                            PrescriptionMedicine.id == upd.id,
                            PrescriptionMedicine.prescription_id == updated_prescription.id,
                            PrescriptionMedicine.deleted_at.is_(None)
                        ).first()
                        if not pm:
                            raise ValidationException(f"Prescription medicine not found: {upd.id}")
                        if upd.dosage is not None:
                            pm.dosage = upd.dosage
                        if upd.frequency is not None:
                            pm.frequency = upd.frequency
                        if upd.duration_days is not None:
                            pm.duration_days = upd.duration_days

                # Add medicines (by name or create)
                if data.add_medicines:
                    for med_input in data.add_medicines:
                        medicine = self.db.query(Medicine).filter(
                            Medicine.name.ilike(med_input.name.strip()),
                            Medicine.deleted_at.is_(None)
                        ).first()
                        if not medicine:
                            medicine = Medicine(
                                name=med_input.name.strip(),
                                description=med_input.description,
                                manufacturer=med_input.manufacturer,
                                category=med_input.category
                            )
                            self.db.add(medicine)
                            self.db.flush()
                        pm = PrescriptionMedicine(
                            prescription_id=updated_prescription.id,
                            medicine_id=medicine.id,
                            dosage=med_input.dosage,
                            frequency=med_input.frequency,
                            duration_days=med_input.duration_days
                        )
                        self.db.add(pm)

            self.db.commit()

            diag_resp = None
            pres_resp = None
            if updated_diagnosis:
                self.db.refresh(updated_diagnosis)
                diag_resp = DiagnosisResponse(
                    id=updated_diagnosis.id,
                    appointment_id=updated_diagnosis.appointment_id,
                    doctor_id=updated_diagnosis.doctor_id,
                    patient_id=updated_diagnosis.patient_id,
                    symptoms=updated_diagnosis.symptoms,
                    diagnosis=updated_diagnosis.diagnosis,
                    details=updated_diagnosis.details,
                    created_at=updated_diagnosis.created_at
                )
            if updated_prescription:
                self.db.refresh(updated_prescription)
                # Load medicines for response
                updated_prescription = self._get_prescription_with_medicines(updated_prescription.id)
                pres_resp = self._build_prescription_response(updated_prescription)

            return UpdateAppointmentRecordsResponse(
                diagnosis=diag_resp,
                prescription=pres_resp,
                appointment_status=appointment.status
            )
        except Exception as e:
            self.db.rollback()
            if isinstance(e, ValidationException):
                raise
            raise ValidationException(f"Failed to update appointment records: {str(e)}")

    def _get_prescription_with_medicines(self, prescription_id: str) -> Optional[Prescription]:
        """Get prescription with all related medicines loaded."""
        return self.db.query(Prescription).options(
            joinedload(Prescription.prescription_medicines).joinedload(PrescriptionMedicine.medicine)
        ).filter(
            Prescription.id == prescription_id,
            Prescription.deleted_at.is_(None)
        ).first()

    def _build_prescription_response(self, prescription: Prescription) -> PrescriptionResponse:
        medicines = []
        for pm in prescription.prescription_medicines:
            medicines.append(PrescriptionMedicineResponse(
                id=pm.id,
                prescription_id=pm.prescription_id,
                medicine_id=pm.medicine_id,
                dosage=pm.dosage,
                frequency=pm.frequency,
                duration_days=pm.duration_days,
                medicine=MedicineResponse(
                    id=pm.medicine.id,
                    name=pm.medicine.name,
                    description=pm.medicine.description,
                    manufacturer=pm.medicine.manufacturer,
                    category=pm.medicine.category,
                    created_at=pm.medicine.created_at
                ) if pm.medicine else None,
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

    def list_prescriptions_for_user(
        self,
        current_user_id: str,
        user_type: str,
        patient_id: Optional[str],
        doctor_id: Optional[str],
        page: int,
        page_size: int
    ):
        from app.models.patient import Patient
        from app.models.doctor import Doctor

        query = self.db.query(Prescription).options(
            joinedload(Prescription.prescription_medicines).joinedload(PrescriptionMedicine.medicine)
        ).filter(Prescription.deleted_at.is_(None))

        if user_type == UserType.PATIENT:
            # Map user -> patient.id
            me = self.db.query(Patient).filter(
                Patient.user_id == current_user_id,
                Patient.deleted_at.is_(None)
            ).first()
            if not me:
                return [], 0
            query = query.filter(Prescription.patient_id == me.id)
            if doctor_id:
                query = query.filter(Prescription.doctor_id == doctor_id)
        elif user_type == "doctor":
            me = self.db.query(Doctor).filter(
                Doctor.user_id == current_user_id,
                Doctor.deleted_at.is_(None)
            ).first()
            if not me:
                return [], 0
            query = query.filter(Prescription.doctor_id == me.id)
            if patient_id:
                query = query.filter(Prescription.patient_id == patient_id)
        else:
            if patient_id:
                query = query.filter(Prescription.patient_id == patient_id)
            if doctor_id:
                query = query.filter(Prescription.doctor_id == doctor_id)

        total = query.count()
        offset = (page - 1) * page_size
        rows = query.order_by(Prescription.created_at.desc()).offset(offset).limit(page_size).all()
        return rows, total

    def list_prescriptions_by_appointment(self, appointment_id: str):
        rows = self.db.query(Prescription).options(
            joinedload(Prescription.prescription_medicines).joinedload(PrescriptionMedicine.medicine)
        ).filter(
            Prescription.appointment_id == appointment_id,
            Prescription.deleted_at.is_(None)
        ).order_by(Prescription.created_at.asc()).all()
        return rows

    def list_diagnoses_by_appointment(self, appointment_id: str):
        rows = self.db.query(Diagnosis).filter(
            Diagnosis.appointment_id == appointment_id,
            Diagnosis.deleted_at.is_(None)
        ).order_by(Diagnosis.created_at.asc()).all()
        return rows

    def list_prescription_medicines_by_appointment(self, appointment_id: str):
        pms = self.db.query(PrescriptionMedicine).join(Prescription).options(
            joinedload(PrescriptionMedicine.medicine)
        ).filter(
            Prescription.appointment_id == appointment_id,
            Prescription.deleted_at.is_(None),
            PrescriptionMedicine.deleted_at.is_(None)
        ).order_by(PrescriptionMedicine.created_at.asc()).all()
        return pms

    # ========= Medicine management (doctor/clinic) =========
    def create_medicine(self, user_type: str, data: MedicineCreateRequest) -> Medicine:
        if user_type not in (UserType.DOCTOR, UserType.CLINIC):
            raise ValidationException("Only doctors or clinics can create medicines")
        existing = self.db.query(Medicine).filter(
            Medicine.name.ilike(data.name.strip()),
            Medicine.deleted_at.is_(None)
        ).first()
        if existing:
            return existing
        med = Medicine(
            name=data.name.strip(),
            description=data.description,
            manufacturer=data.manufacturer,
            category=data.category
        )
        self.db.add(med)
        self.db.commit()
        self.db.refresh(med)
        return med

    def update_medicine(self, user_type: str, medicine_id: str, data: MedicineUpdateRequest) -> Medicine:
        if user_type not in ("doctor", "clinic"):
            raise ValidationException("Only doctors or clinics can update medicines")
        med = self.db.query(Medicine).filter(
            Medicine.id == medicine_id,
            Medicine.deleted_at.is_(None)
        ).first()
        if not med:
            raise ValidationException("Medicine not found")
        if data.name is not None:
            med.name = data.name.strip()
        if data.description is not None:
            med.description = data.description
        if data.manufacturer is not None:
            med.manufacturer = data.manufacturer
        if data.category is not None:
            med.category = data.category
        self.db.commit()
        self.db.refresh(med)
        return med

    def delete_medicine(self, user_type: str, medicine_id: str) -> bool:
        if user_type not in (UserType.DOCTOR, UserType.CLINIC):
            raise ValidationException("Only doctors or clinics can delete medicines")
        med = self.db.query(Medicine).filter(
            Medicine.id == medicine_id,
            Medicine.deleted_at.is_(None)
        ).first()
        if not med:
            return False
        med.soft_delete()
        self.db.commit()
        return True

    def list_all_active_medicines(self):
        """Return all non-deleted medicines."""
        return self.db.query(Medicine).filter(Medicine.deleted_at.is_(None)).order_by(Medicine.created_at.desc()).all()
