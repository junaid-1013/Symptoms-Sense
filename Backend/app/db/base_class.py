"""
Base class for SQLAlchemy models.
"""
from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import declarative_mixin
from datetime import datetime, timezone


@declarative_mixin
class SoftDeletableMixin:

    deleted_at = Column(
        DateTime(timezone=True), 
        nullable=True, 
        index=True,  # Index for better query performance
        comment="Timestamp when record was soft-deleted. NULL means active."
    )

    def soft_delete(self):

        self.deleted_at = datetime.now(timezone.utc)

    def restore(self):

        self.deleted_at = None

    @property
    def is_deleted(self):

        return self.deleted_at is not None

    @property
    def is_active(self):

        return self.deleted_at is None


class CustomBase:

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Timestamp when record was created"
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),  
        nullable=True,
        comment="Timestamp when record was last updated"
    )

    @declared_attr
    def __tablename__(cls):
        """
        Auto-generate table name from class name.
        
        Example:
            class Doctor -> table name: "doctor"
            class PatientRecord -> table name: "patientrecord"
        """
        return cls.__name__.lower()


# Create Base with CustomBase as parent
Base = declarative_base(cls=CustomBase)


# Export what's needed
__all__ = [
    "Base",
    "CustomBase", 
    "SoftDeletableMixin"
]