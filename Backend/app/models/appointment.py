"""
Appointment model.
"""
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base, SoftDeletableMixin

class Appointment(Base, SoftDeletableMixin):
    """Appointment model."""
    __tablename__ = "appointment"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patient.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    clinic_id = Column(String, ForeignKey("clinic.id", ondelete="CASCADE"), nullable=False)
    timeslot_id = Column(String, ForeignKey("timeslot.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="pending", nullable=False)
    appointment_type = Column(String, nullable=True)
    chief_complaint = Column(String, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    clinic = relationship("Clinic", back_populates="appointments")
    timeslot = relationship("Timeslot", back_populates="appointments")
    diagnoses = relationship("Diagnosis", back_populates="appointment", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="appointment", cascade="all, delete-orphan")
    tests = relationship("Test", back_populates="appointment", cascade="all, delete-orphan")