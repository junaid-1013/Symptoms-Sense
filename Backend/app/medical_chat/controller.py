"""
Medical chat controller with FastAPI routes.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.medical_chat.schema import MedicalChatRequest, MedicalChatResponse
from app.medical_chat.service import MedicalChatService
from app.core.response import APIResponse, APIResponseGeneric
from app.db.database import get_db

router = APIRouter(prefix="/medical-chat", tags=["medical_chat"])


@router.post("", response_model=APIResponseGeneric[MedicalChatResponse])
async def chat_with_ai(
    request: MedicalChatRequest,
    db: Session = Depends(get_db),
):
    """Chat with AI medical assistant."""
    try:
        service = MedicalChatService(db=db)

        # Convert request to internal format
        from app.medical_chat.schema import ChatRequest, Message
        internal_request = ChatRequest(
            message=request.query,
            conversation_history=[
                Message(role=msg.role, content=msg.content)
                for msg in request.history
            ]
        )

        # Get response from service
        response = await service.chat(internal_request)

        # Format response
        chat_response = MedicalChatResponse(
            reply=response.reply,
            extracted_symptoms=response.symptoms_extracted,
            disease_reasoning=response.disease_reasoning,
            doctor_suggestions=response.doctor_suggestions,
            is_medical_query=response.is_medical_query,
        )

        return APIResponse(
            message="Chat response generated successfully",
            data=chat_response
        ).dict()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat service error: {str(e)}"
        )
