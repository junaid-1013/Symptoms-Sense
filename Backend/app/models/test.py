"""
Test model.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.base_class import Base


class Test(Base):
    """Test model."""
    __tablename__ = "test"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(String, ForeignKey("appointment.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(String, ForeignKey("patient.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=True)
    result = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="tests")
    doctor = relationship("Doctor", back_populates="tests")
    patient = relationship("Patient", back_populates="tests")

