"""
Base class for SQLAlchemy models.
"""
from sqlalchemy import Column, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

class CustomBase:
    """Base class with common fields for all models."""

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc), nullable=True, default=None)
    deleted_at = Column(DateTime, nullable=True, default=None)

Base = declarative_base(cls=CustomBase)