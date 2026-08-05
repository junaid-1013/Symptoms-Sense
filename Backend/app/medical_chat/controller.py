"""
Production-grade medical chat controller with authentication support.
"""
import copy
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Depends
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
from app.core.exceptions import InsufficientPermissionsException, UserNotFoundException, ValidationException
from app.core.email_templates import reminder_added
from app.core.mailer import send_email
from app.db.database import get_db
from app.medical_chat.tools import execute_pending_action
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
                {"id": message.id, "role": message.role, "content": message.content, "cards": message.cards or [], "created_at": message.created_at}
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


def _history_text(message: ChatMessage) -> str:
    """Message text for the model, plus bracketed notes about cards so later turns can reuse ids."""
    notes = []
    for card in message.cards or []:
        kind = card.get("type")
        if kind == "doctor_list":
            names = "; ".join(f"{d['name']} (doctor_id {d['id']})" for d in card.get("doctors", []))
            notes.append(f"doctor cards shown: {names}")
        elif kind == "slot_picker":
            notes.append(f"slot picker shown for {card['doctor']['name']} (doctor_id {card['doctor']['id']})")
        elif kind == "appointment_list":
            items = "; ".join(
                f"{a['doctor_name']} on {a['date']} {a['time']} {a['status']} (appointment_id {a['id']})"
                for a in card.get("appointments", [])
            )
            notes.append(f"appointments shown: {items}")
        elif kind in ("appointment_confirm", "reminder_confirm", "cancel_confirm", "reschedule_confirm"):
            notes.append(f"{kind} card shown, status {card.get('status')}")
        elif kind.endswith(("_created", "_cancelled", "_rescheduled")):
            notes.append(f"{kind} done")
    return message.content + (f"\n[{' | '.join(notes)}]" if notes else "")


def _owned_conversation(db: Session, conversation_id: str, user: User) -> ChatConversation:
    conversation = db.get(ChatConversation, conversation_id)
    if not conversation or conversation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


def _take_pending_action(conversation: ChatConversation, action_id: str) -> dict:
    """Remove a pending action from the stored state and return it (404 if unknown / already used)."""
    state = copy.deepcopy(conversation.conversation_state or {})
    pending = state.get("context_data", {}).get("pending_actions", {})
    action = pending.pop(action_id, None)
    if action is None:
        raise HTTPException(status_code=404, detail="This action is no longer available. Ask me to prepare it again.")
    conversation.conversation_state = state
    return action


def _mark_card(conversation: ChatConversation, action_id: str, card_status: str) -> None:
    for message in conversation.messages:
        if not message.cards:
            continue
        cards = copy.deepcopy(message.cards)
        changed = False
        for card in cards:
            if card.get("action_id") == action_id:
                card["status"] = card_status
                changed = True
        if changed:
            message.cards = cards  # reassign so the JSON change is persisted


@router.post("/conversations/{conversation_id}/actions/{action_id}/confirm")
def confirm_action(
    conversation_id: str,
    action_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Commit a booking / cancellation / reschedule / reminder the assistant proposed."""
    conversation = _owned_conversation(db, conversation_id, current_user)
    patient_id = MedicalChatService(db=db).get_patient_id_for_user(current_user.id)
    if not patient_id:
        raise HTTPException(status_code=403, detail="Please sign in as a patient to do this.")
    action = _take_pending_action(conversation, action_id)
    try:
        reply, card, email = execute_pending_action(
            db, user_id=current_user.id, user_type=current_user.user_type, patient_id=patient_id, action=action,
        )
    except (ValidationException, UserNotFoundException, InsufficientPermissionsException) as exc:
        db.rollback()
        # The proposal is spent either way; keep that so a stale card cannot be replayed.
        conversation = _owned_conversation(db, conversation_id, current_user)
        _take_pending_action(conversation, action_id)
        _mark_card(conversation, action_id, "failed")
        db.commit()
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        db.rollback()
        logging.getLogger(__name__).exception("Confirming chat action %s failed", action_id)
        raise HTTPException(status_code=500, detail="Could not complete that action. Please try again.")

    _mark_card(conversation, action_id, "confirmed")
    message = ChatMessage(conversation_id=conversation.id, role="assistant", content=reply, cards=[card])
    db.add(message)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    if email:
        subject, body, html_body = reminder_added(
            current_user.name, email["medicine"], email["dosage"], email["medicine_type"],
            email["days"], email["time_label"],
        )
        background_tasks.add_task(send_email, to=current_user.email, subject=subject, body=body, html_body=html_body)
    return APIResponse(
        message="Action completed",
        data={"id": message.id, "reply": reply, "cards": [card], "conversation_state": conversation.conversation_state},
    ).model_dump()


@router.post("/conversations/{conversation_id}/actions/{action_id}/dismiss")
def dismiss_action(
    conversation_id: str,
    action_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Discard a proposed action without doing anything."""
    conversation = _owned_conversation(db, conversation_id, current_user)
    _take_pending_action(conversation, action_id)
    _mark_card(conversation, action_id, "dismissed")
    db.commit()
    return APIResponse(
        message="Action dismissed", data={"conversation_state": conversation.conversation_state}
    ).model_dump()


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
                # Copy: the agent mutates the state, and mutating the ORM-loaded dict in place hides the change from SQLAlchemy.
                conversation_state = ConversationState(**copy.deepcopy(state_payload))
            except Exception as e:
                # Invalid state, start fresh
                pass

        # Convert request to internal format
        internal_request = ChatRequest(
            message=request.query,
            conversation_history=(
                [Message(role=msg.role, content=_history_text(msg)) for msg in conversation.messages]
                if conversation else request.history
            ),
            conversation_state=conversation_state,
            patient_id=patient_id,
            user_id=current_user.id if current_user else None,
            user_name=current_user.name if current_user else None,
            user_type=current_user.user_type if current_user else None,
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
            cards=response.cards,
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
                ChatMessage(conversation_id=conversation.id, role="assistant", content=response.reply, cards=response.cards or None),
            ])
            conversation.conversation_state = chat_response.conversation_state
            if chat_response.disease_reasoning or chat_response.extracted_symptoms.symptoms:
                # Only replace insights when this turn produced an assessment.
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
