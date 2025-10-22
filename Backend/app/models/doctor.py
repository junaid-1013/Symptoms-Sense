"""
Doctor and Timeslot models.
"""
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.base_class import Base


class Doctor(Base):
    """Doctor model."""
    __tablename__ = "doctor"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    clinic_id = Column(String, ForeignKey("clinic.id", ondelete="SET NULL"), nullable=True)
    specialization = Column(String, nullable=True)
    license_no = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    status = Column(String, default="active", nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="doctor")
    clinic = relationship("Clinic", back_populates="doctors")
    timeslots = relationship("Timeslot", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="doctor", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="doctor", cascade="all, delete-orphan")
    tests = relationship("Test", back_populates="doctor", cascade="all, delete-orphan")


class Timeslot(Base):
    """Timeslot model."""
    __tablename__ = "timeslot"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="timeslots")
    appointments = relationship("Appointment", back_populates="timeslot")

