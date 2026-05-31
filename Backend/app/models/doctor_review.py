"""
DoctorReview model — patient review/rating for a specific doctor.
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base, SoftDeletableMixin

class DoctorReview(Base, SoftDeletableMixin):
    """Review left by a logged-in user for a specific doctor."""
    __tablename__ = "doctor_review"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctor.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=True)
    review = Column(Text, nullable=False)

    # Relationships
    doctor = relationship("Doctor", back_populates="reviews")
    user = relationship("User", back_populates="doctor_reviews")