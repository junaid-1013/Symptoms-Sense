"""
Production-grade medical chat controller with authentication support.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.medical_chat.schema import (
    MedicalChatRequest, 
    MedicalChatResponse,
    ChatRequest,
    Message,
    ConversationState,
)
from app.medical_chat.service import MedicalChatService
from app.core.response import APIResponse, APIResponseGeneric
from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/medical-chat", tags=["medical_chat"])

security = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None."""
    if not credentials:
        return None
    
    try:
        # Verify token directly (similar to schedules controller)
        from app.core.security import SecurityUtils
        payload = SecurityUtils.verify_token(credentials.credentials, "access")
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        from app.auth.service import AuthService
        auth_service = AuthService(db)
        user = auth_service.get_user_by_id(user_id)
        
        if user and user.is_active:
            return user
        return None
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"Authentication check failed: {str(e)}")
        return None


@router.post("", response_model=APIResponseGeneric[MedicalChatResponse])
async def chat_with_ai(
    request: MedicalChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Chat with AI medical assistant.
    
    Supports:
    - Symptom understanding and analysis
    - Doctor search and recommendations
    - Multi-turn appointment booking (requires authentication)
    - Natural conversation flow
    """
    try:
        service = MedicalChatService(db=db)
        patient_id = service.get_patient_id_for_user(current_user.id) if current_user else None

        # Convert conversation state if provided
        conversation_state = None
        if request.conversation_state:
            try:
                conversation_state = ConversationState(**request.conversation_state)
            except Exception as e:
                # Invalid state, start fresh
                pass

        # Convert request to internal format
        internal_request = ChatRequest(
            message=request.query,
            conversation_history=[
                Message(role=msg.role, content=msg.content)
                for msg in request.history
            ],
            conversation_state=conversation_state,
            patient_id=patient_id,
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
            interactive_options=response.interactive_options,
            doctors_list=response.doctors_list,
            conversation_state=response.conversation_state.model_dump() if response.conversation_state else None,
            appointment_created=response.appointment_created,
        )

        return APIResponse(
            message="Chat response generated successfully",
            data=chat_response
        ).model_dump()

    except HTTPException:
        raise
    except Exception as e:
        # Log error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Chat service error: {str(e)}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request. Please try again later."
        )
