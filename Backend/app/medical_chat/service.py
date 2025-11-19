"""
Medical chat service for business logic.
"""
import json
from typing import List, Dict, Any, Optional

from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.core.config import config
from app.medical_chat.schema import (
    Message,
    SymptomExtraction,
    ChatRequest,
    ChatResponse,
    Symptom,
)
from app.medical_chat.prompts import (
    MEDICAL_CHAT_SYSTEM_PROMPT,
    SYMPTOM_EXTRACTION_PROMPT,
)
from app.services import DiseaseReasoningService, DoctorSuggestionService
from app.medical_chat.doctor_suggestion_agent import run_doctor_suggestion_agent


class MedicalChatService:
    """Medical chat service class."""

    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        self.disease_reasoning_service = DiseaseReasoningService(self.client)
        self.doctor_suggestion_service: Optional[DoctorSuggestionService] = (
            DoctorSuggestionService(self.db) if self.db is not None else None
        )

    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Process a chat request and return response with symptom extraction."""
        try:
            is_medical_query = await self.validate_medical_query(request.message)

            if not is_medical_query:
                return ChatResponse(
                    reply="Hi there! I'm your medical assistant. Tell me how you're feeling or share any symptoms, and I'll do my best to guide you.",
                    symptoms_extracted=SymptomExtraction(
                        symptoms=[],
                        confidence_score=0.0,
                    ),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=False,
                )

            # Prepare conversation history
            messages = self._prepare_messages(request)

            # Get chat response
            chat_response = await self._get_chat_response(messages)

            # Extract symptoms
            symptoms_extracted = await self._extract_symptoms(request)

            # Generate disease reasoning
            disease_reasoning = await self.disease_reasoning_service.generate_disease_reasoning(
                symptoms_extracted
            )

            # Phase 3: doctor suggestions + urgency via LangGraph agent (if DB available)
            doctor_suggestions = None
            if self.doctor_suggestion_service is not None and disease_reasoning is not None:
                doctor_suggestions = run_doctor_suggestion_agent(
                    self.doctor_suggestion_service,
                    symptoms_extracted,
                    disease_reasoning,
                )

            return ChatResponse(
                reply=chat_response,
                symptoms_extracted=symptoms_extracted,
                disease_reasoning=disease_reasoning,
                doctor_suggestions=doctor_suggestions,
                is_medical_query=True,
            )

        except Exception as e:
            # Return error response
            return ChatResponse(
                reply="I apologize, but I'm experiencing technical difficulties. Please try again later or consult with a healthcare professional for medical advice.",
                symptoms_extracted=SymptomExtraction(
                    symptoms=[],
                    confidence_score=0.0,
                ),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
            )

    def _prepare_messages(self, request: ChatRequest) -> List[Dict[str, str]]:
        """Prepare messages for OpenAI API."""
        messages = [
            {"role": "system", "content": MEDICAL_CHAT_SYSTEM_PROMPT}
        ]

        # Add conversation history
        for msg in request.conversation_history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add current message
        messages.append({
            "role": "user",
            "content": request.message
        })

        return messages

    async def _get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Get response from OpenAI chat completion."""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using cost-effective model
                messages=messages,
                max_tokens=1000,
                temperature=0.7,
                top_p=0.9
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    async def _extract_symptoms(self, request: ChatRequest) -> SymptomExtraction:
        """Extract symptoms from the conversation using OpenAI."""
        try:
            # Prepare conversation text for symptom extraction
            conversation_text = self._prepare_conversation_text(request)

            extraction_messages = [
                {"role": "system", "content": SYMPTOM_EXTRACTION_PROMPT},
                {"role": "user", "content": f"Conversation:\n{conversation_text}"}
            ]

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=extraction_messages,
                max_tokens=500,
                temperature=0.1,  # Low temperature for consistent extraction
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content.strip()

            # Parse JSON response
            result_data = json.loads(result_text)

            # Convert to SymptomExtraction schema
            symptoms = []
            for symptom_data in result_data.get("symptoms", []):
                symptoms.append(Symptom(**symptom_data))

            confidence_score = result_data.get("confidence_score", 0.5)

            return SymptomExtraction(
                symptoms=symptoms,
                confidence_score=confidence_score
            )

        except Exception as e:
            # Return empty extraction on error
            return SymptomExtraction(
                symptoms=[],
                confidence_score=0.0
            )

    def _prepare_conversation_text(self, request: ChatRequest) -> str:
        """Prepare conversation text for symptom extraction."""
        lines = []

        # Add conversation history
        for msg in request.conversation_history:
            role = "User" if msg.role == "user" else "Assistant"
            lines.append(f"{role}: {msg.content}")

        # Add current message
        lines.append(f"User: {request.message}")

        return "\n".join(lines)

    async def validate_medical_query(self, query: str) -> bool:
        """Validate if a query is medical-related."""
        try:
            validation_messages = [
                {
                    "role": "system",
                    "content": "Determine if the following query is related to medical or health topics. Respond with only 'true' or 'false'."
                },
                {"role": "user", "content": query}
            ]

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=validation_messages,
                max_tokens=10,
                temperature=0.1
            )

            result = response.choices[0].message.content.strip().lower()
            return result == "true"

        except Exception:
            # Default to allowing query if validation fails
            return True
