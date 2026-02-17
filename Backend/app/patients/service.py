from typing import List
from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.models.user import User
from app.patients.schema import PatientResponse

class PatientsService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_patients(self) -> List[PatientResponse]:
        patients = self.db.query(Patient, User.name, User.email).join(User, Patient.user_id == User.id).all()
        return [
            PatientResponse(
                **p.Patient.__dict__, 
                name=p.name,
                email=p.email
            )
            for p in patients
        ]

