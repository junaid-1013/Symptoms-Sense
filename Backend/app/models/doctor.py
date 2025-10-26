"""
Doctor and Timeslot models.
"""
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.base_class import Base, SoftDeletableMixin

class Doctor(Base, SoftDeletableMixin):
    """Doctor model."""
    __tablename__ = "doctor"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)
    clinic_id = Column(String, ForeignKey("clinic.id", ondelete="SET NULL"), nullable=True)
    specialization = Column(String, nullable=True)
    license_no = Column(String, nullable=True, unique=True)
    experience_years = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    status = Column(String, default="active", nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="doctor")
    clinic = relationship("Clinic", back_populates="doctors")
    schedules = relationship("DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan")
    timeslots = relationship("Timeslot", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="doctor", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="doctor", cascade="all, delete-orphan")
    tests = relationship("Test", back_populates="doctor", cascade="all, delete-orphan")

class DoctorSchedule(Base, SoftDeletableMixin):
    """Defines recurring weekly availability of a doctor."""
    __tablename__ = "doctor_schedule"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String, nullable=False)  
    start_time = Column(DateTime, nullable=False)     
    end_time = Column(DateTime, nullable=False)       
    slot_duration = Column(Integer, default=30)   
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    doctor = relationship("Doctor", back_populates="schedules")

class Timeslot(Base, SoftDeletableMixin):
    """Actual bookable slot generated dynamically from DoctorSchedule."""
    __tablename__ = "timeslot"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    generated_from_schedule = Column(String, ForeignKey("doctor_schedule.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="timeslots")
    appointments = relationship("Appointment", back_populates="timeslot")
    schedule = relationship("DoctorSchedule")