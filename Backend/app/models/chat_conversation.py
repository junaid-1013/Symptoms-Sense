"""Saved medical-assistant conversations, scoped to an account."""
import uuid

from sqlalchemy import Column, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class ChatConversation(Base):
    __tablename__ = "chat_conversation"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    conversation_state = Column(JSON, nullable=True)
    insights = Column(JSON, nullable=True)
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_message"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("chat_conversation.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(16), nullable=False)
    content = Column(Text, nullable=False)
    cards = Column(JSON, nullable=True)  # structured UI cards (doctors, slots, confirmations) rendered under the message
    conversation = relationship("ChatConversation", back_populates="messages")
