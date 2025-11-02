"""
SQLAlchemy models - import all models here for easy access.
"""
from app.models.user import User, Admin
from app.models.clinic import Clinic
from app.models.doctor import Doctor, Timeslot, DoctorSchedule
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.diagnosis import Diagnosis
from app.models.prescription import Prescription, Medicine, PrescriptionMedicine
from app.models.test import Test

__all__ = [
    "User",
    "Admin",
    "Clinic",
    "Doctor",
    "Timeslot",
    "DoctorSchedule",
    "Patient",
    "Appointment",
    "Diagnosis",
    "Prescription",
    "Medicine",
    "PrescriptionMedicine",
    "Test",
]
