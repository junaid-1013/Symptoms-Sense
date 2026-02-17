"""
Service responsible for suggesting suitable doctors and classifying urgency.
"""

from typing import List, Optional
from difflib import SequenceMatcher

from sqlalchemy import func
from sqlalchemy.orm import Query, Session, joinedload

from app.models.doctor import Doctor
from app.models.user import User
from app.models.clinic import Clinic
from app.medical_chat.schema import (
    SymptomExtraction,
    DiseaseReasoning,
    DoctorSuggestionResult,
    DoctorRecommendation,
    UrgencyLevel,
)


class DoctorSuggestionService:
    """Suggest the most suitable doctors given symptoms and disease reasoning."""

    def __init__(self, db: Session):
        self.db = db

    def suggest_doctors(
        self,
        extraction: SymptomExtraction,
        reasoning: Optional[DiseaseReasoning],
        max_results: int = 5,
    ) -> DoctorSuggestionResult:
        """Entry point: compute doctor suggestions and urgency."""
        if reasoning is None:
            return DoctorSuggestionResult(
                recommended_doctors=[],
                urgency_level="low",
                reasoning=(
                    "No structured disease reasoning was available, so specific doctor "
                    "recommendations could not be generated. Please provide more detail "
                    "about your symptoms if possible."
                ),
            )

        specialties = reasoning.recommended_specializations or []
        risk_level = reasoning.risk_level

        doctors = self._query_doctors_by_specialties(specialties, limit=max_results)
        urgency = self._compute_urgency(extraction, risk_level)
        explanation = self._build_reasoning(extraction, reasoning, doctors, urgency)

        return DoctorSuggestionResult(
            recommended_doctors=[
                self._to_recommendation_model(doc, specialties) for doc in doctors
            ],
            urgency_level=urgency,
            reasoning=explanation,
        )

    def _query_doctors_by_specialties(
        self,
        specialties: List[str],
        limit: int,
    ) -> List[Doctor]:
        """Match doctors based on specializations with graceful fallbacks."""
        base_query = (
            self.db.query(Doctor)
            .join(User, Doctor.user_id == User.id)
            .options(
                joinedload(Doctor.user),
                joinedload(Doctor.clinic).joinedload(Clinic.user),
            )
            .filter(
                Doctor.deleted_at.is_(None),
                Doctor.status == "active",
                User.deleted_at.is_(None),
            )
        )

        normalized_specs = [self._normalize_spec_value(s) for s in specialties if s]

        if not normalized_specs:
            return self._fallback_doctors(base_query, limit)

        candidates = base_query.all()
        matched: List[Doctor] = []

        for doctor in candidates:
            doc_specs = [
                self._normalize_spec_value(value)
                for value in (doctor.specializations or [])
            ]

            if self._has_spec_match(doc_specs, normalized_specs):
                matched.append(doctor)

        def score(doc: Doctor) -> tuple:
            doc_specs = [
                self._normalize_spec_value(value)
                for value in (doc.specializations or [])
            ]
            overlap = self._count_spec_overlap(doc_specs, normalized_specs)
            exp = doc.experience_years or 0
            return (-overlap, -exp)

        matched.sort(key=score)

        if matched:
            return matched[:limit]

        # No fuzzy match found; fall back to top doctors
        return self._fallback_doctors(base_query, limit)

    def _fallback_doctors(self, base_query: Query, limit: int) -> List[Doctor]:
        """Return a default list of top active doctors when no match found."""
        return base_query.order_by(
            func.coalesce(Doctor.experience_years, 0).desc(),
            User.name.asc(),
        ).limit(limit).all()

    def _normalize_spec_value(self, value: Optional[str]) -> str:
        if not value:
            return ""
        return str(value).strip().lower()

    def _has_spec_match(
        self,
        doctor_specs: List[str],
        requested_specs: List[str],
    ) -> bool:
        for requested in requested_specs:
            for doctor_spec in doctor_specs:
                if self._is_spec_match(doctor_spec, requested):
                    return True
        return False

    def _count_spec_overlap(
        self,
        doctor_specs: List[str],
        requested_specs: List[str],
    ) -> int:
        score = 0
        for doctor_spec in doctor_specs:
            if any(self._is_spec_match(doctor_spec, requested) for requested in requested_specs):
                score += 1
        return score

    def _is_spec_match(self, doctor_spec: str, requested_spec: str) -> bool:
        if not doctor_spec or not requested_spec:
            return False

        if doctor_spec == requested_spec:
            return True

        if doctor_spec in requested_spec or requested_spec in doctor_spec:
            return True

        similarity = SequenceMatcher(None, doctor_spec, requested_spec).ratio()
        return similarity >= 0.75

    def _compute_urgency(
        self,
        extraction: SymptomExtraction,
        risk_level: str,
    ) -> UrgencyLevel:
        """Combine Phase 2 risk with red-flag symptoms to compute urgency."""
        if risk_level == "high":
            base: UrgencyLevel = "high"
        elif risk_level == "moderate":
            base = "moderate"
        else:
            base = "low"

        symptom_names = " ".join(s.name.lower() for s in extraction.symptoms)
        red_flags = [
            "chest pain",
            "severe shortness of breath",
            "difficulty breathing",
            "fainting",
            "loss of consciousness",
            "sudden weakness",
        ]
        if any(flag in symptom_names for flag in red_flags):
            return "emergency"

        return base

    def _build_reasoning(
        self,
        extraction: SymptomExtraction,
        reasoning: DiseaseReasoning,
        doctors: List[Doctor],
        urgency: UrgencyLevel,
    ) -> str:
        """Generate safe, non-diagnostic reasoning text."""
        symptom_names = ", ".join(s.name for s in extraction.symptoms) or "your symptoms"
        conds = ", ".join(reasoning.possible_conditions) or "general health concerns"
        specs = ", ".join(reasoning.recommended_specializations) or "relevant specialists"
        doctor_names = ", ".join(
            d.user.name for d in doctors if d.user and d.user.name
        ) or "available doctors in our network"

        return (
            f"Based on {symptom_names}, which may be related to {conds}, "
            f"we estimate an overall urgency level of '{urgency}'. "
            f"We recommend consulting {specs}, and have suggested {doctor_names} "
            f"who match these specialties. This is not a diagnosis and does not "
            f"replace emergency medical care if your symptoms suddenly worsen."
        )

    def _to_recommendation_model(
        self,
        doctor: Doctor,
        matched_specialties: List[str],
    ) -> DoctorRecommendation:
        """Convert Doctor ORM instance to API-safe recommendation object."""
        full_name = doctor.user.name if doctor.user else "Unknown Doctor"
        clinic_name = (
            doctor.clinic.user.name if doctor.clinic and doctor.clinic.user else None
        )
        specs = (doctor.specializations or [])[:]

        primary_spec: Optional[str] = None
        for spec in specs:
            if spec and spec in matched_specialties:
                primary_spec = spec
                break
        if not primary_spec and specs:
            primary_spec = specs[0]

        return DoctorRecommendation(
            id=doctor.id,
            full_name=full_name,
            specialization=primary_spec or "General Physician",
            clinic=clinic_name,
            experience_years=doctor.experience_years,
            rating=None,
        )


