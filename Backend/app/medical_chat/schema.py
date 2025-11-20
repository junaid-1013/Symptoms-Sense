from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any
from datetime import datetime


class Message(BaseModel):
    """Message in conversation history."""
    role: str = Field(..., description="Role of the message sender (user/assistant)")
    content: str = Field(..., description="Content of the message")


class Symptom(BaseModel):
    """Extracted symptom information."""
    name: str = Field(..., description="Name of the symptom")
    severity: Optional[str] = Field(None, description="Severity level (mild/moderate/severe)")
    duration: Optional[str] = Field(None, description="How long the symptom has lasted")
    description: Optional[str] = Field(None, description="Additional description")
    risk_factors: Optional[List[str]] = Field(default_factory=list, description="Associated risk factors")


class SymptomExtraction(BaseModel):
    """Container for extracted symptoms."""
    symptoms: List[Symptom] = Field(default_factory=list, description="List of extracted symptoms")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in the extraction")



class InteractiveOption(BaseModel):
    """Interactive option for user selection."""
    label: str = Field(..., description="Display text for the option")
    value: str = Field(..., description="Value to send back when selected")
    type: str = Field(..., description="Type of option (button, link, etc.)")
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
    experience_years: Optional[int] = Field(None, description="Years of experience")
    clinic: Optional[str] = Field(None, description="Clinic name if available")
    rating: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=5.0,
        description="Average rating if available"
    )

class DoctorInfo(BaseModel):
    """Doctor information for chat responses."""
    id: str = Field(..., description="Doctor ID")
    name: str = Field(..., description="Doctor's name")
    specializations: List[str] = Field(default_factory=list, description="Medical specializations")
    clinic_name: str = Field(..., description="Clinic name")
    experience_years: Optional[int] = Field(None, description="Years of experience")
    bio: Optional[str] = Field(None, description="Doctor bio")

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

class ConversationState(BaseModel):
    """Conversation state for multi-turn interactions."""
    intent: Optional[str] = Field(None, description="Current conversation intent")
    booking_stage: Optional[str] = Field(None, description="Current stage in booking flow")
    selected_doctor_id: Optional[str] = Field(None, description="Selected doctor ID")
    selected_timeslot_id: Optional[str] = Field(None, description="Selected timeslot ID")
    extracted_date: Optional[str] = Field(None, description="Extracted appointment date")
    extracted_time: Optional[str] = Field(None, description="Extracted appointment time")
    chief_complaint: Optional[str] = Field(None, description="Chief complaint for appointment")
    context_data: Dict[str, Any] = Field(default_factory=dict, description="Additional context data")


class ChatRequest(BaseModel):
    """Request for chat interaction."""
    message: str = Field(..., min_length=1, max_length=2000, description="Current user message")
    conversation_history: List[Message] = Field(default_factory=list, description="Previous conversation messages")
    conversation_state: Optional[ConversationState] = Field(None, description="Current conversation state")
    patient_id: Optional[str] = Field(None, description="Patient ID if authenticated")


class ChatResponse(BaseModel):
    """Response from chat service."""
    reply: str = Field(..., description="AI assistant's response")
    symptoms_extracted: SymptomExtraction = Field(..., description="Extracted symptoms from conversation")
    disease_reasoning: Optional[Dict[str, Any]] = Field(None, description="Disease reasoning analysis")
    doctor_suggestions: Optional[Dict[str, Any]] = Field(None, description="Doctor recommendations")
    is_medical_query: bool = Field(..., description="Whether the query was medical-related")
    interactive_options: Optional[List[InteractiveOption]] = Field(None, description="Interactive options for user")
    doctors_list: Optional[List[DoctorInfo]] = Field(None, description="List of doctors for selection")
    conversation_state: Optional[ConversationState] = Field(None, description="Updated conversation state")
    appointment_created: Optional[Dict[str, Any]] = Field(None, description="Created appointment details if booking completed")


class MedicalChatRequest(BaseModel):
    """API request for medical chat."""
    query: str = Field(..., min_length=1, max_length=2000, description="User's query")
    history: List[Message] = Field(default_factory=list, description="Conversation history")
    conversation_state: Optional[Dict[str, Any]] = Field(None, description="Current conversation state")


class MedicalChatResponse(BaseModel):
    """API response for medical chat."""
    reply: str = Field(..., description="AI assistant's reply")
    extracted_symptoms: SymptomExtraction = Field(..., description="Symptoms extracted from query")
    disease_reasoning: Optional[Dict[str, Any]] = Field(None, description="Disease reasoning")
    doctor_suggestions: Optional[Dict[str, Any]] = Field(None, description="Doctor suggestions")
    is_medical_query: bool = Field(..., description="Query type flag")
    interactive_options: Optional[List[InteractiveOption]] = Field(None, description="Interactive options")
    doctors_list: Optional[List[DoctorInfo]] = Field(None, description="List of doctors")
    conversation_state: Optional[Dict[str, Any]] = Field(None, description="Updated conversation state")
    appointment_created: Optional[Dict[str, Any]] = Field(None, description="Created appointment details if booking completed")
