"""
Medicine-reminder business logic.
"""
from datetime import time as time_cls
from typing import List, Tuple

from sqlalchemy.orm import Session, joinedload

from app.models.patient import Patient
from app.models.reminder import MedicineReminder
from app.reminders.schema import ReminderCreateRequest, ReminderItem
from app.core.exceptions import UserNotFoundException, InsufficientPermissionsException

class ReminderService:
    def __init__(self, db: Session):
        self.db = db

    # ========== Lookups ==========
    def get_patient_by_user_id(self, user_id: str) -> Patient:
        patient = (
            self.db.query(Patient)
            .filter(Patient.user_id == user_id, Patient.deleted_at.is_(None))
            .first()
        )
        if not patient:
            raise UserNotFoundException("Patient profile not found for this user")
        return patient

    # ========== CRUD ==========
    def list_reminders(self, patient_id: str) -> Tuple[List[ReminderItem], int]:
        """Return all active reminders for a patient."""
        rows = (
            self.db.query(MedicineReminder)
            .filter(
                MedicineReminder.patient_id == patient_id,
                MedicineReminder.is_active.is_(True),
                MedicineReminder.deleted_at.is_(None),
            )
            .order_by(MedicineReminder.created_at.desc())
            .all()
        )
        items = [self._build_item(r) for r in rows]
        return items, len(items)

    def create_reminder(
        self,
        patient_id: str,
        data: ReminderCreateRequest,
    ) -> MedicineReminder:
        """Persist a new MedicineReminder row and return it with relationships loaded."""
        reminder_time = self._parse_time(data.reminder_time)

        reminder = MedicineReminder(
            patient_id=patient_id,
            medicine_name=data.medicine_name,
            dosage=data.dosage,
            medicine_type=data.medicine_type,
            days_of_week=data.days_of_week,
            reminder_time=reminder_time,
            is_active=True,
        )
        self.db.add(reminder)
        self.db.commit()
        self.db.refresh(reminder)

        # Reload with patient → user so the controller can pass the email to the scheduler.
        return (
            self.db.query(MedicineReminder)
            .options(joinedload(MedicineReminder.patient).joinedload(Patient.user))
            .filter(MedicineReminder.id == reminder.id)
            .one()
        )

    def delete_reminder(
        self,
        reminder_id: str,
        patient_id: str,
    ) -> MedicineReminder:
        """Soft-delete a reminder after verifying ownership."""
        reminder = (
            self.db.query(MedicineReminder)
            .filter(
                MedicineReminder.id == reminder_id,
                MedicineReminder.deleted_at.is_(None),
            )
            .first()
        )
        if not reminder:
            raise UserNotFoundException("Reminder not found")
        if reminder.patient_id != patient_id:
            raise InsufficientPermissionsException("You can only delete your own reminders")

        reminder.is_active = False
        reminder.soft_delete()
        self.db.commit()
        return reminder

    # ========== Helpers ==========
    def _build_item(self, r: MedicineReminder) -> ReminderItem:
        return ReminderItem(
            id=r.id,
            medicine_name=r.medicine_name,
            dosage=r.dosage,
            medicine_type=r.medicine_type,
            days_of_week=r.days_of_week or [],
            reminder_time=r.reminder_time.strftime("%H:%M") if r.reminder_time else "",
            is_active=r.is_active,
            created_at=r.created_at,
        )

    @staticmethod
    def _parse_time(time_str: str) -> time_cls:
        parts = time_str.strip().split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
        return time_cls(hour=hour, minute=minute)