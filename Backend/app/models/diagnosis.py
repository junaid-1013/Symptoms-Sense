"""
Diagnosis model.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.base_class import Base

class Diagnosis(Base):
    """Diagnosis model."""
    __tablename__ = "diagnosis"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(String, ForeignKey("appointment.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(String, ForeignKey("patient.id", ondelete="CASCADE"), nullable=False)
    symptoms = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="diagnoses")
    doctor = relationship("Doctor", back_populates="diagnoses")
    patient = relationship("Patient", back_populates="diagnoses")