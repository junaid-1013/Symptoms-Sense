"""
Prescription and Medicine models.
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base, SoftDeletableMixin

class Prescription(Base, SoftDeletableMixin):
    """Prescription model."""
    __tablename__ = "prescription"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(String, ForeignKey("appointment.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(String, ForeignKey("patient.id", ondelete="CASCADE"), nullable=False)
    notes = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
    patient = relationship("Patient", back_populates="prescriptions")
    prescription_medicines = relationship("PrescriptionMedicine", back_populates="prescription", cascade="all, delete-orphan")

class Medicine(Base, SoftDeletableMixin):
    """Medicine model."""
    __tablename__ = "medicine"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    manufacturer = Column(String, nullable=True)
    category = Column(String, nullable=True)
    
    # Relationships
    prescription_medicines = relationship("PrescriptionMedicine", back_populates="medicine", cascade="all, delete-orphan")

class PrescriptionMedicine(Base, SoftDeletableMixin):
    """PrescriptionMedicine junction table."""
    __tablename__ = "prescription_medicine"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prescription_id = Column(String, ForeignKey("prescription.id", ondelete="CASCADE"), nullable=False)
    medicine_id = Column(String, ForeignKey("medicine.id", ondelete="CASCADE"), nullable=False)
    dosage = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    duration_days = Column(Integer, nullable=True)
    
    # Relationships
    prescription = relationship("Prescription", back_populates="prescription_medicines")
    medicine = relationship("Medicine", back_populates="prescription_medicines")