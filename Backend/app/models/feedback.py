"""
SiteFeedback model — site-wide testimonials submitted by patients.
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.db.base_class import Base, SoftDeletableMixin

class SiteFeedback(Base, SoftDeletableMixin):
    """Patient-submitted site testimonial / rating."""
    __tablename__ = "site_feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=True)
    message = Column(Text, nullable=False)

    # Relationships
    user = relationship("User", back_populates="site_feedbacks")