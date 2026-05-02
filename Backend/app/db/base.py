"""
Import all models for Alembic migrations.
This file must import ALL models so Alembic can detect them.
"""
from app.db.base_class import Base 
# Import all models
from app.models.user import User, Admin, RefreshToken
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
