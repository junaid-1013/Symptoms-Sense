"""
Production-grade medical chat controller with authentication support.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import select
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
from app.models.chat_conversation import ChatConversation, ChatMessage
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/medical-chat", tags=["medical_chat"])

security = HTTPBearer(auto_error=False)


def serialize_conversation(conversation: ChatConversation, include_messages: bool = False) -> dict:
    result = {
        "id": conversation.id,
        "title": conversation.title,
        "updated_at": conversation.updated_at or conversation.created_at,
    }
    if include_messages:
        result.update({
            "messages": [
                {"id": message.id, "role": message.role, "content": message.content, "created_at": message.created_at}
                for message in conversation.messages
            ],
            "conversation_state": conversation.conversation_state,
            "insights": conversation.insights,
        })
    return result


@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversations = db.scalars(
        select(ChatConversation)
        .where(ChatConversation.user_id == current_user.id)
        .order_by(ChatConversation.updated_at.desc().nullslast(), ChatConversation.created_at.desc())
    ).all()
    return APIResponse(message="Conversations loaded", data=[serialize_conversation(item) for item in conversations]).model_dump()


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversation = db.get(ChatConversation, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return APIResponse(message="Conversation loaded", data=serialize_conversation(conversation, include_messages=True)).model_dump()


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversation = db.get(ChatConversation, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conversation)
    db.commit()
    return APIResponse(message="Conversation deleted", data={"id": conversation_id}).model_dump()


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
        conversation = None
        if request.conversation_id:
            if not current_user:
                raise HTTPException(status_code=401, detail="Sign in to continue a saved conversation")
            conversation = db.get(ChatConversation, request.conversation_id)
            if not conversation or conversation.user_id != current_user.id:
                raise HTTPException(status_code=404, detail="Conversation not found")

        # Convert conversation state if provided
        conversation_state = None
        state_payload = conversation.conversation_state if conversation else request.conversation_state
        if state_payload:
            try:
                conversation_state = ConversationState(**state_payload)
            except Exception as e:
                # Invalid state, start fresh
                pass

        # Convert request to internal format
        internal_request = ChatRequest(
            message=request.query,
            conversation_history=(
                [Message(role=msg.role, content=msg.content) for msg in conversation.messages]
                if conversation else request.history
            ),
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

        if current_user:
            if conversation is None:
                conversation = ChatConversation(
                    id=str(uuid4()),
                    user_id=current_user.id,
                    title=request.query.strip()[:120],
                )
                db.add(conversation)
            db.add_all([
                ChatMessage(conversation_id=conversation.id, role="user", content=request.query),
                ChatMessage(conversation_id=conversation.id, role="assistant", content=response.reply),
            ])
            conversation.conversation_state = chat_response.conversation_state
            conversation.insights = {
                "extracted_symptoms": chat_response.extracted_symptoms.model_dump(mode="json"),
                "disease_reasoning": chat_response.disease_reasoning,
                "doctor_suggestions": chat_response.doctor_suggestions,
                "is_medical_query": chat_response.is_medical_query,
            }
            conversation.updated_at = datetime.now(timezone.utc)
            db.commit()
            chat_response.conversation_id = conversation.id

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
