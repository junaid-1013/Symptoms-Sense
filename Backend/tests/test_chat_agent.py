"""Chat agent tools: propose -> confirm flow, auth gating and ownership, on disposable SQLite."""
import json
import os
from datetime import datetime, time, timedelta
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://test:test@localhost/unused")
os.environ.setdefault("SECRET_KEY", "chat-agent-tests-only-not-for-production")
os.environ.setdefault("OPENAI_API_KEY", "unused-chat-agent-tests")

from app.core import scheduler as sched  # noqa: E402
from app.core.security import SecurityUtils  # noqa: E402
from app.db.base_class import Base  # noqa: E402
from app.db.database import get_db  # noqa: E402
from app.medical_chat import service as chat_service  # noqa: E402
from app.medical_chat.controller import router  # noqa: E402
from app.models import (  # noqa: E402
    Appointment, Clinic, Doctor, DoctorSchedule, MedicineReminder, Patient, User,
)


def auth(user_id: str) -> dict:
    return {"Authorization": f"Bearer {SecurityUtils.create_access_token({'sub': user_id})}"}


def tool_call(name: str, **arguments):
    return SimpleNamespace(
        content=None,
        tool_calls=[SimpleNamespace(id=f"call_{name}", function=SimpleNamespace(name=name, arguments=json.dumps(arguments)))],
    )


def final(text: str):
    return SimpleNamespace(content=text, tool_calls=None)


class FakeOpenAI:
    """Scripted model: each completion pops the next message; records what it was sent."""
    script: list = []
    seen: list = []

    def __init__(self, *args, **kwargs):
        async def create(**kwargs):
            FakeOpenAI.seen.append(kwargs["messages"])
            return SimpleNamespace(choices=[SimpleNamespace(message=FakeOpenAI.script.pop(0))])
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=create))


@pytest.fixture
def env(monkeypatch):
    monkeypatch.setattr(chat_service, "AsyncOpenAI", FakeOpenAI)
    FakeOpenAI.script, FakeOpenAI.seen = [], []
    scheduled = []
    monkeypatch.setattr(sched, "schedule_reminder", lambda reminder: scheduled.append(reminder.id))
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

    @event.listens_for(engine, "connect")
    def foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add_all([
            User(id="pat-user", email="pat@example.test", name="Pat", user_type="patient", is_active=True),
            User(id="other-user", email="other@example.test", name="Other", user_type="patient", is_active=True),
            User(id="clinic-user", email="clinic@example.test", name="Test Clinic", user_type="clinic", is_active=True),
            User(id="doc-user", email="doc@example.test", name="Dr. Test", user_type="doctor", is_active=True),
        ])
        db.flush()
        db.add_all([
            Patient(id="pat", user_id="pat-user"),
            Patient(id="other", user_id="other-user"),
            Clinic(id="clinic", user_id="clinic-user", address="Gulberg, Lahore"),
        ])
        db.flush()
        db.add(Doctor(id="doc", user_id="doc-user", clinic_id="clinic", specializations=["Cardiologist"],
                      experience_years=9, status="active"))
        db.flush()
        for day in ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"):
            db.add(DoctorSchedule(doctor_id="doc", day_of_week=day, start_time=time(10), end_time=time(13),
                                  slot_duration=30, is_active=True))
        db.commit()
        app = FastAPI()
        app.include_router(router, prefix="/api")
        app.dependency_overrides[get_db] = lambda: db
        yield SimpleNamespace(client=TestClient(app), db=db, scheduled=scheduled)
    engine.dispose()


def chat(env, query, user="pat-user", conversation_id=None):
    headers = auth(user) if user else {}
    body = {"query": query}
    if conversation_id:
        body["conversation_id"] = conversation_id
    return env.client.post("/api/medical-chat", headers=headers, json=body)


def future_day(days=3):
    return (datetime.utcnow() + timedelta(days=days)).date().isoformat()


def test_booking_needs_explicit_confirmation(env):
    day = future_day()
    FakeOpenAI.script = [
        tool_call("search_doctors", specialization="Cardio"),
        final("Here is a cardiologist near you."),
    ]
    first = chat(env, "I need a heart doctor in Lahore").json()["data"]
    assert first["cards"][0]["type"] == "doctor_list"
    assert first["cards"][0]["doctors"][0]["id"] == "doc"
    conversation_id = first["conversation_id"]

    FakeOpenAI.script = [
        tool_call("get_available_slots", doctor_id="doc", date=day),
        final("Pick a time."),
    ]
    slots = chat(env, "Show times", conversation_id=conversation_id).json()["data"]["cards"][0]
    assert slots["type"] == "slot_picker" and slots["days"][0]["slots"][0]["time"] == "10:00"

    FakeOpenAI.script = [
        tool_call("propose_appointment", doctor_id="doc", date=day, time="10:30", reason="Palpitations"),
        final("Tap Confirm to book."),
    ]
    proposed = chat(env, "10:30 please", conversation_id=conversation_id).json()["data"]
    card = proposed["cards"][0]
    assert card["type"] == "appointment_confirm" and card["status"] == "pending"
    assert env.db.query(Appointment).count() == 0  # nothing written by the model

    url = f"/api/medical-chat/conversations/{conversation_id}/actions/{card['action_id']}"
    assert env.client.post(url + "/confirm", headers=auth("other-user")).status_code == 404  # not the owner
    done = env.client.post(url + "/confirm", headers=auth("pat-user"))
    assert done.status_code == 200, done.text
    assert done.json()["data"]["cards"][0]["type"] == "appointment_created"
    appointment = env.db.query(Appointment).one()
    assert appointment.patient_id == "pat" and appointment.chief_complaint == "Palpitations"
    assert env.client.post(url + "/confirm", headers=auth("pat-user")).status_code == 404  # no replay

    saved = env.client.get(f"/api/medical-chat/conversations/{conversation_id}", headers=auth("pat-user")).json()["data"]
    statuses = [c["status"] for m in saved["messages"] for c in m["cards"] if c["type"] == "appointment_confirm"]
    assert statuses == ["confirmed"]
    assert saved["messages"][-1]["cards"][0]["type"] == "appointment_created"


def test_booked_slot_is_not_offered_again(env):
    day = future_day()
    FakeOpenAI.script = [tool_call("propose_appointment", doctor_id="doc", date=day, time="10:00"), final("ok")]
    data = chat(env, "book 10:00").json()["data"]
    card = data["cards"][0]
    env.client.post(
        f"/api/medical-chat/conversations/{data['conversation_id']}/actions/{card['action_id']}/confirm",
        headers=auth("pat-user"),
    )
    FakeOpenAI.script = [tool_call("propose_appointment", doctor_id="doc", date=day, time="10:00"), final("ok")]
    again = chat(env, "book 10:00", user="other-user").json()["data"]
    assert not any(c["type"] == "appointment_confirm" for c in again["cards"])
    tool_result = json.loads(FakeOpenAI.seen[-1][-1]["content"])
    assert "not an open slot" in tool_result["error"]


def test_reminder_is_scheduled_only_after_confirm(env):
    FakeOpenAI.script = [
        tool_call("propose_reminder", medicine_name="Metformin", time="21:00", days_of_week=["daily"], dosage=500,
                  medicine_type="tablet"),
        final("Tap Confirm to set it."),
    ]
    data = chat(env, "remind me to take Metformin 500mg every night at 9").json()["data"]
    card = data["cards"][0]
    assert card["type"] == "reminder_confirm"
    assert card["summary"]["days_of_week"] == ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    assert env.db.query(MedicineReminder).count() == 0 and env.scheduled == []

    url = f"/api/medical-chat/conversations/{data['conversation_id']}/actions/{card['action_id']}"
    assert env.client.post(url + "/confirm", headers=auth("pat-user")).status_code == 200
    reminder = env.db.query(MedicineReminder).one()
    assert reminder.is_active and reminder.patient_id == "pat" and reminder.reminder_time == time(21, 0)
    assert env.scheduled == [reminder.id]


def test_dismiss_discards_pending_action(env):
    FakeOpenAI.script = [
        tool_call("propose_reminder", medicine_name="Vitamin D", time="13:00", days_of_week=["Mon"]),
        final("Confirm?"),
    ]
    data = chat(env, "remind me about vitamin D on Mondays at 1pm").json()["data"]
    card = data["cards"][0]
    url = f"/api/medical-chat/conversations/{data['conversation_id']}/actions/{card['action_id']}"
    assert env.client.post(url + "/dismiss", headers=auth("pat-user")).status_code == 200
    assert env.client.post(url + "/confirm", headers=auth("pat-user")).status_code == 404
    assert env.db.query(MedicineReminder).count() == 0


def test_anonymous_user_gets_sign_in_card_not_booking(env):
    FakeOpenAI.script = [
        tool_call("propose_appointment", doctor_id="doc", date=future_day(), time="10:00"),
        final("Please sign in to book."),
    ]
    data = chat(env, "book the cardiologist at 10", user=None).json()["data"]
    assert [c["type"] for c in data["cards"]] == ["login_required"]
    assert env.db.query(Appointment).count() == 0
    assert "conversation_id" not in data or data["conversation_id"] is None


def test_cannot_cancel_someone_elses_appointment(env):
    day = future_day(5)
    FakeOpenAI.script = [tool_call("propose_appointment", doctor_id="doc", date=day, time="11:00"), final("ok")]
    data = chat(env, "book 11").json()["data"]
    card = data["cards"][0]
    env.client.post(
        f"/api/medical-chat/conversations/{data['conversation_id']}/actions/{card['action_id']}/confirm",
        headers=auth("pat-user"),
    )
    appointment_id = env.db.query(Appointment).one().id
    FakeOpenAI.script = [tool_call("propose_cancel_appointment", appointment_id=appointment_id), final("ok")]
    other = chat(env, "cancel it", user="other-user").json()["data"]
    assert other["cards"] == []
    assert "not found" in json.loads(FakeOpenAI.seen[-1][-1]["content"])["error"].lower()

    FakeOpenAI.script = [tool_call("propose_cancel_appointment", appointment_id=appointment_id), final("ok")]
    mine = chat(env, "cancel it").json()["data"]
    assert mine["cards"][0]["type"] == "cancel_confirm"
    assert env.db.query(Appointment).one().status != "cancelled"


def test_pending_action_survives_a_second_turn_with_fresh_sessions(env):
    """Regression: the agent mutated the ORM-loaded state in place, so SQLAlchemy never saved the new proposal."""
    bind = env.db.get_bind()
    env.client.app.dependency_overrides[get_db] = lambda: (yield from _session_per_request(bind))
    FakeOpenAI.script = [final("Hello! How can I help?")]
    first = chat(env, "hi").json()["data"]
    conversation_id = first["conversation_id"]
    FakeOpenAI.script = [
        tool_call("propose_reminder", medicine_name="Zinc", time="07:00", days_of_week=["Mon"]), final("Confirm?"),
    ]
    second = chat(env, "remind me about zinc", conversation_id=conversation_id).json()["data"]
    action_id = second["cards"][0]["action_id"]
    url = f"/api/medical-chat/conversations/{conversation_id}/actions/{action_id}/confirm"
    assert env.client.post(url, headers=auth("pat-user")).status_code == 200


def _session_per_request(bind):
    with Session(bind) as session:
        yield session
