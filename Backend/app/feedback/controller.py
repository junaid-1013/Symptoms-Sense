"""
Site-feedback controller.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.core.constants import UserType
from app.core.response import APIResponse, APIResponseGeneric
from app.feedback.schema import (
    FeedbackCreateRequest,
    FeedbackCreateResponse,
    FeedbackListResponse,
)
from app.feedback.service import FeedbackService
from app.models.user import User

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.get("", response_model=APIResponseGeneric[FeedbackListResponse])
async def list_feedbacks(
    limit: int = Query(6, ge=1, le=50, description="Max number of testimonials to return"),
    offset: int = Query(0, ge=0, description="Number of testimonials to skip (for paging)"),
    db: Session = Depends(get_db),
):
    """Public endpoint — returns the most-recent site testimonials."""
    service = FeedbackService(db)
    items, total = service.list_feedbacks(limit=limit, offset=offset)
    return APIResponse(
        message="Feedbacks retrieved successfully",
        data=FeedbackListResponse(feedbacks=items, total=total),
    ).model_dump()

@router.post("", response_model=APIResponseGeneric[FeedbackCreateResponse], status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    payload: FeedbackCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Authenticated endpoint — patients submit a site testimonial."""
    if current_user.user_type != UserType.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please login as a patient to give Feedback",
        )

    service = FeedbackService(db)

    patient = service.get_patient_by_user_id(current_user.id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found for this user",
        )

    service.create_feedback(user_id=current_user.id, data=payload)

    return APIResponse(
        message="Feedback Saved Successfully",
        data=FeedbackCreateResponse(message="Feedback Saved Successfully", success=True),
    ).model_dump()