"""
MedicineReminder model — recurring reminders to email a patient at a chosen time.
"""
from sqlalchemy import Column, String, Integer, Boolean, Time, ForeignKey, JSON
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base, SoftDeletableMixin

class MedicineReminder(Base, SoftDeletableMixin):
    """A medicine reminder scheduled by a patient.

    `days_of_week` stores the weekday names ("Mon", "Tue", ...) chosen in the UI.
    `reminder_time` is a wall-clock time interpreted in `config.DEFAULT_TIMEZONE`.
    The actual cron job is registered in APScheduler with id `reminder:{id}`.
    """
    __tablename__ = "medicine_reminder"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patient.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String, nullable=False)
    dosage = Column(Integer, nullable=False)
    medicine_type = Column(String, nullable=False)
    days_of_week = Column(JSON, nullable=False)
    reminder_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="reminders")