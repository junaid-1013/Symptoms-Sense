"""
Main API router that imports and mounts all domain routers.
"""
from fastapi import APIRouter

# Import domain routers
from app.auth.controller import router as auth_router
from app.appointment.controller import router as appointment_router

# Create main API router
api_router = APIRouter(prefix="/api")

# Mount domain routers
api_router.include_router(auth_router)
api_router.include_router(appointment_router)