"""
Main API router that imports and mounts all domain routers.
"""
from fastapi import APIRouter

# Import domain routers
from app.auth.controller import router as auth_router
from app.onboarding.controller import router as onboarding_router
from app.doctors.controller import router as doctors_router
from app.clinics.controller import router as clinics_router
from app.prescriptions.controller import router as prescriptions_router
from app.schedules.controller import router as schedules_router
from app.appointments.controller import router as appointments_router
from app.patients.controller import router as patient_router
from app.medical_chat.controller import router as medical_chat_router
from app.contact.controller import router as contact_router
from app.feedback.controller import router as feedback_router
from app.reminders.controller import router as reminders_router

# Create main API router
api_router = APIRouter(prefix="/api")

# Mount domain routers
api_router.include_router(auth_router)
api_router.include_router(onboarding_router)
api_router.include_router(doctors_router)
api_router.include_router(clinics_router)
api_router.include_router(prescriptions_router)
api_router.include_router(schedules_router)
api_router.include_router(appointments_router)
api_router.include_router(patient_router)
api_router.include_router(medical_chat_router)
api_router.include_router(contact_router)
api_router.include_router(feedback_router)
api_router.include_router(reminders_router)
