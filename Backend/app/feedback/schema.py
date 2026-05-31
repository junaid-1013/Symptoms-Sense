"""
Site-feedback request and response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class FeedbackCreateRequest(BaseModel):
    """Payload for POST /api/feedback — submitted by a logged-in patient."""
    rating: Optional[int] = Field(None, ge=1, le=5)
    message: str = Field(..., min_length=10, max_length=200)

class FeedbackItem(BaseModel):
    """Single testimonial shown publicly."""
    id: str
    name: str
    message: str
    image: Optional[str] = None
    rating: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackListResponse(BaseModel):
    feedbacks: List[FeedbackItem]
    total: int

class FeedbackCreateResponse(BaseModel):
    message: str
    success: bool