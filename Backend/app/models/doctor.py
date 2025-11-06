"""
Doctor and Timeslot models.
"""
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Time, JSON
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
    specializations = Column(JSON, nullable=True)  
    services = Column(JSON, nullable=True)  
    education = Column(JSON, nullable=True)  
    experience = Column(JSON, nullable=True) 
    license_no = Column(String, nullable=True, unique=True)
    experience_years = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    status = Column(String, default="active", nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="doctor")
    clinic = relationship("Clinic", back_populates="doctors")
    schedules = relationship("DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan")
    timeslots = relationship("Timeslot", back_populates="doctor", cascade="all, delete-orphan")
    blocked_slots = relationship("BlockedSlot", back_populates="doctor", cascade="all, delete-orphan")
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
    start_time = Column(Time, nullable=False)     
    end_time = Column(Time, nullable=False)       
    slot_duration = Column(Integer, default=30)   
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    doctor = relationship("Doctor", back_populates="schedules")
    timeslots = relationship("Timeslot", back_populates="schedule")

class Timeslot(Base, SoftDeletableMixin):
    """
    Actual bookable slot.
    - Can be generated dynamically from DoctorSchedule (on-demand)
    - Can be manually created for custom slots
    - Only stored in DB when booked or manually blocked
    """
    __tablename__ = "timeslot"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    generated_from_schedule = Column(String, ForeignKey("doctor_schedule.id", ondelete="SET NULL"), nullable=True)
    slot_type = Column(String, default="generated", nullable=False)  # "generated", "manual", "blocked"
    
    # Relationships
    doctor = relationship("Doctor", back_populates="timeslots")
    appointments = relationship("Appointment", back_populates="timeslot")
    schedule = relationship("DoctorSchedule", back_populates="timeslots")


class BlockedSlot(Base, SoftDeletableMixin):
    """
    Blocks specific time periods for a doctor.
    Used to mark slots as unavailable (e.g., lunch break, personal time, emergency).
    Can be for a specific date or recurring (e.g., every Monday 12-1 PM).
    """
    __tablename__ = "blocked_slot"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)  # Specific date-time or recurring start
    end_time = Column(DateTime, nullable=False)    # Specific date-time or recurring end
    is_recurring = Column(Boolean, default=False, nullable=False)  # If True, applies to recurring dates
    day_of_week = Column(String, nullable=True)  # For recurring blocks (monday, tuesday, etc.)
    reason = Column(String, nullable=True)  # Optional reason for blocking (lunch, break, etc.)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="blocked_slots")