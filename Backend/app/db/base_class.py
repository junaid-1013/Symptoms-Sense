"""
Base class for SQLAlchemy models.
"""
from sqlalchemy import Column, DateTime
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from datetime import datetime

class CustomBase:
    """Base class with common fields for all models."""

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, nullable=True, default=None)
    deleted_at = Column(DateTime, nullable=True, default=None)

Base = declarative_base(cls=CustomBase)
