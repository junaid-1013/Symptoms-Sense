"""
Site-feedback business logic.
"""
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.models.feedback import SiteFeedback
from app.models.user import User
from app.models.patient import Patient
from app.feedback.schema import FeedbackItem, FeedbackCreateRequest

class FeedbackService:
    def __init__(self, db: Session):
        self.db = db

    def list_feedbacks(self, limit: int = 6) -> Tuple[List[FeedbackItem], int]:
        """Return the most-recent `limit` active feedbacks joined with user info."""
        rows = (
            self.db.query(SiteFeedback, User)
            .join(User, SiteFeedback.user_id == User.id)
            .filter(SiteFeedback.deleted_at.is_(None))
            .order_by(SiteFeedback.created_at.desc())
            .limit(limit)
            .all()
        )

        items = [
            FeedbackItem(
                id=sf.id,
                name=user.name,
                message=sf.message,
                image=user.avatar_url,
                rating=sf.rating,
                created_at=sf.created_at,
            )
            for sf, user in rows
        ]
        total = self.db.query(SiteFeedback).filter(SiteFeedback.deleted_at.is_(None)).count()
        return items, total

    def get_patient_by_user_id(self, user_id: str):
        """Look up the Patient record for a given User id."""
        return (
            self.db.query(Patient)
            .filter(Patient.user_id == user_id, Patient.deleted_at.is_(None))
            .first()
        )

    def create_feedback(self, user_id: str, data: FeedbackCreateRequest) -> SiteFeedback:
        """Persist a new site feedback row."""
        feedback = SiteFeedback(
            user_id=user_id,
            rating=data.rating,
            message=data.message,
        )
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        return feedback