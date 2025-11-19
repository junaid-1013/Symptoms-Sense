"""
Medical chat schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class Message(BaseModel):
    """Chat message schema."""
    role: str = Field(..., description="Role of the message sender (user or assistant)")
    content: str = Field(..., description="Content of the message")


class Symptom(BaseModel):
    """Symptom schema."""
    name: str = Field(..., description="Name of the symptom")
    severity: Optional[str] = Field(None, description="Severity level (mild, moderate, severe)")
    duration: Optional[str] = Field(None, description="How long the symptom has been present")
    description: Optional[str] = Field(None, description="Additional description of the symptom")
    risk_factors: Optional[List[str]] = Field(
        default=None,
        description="Optional list of risk factors mentioned alongside the symptom"
    )


class SymptomExtraction(BaseModel):
    """Symptom extraction response schema."""
    symptoms: List[Symptom] = Field(default_factory=list, description="List of extracted symptoms")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the extraction")


class DiseaseReasoning(BaseModel):
    """Structured reasoning response after symptom extraction."""
    possible_conditions: List[str] = Field(default_factory=list, description="Broad, non-diagnostic condition hypotheses")
    risk_level: Literal["low", "moderate", "high"] = Field(..., description="Estimated medical risk level")
    recommended_specializations: List[str] = Field(
        default_factory=list,
        description="List of medical specialties relevant to the symptoms"
    )
    explanation: str = Field(..., description="Plain-language reasoning for the risk level and conditions")


UrgencyLevel = Literal["low", "moderate", "high", "emergency"]


class DoctorRecommendation(BaseModel):
    """Recommended doctor entry."""
    id: str = Field(..., description="Doctor ID from the database")
    full_name: str = Field(..., description="Doctor's full display name")
    specialization: str = Field(..., description="Primary matched specialization")
    clinic: Optional[str] = Field(None, description="Clinic name if available")
    experience_years: Optional[int] = Field(None, description="Years of experience")
    rating: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=5.0,
        description="Average rating if available"
    )


class DoctorSuggestionResult(BaseModel):
    """Phase 3: doctor suggestion + urgency layer."""
    recommended_doctors: List[DoctorRecommendation] = Field(
        default_factory=list,
        description="List of most suitable doctors for this case"
    )
    urgency_level: UrgencyLevel = Field(
        ...,
        description="Overall urgency derived from symptoms and risk level"
    )
    reasoning: str = Field(
        ...,
        description="Short explanation for urgency and doctor choice (no diagnosis)"
    )


class ChatRequest(BaseModel):
    """Chat request schema."""
    message: str = Field(..., description="User's message")
    conversation_history: List[Message] = Field(default_factory=list, description="Previous conversation history")


class ChatResponse(BaseModel):
    """Chat response schema."""
    reply: str = Field(..., description="AI assistant's response")
    symptoms_extracted: SymptomExtraction = Field(..., description="Extracted symptoms from the conversation")
    disease_reasoning: Optional[DiseaseReasoning] = Field(
        default=None,
        description="Structured disease reasoning output"
    )
    doctor_suggestions: Optional[DoctorSuggestionResult] = Field(
        default=None,
        description="Recommended doctors and urgency information"
    )
    is_medical_query: bool = Field(default=True, description="Whether the incoming query was medical in nature")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class MedicalChatRequest(BaseModel):
    """Medical chat request schema for API."""
    query: str = Field(..., description="User's query")
    history: List[Message] = Field(default_factory=list, description="Conversation history")


class MedicalChatResponse(BaseModel):
    """Medical chat response schema for API."""
    reply: str = Field(..., description="AI response content")
    extracted_symptoms: SymptomExtraction = Field(..., description="Structured symptom extraction payload")
    disease_reasoning: Optional[DiseaseReasoning] = Field(
        default=None,
        description="Structured reasoning payload for possible conditions"
    )
    doctor_suggestions: Optional[DoctorSuggestionResult] = Field(
        default=None,
        description="Doctor recommendation payload with urgency level"
    )
    is_medical_query: bool = Field(..., description="Whether the query passed the medical intent filter")
