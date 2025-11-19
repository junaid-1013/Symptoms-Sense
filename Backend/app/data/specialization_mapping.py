"""
Static mapping between common symptom keywords and medical specializations.
"""

from typing import Dict, List


SPECIALIZATION_MAPPING: Dict[str, List[str]] = {
    "chest pain": ["Cardiologist", "Emergency Medicine"],
    "breathlessness": ["Pulmonologist", "Cardiologist"],
    "shortness of breath": ["Pulmonologist", "Cardiologist"],
    "palpitations": ["Cardiologist"],
    "fever": ["General Physician"],
    "skin rash": ["Dermatologist"],
    "headache": ["Neurologist"],
    "migraine": ["Neurologist"],
    "vision changes": ["Ophthalmologist", "Neurologist"],
    "joint pain": ["Rheumatologist", "Orthopedic Specialist"],
    "swollen joints": ["Rheumatologist"],
    "abdominal pain": ["Gastroenterologist"],
    "nausea": ["Gastroenterologist"],
    "vomiting": ["Gastroenterologist"],
    "dizziness": ["Neurologist", "Cardiologist"],
    "fainting": ["Cardiologist", "Neurologist"],
    "persistent cough": ["Pulmonologist"],
    "sore throat": ["ENT Specialist"],
    "ear pain": ["ENT Specialist"],
    "back pain": ["Orthopedic Specialist"],
    "urinary frequency": ["Urologist"],
    "burning urination": ["Urologist"],
    "mood changes": ["Psychiatrist"],
    "anxiety": ["Psychiatrist"],
    "depression": ["Psychiatrist"],
    "fatigue": ["General Physician"],
}

