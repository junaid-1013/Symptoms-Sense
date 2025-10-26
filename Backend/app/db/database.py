"""
Database connection and session management.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import config


# Create SQLAlchemy engine
engine = create_engine(
    config.DATABASE_URL,
    pool_pre_ping=True,  # Enable connection health checks
    pool_size=5,  # Connection pool size
    max_overflow=10,  # Max connections above pool_size
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=config.DEBUG,  # Log SQL statements in debug mode
    future=True 
)

# Create SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,      # Don't expire objects after commit
    future=True                  # Use SQLAlchemy 2.0 style
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


__all__ = [
    "engine",
    "SessionLocal",
    "get_db"
]