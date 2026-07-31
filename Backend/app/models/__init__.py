"""
SQLAlchemy models - import all models here for easy access.
"""
from app.models.user import User, Admin
from app.models.clinic import Clinic
from app.models.doctor import Doctor, Timeslot, DoctorSchedule, BlockedSlot
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.diagnosis import Diagnosis
from app.models.prescription import Prescription, Medicine, PrescriptionMedicine
from app.models.test import Test
from app.models.feedback import SiteFeedback
from app.models.doctor_review import DoctorReview
from app.models.reminder import MedicineReminder
from app.models.chat_conversation import ChatConversation, ChatMessage

__all__ = [
    "User",
    "Admin",
    "Clinic",
    "Doctor",
    "Timeslot",
    "DoctorSchedule",
    "BlockedSlot",
    "Patient",
    "Appointment",
    "Diagnosis",
    "Prescription",
    "Medicine",
    "PrescriptionMedicine",
    "Test",
    "SiteFeedback",
    "DoctorReview",
    "MedicineReminder",
    "ChatConversation",
    "ChatMessage",
]
