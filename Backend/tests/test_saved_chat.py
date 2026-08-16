"""Saved chat ownership and demo-seed behavior on disposable SQLite."""
import os

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://test:test@localhost/unused")
os.environ.setdefault("SECRET_KEY", "saved-chat-tests-only-not-for-production")
os.environ.setdefault("OPENAI_API_KEY", "unused-saved-chat-tests")

from app.core.security import SecurityUtils  # noqa: E402
from app.db.base_class import Base  # noqa: E402
from app.db.database import get_db  # noqa: E402
from app.medical_chat.controller import router  # noqa: E402
from app.models.chat_conversation import ChatConversation, ChatMessage  # noqa: E402
from app.models.user import User  # noqa: E402
from app.medical_chat.schema import ChatResponse, SymptomExtraction  # noqa: E402
from app.medical_chat.service import MedicalChatService  # noqa: E402


def auth(user_id: str) -> dict:
    return {"Authorization": f"Bearer {SecurityUtils.create_access_token({'sub': user_id})}"}


def test_saved_chat_is_private_and_delete_removes_messages(monkeypatch):
    async def fake_chat(self, request):
        return ChatResponse(
            reply="A clinician can help review that concern.",
            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0),
            is_medical_query=True,
        )
    monkeypatch.setattr(MedicalChatService, "chat", fake_chat)
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    @event.listens_for(engine, "connect")
    def foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add_all([
            User(id="owner", email="owner@example.test", name="Owner", user_type="patient", is_active=True),
            User(id="other", email="other@example.test", name="Other", user_type="patient", is_active=True),
        ])
        db.flush()
        db.add(ChatConversation(id="chat", user_id="owner", title="Sample chat"))
        db.flush()
        db.add(ChatMessage(id="message", conversation_id="chat", role="user", content="Hello"))
        db.commit()
        app = FastAPI()
        app.include_router(router, prefix="/api")
        app.dependency_overrides[get_db] = lambda: db
        client = TestClient(app)
        assert client.get("/api/medical-chat/conversations").status_code == 401
        assert client.get("/api/medical-chat/conversations", headers=auth("other")).json()["data"] == []
        assert client.get("/api/medical-chat/conversations/chat", headers=auth("other")).status_code == 404
        assert client.delete("/api/medical-chat/conversations/chat", headers=auth("other")).status_code == 404
        own = client.get("/api/medical-chat/conversations/chat", headers=auth("owner"))
        assert own.status_code == 200
        assert own.json()["data"]["messages"][0]["content"] == "Hello"
        forbidden_reply = client.post("/api/medical-chat", headers=auth("other"), json={"query": "Another question", "conversation_id": "chat"})
        assert forbidden_reply.status_code == 404
        reply = client.post("/api/medical-chat", headers=auth("owner"), json={"query": "Another question", "conversation_id": "chat"})
        assert reply.status_code == 200
        assert reply.json()["data"]["conversation_id"] == "chat"
        saved = client.get("/api/medical-chat/conversations/chat", headers=auth("owner")).json()["data"]
        assert [(row["role"], row["content"]) for row in saved["messages"]][-2:] == [
            ("user", "Another question"), ("assistant", "A clinician can help review that concern."),
        ]
        assert client.delete("/api/medical-chat/conversations/chat", headers=auth("owner")).status_code == 200
        assert db.get(ChatMessage, "message") is None
    engine.dispose()
