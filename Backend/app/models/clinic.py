"""
Clinic model.
"""
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base

class Clinic(Base):
    """Clinic model."""
    __tablename__ = "clinic"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    address = Column(String, nullable=True)
    registration_no = Column(String, nullable=True)
    established_year = Column(Integer, nullable=True)
    total_doctors = Column(Integer, default=0, nullable=False)
    status = Column(String, default="active", nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="clinic")
    doctors = relationship("Doctor", back_populates="clinic", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="clinic", cascade="all, delete-orphan")