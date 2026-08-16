"""Review API regression checks using disposable SQLite and real auth dependencies.

Run from Backend: venv/bin/python -m pytest tests/test_doctor_reviews.py
No app lifespan, scheduler, SMTP, or configured PostgreSQL connection is started.
"""
import os

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

# Allow imports in a fresh test environment without loading production secrets.
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://test:test@localhost/unused")
os.environ.setdefault("SECRET_KEY", "review-tests-only-not-for-production")
os.environ.setdefault("OPENAI_API_KEY", "unused-review-tests")

from app.core.exception_handlers import exception_handlers
from app.core.security import SecurityUtils
from app.db.base_class import Base
from app.db.database import get_db
from app.doctors.controller import router
from app.models.doctor import Doctor
from app.models.doctor_review import DoctorReview
from app.models.user import User


@pytest.fixture
def review_api():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        patient = User(id="patient", email="patient@example.test", name="Patient", user_type="patient")
        doctor_user = User(id="doctor-user", email="doctor@example.test", name="Doctor", user_type="doctor")
        db.add_all([patient, doctor_user])
        db.flush()
        db.add_all([Doctor(id="doctor-a", user_id=doctor_user.id), Doctor(id="doctor-b")])
        db.commit()
        app = FastAPI(exception_handlers=exception_handlers)
        app.include_router(router, prefix="/api")
        app.dependency_overrides[get_db] = lambda: db
        client = TestClient(app)
        yield client, db
    engine.dispose()


def headers(user_id):
    return {"Authorization": f"Bearer {SecurityUtils.create_access_token({'sub': user_id})}"}


def test_authentication_and_patient_role(review_api):
    client, db = review_api
    url = "/api/doctors/doctor-a/reviews"
    payload = {"rating": 5, "review": "Helpful consultation."}
    anonymous = client.post(url, json=payload)
    assert anonymous.status_code == 401
    assert anonymous.headers["www-authenticate"] == "Bearer"
    assert client.post(url, json=payload, headers={"Authorization": "Bearer invalid"}).status_code == 401
    assert client.post(url, json=payload, headers=headers("doctor-user")).status_code == 403
    assert db.query(DoctorReview).count() == 0


def test_persistence_doctor_isolation_and_pagination(review_api):
    client, db = review_api
    url = "/api/doctors/doctor-a/reviews"
    for index in range(3):
        response = client.post(url, headers=headers("patient"), json={"rating": index + 3, "review": f"Helpful consultation {index}."})
        assert response.status_code == 201
    rows = db.query(DoctorReview).all()
    assert all(row.user_id == "patient" and row.doctor_id == "doctor-a" for row in rows)
    first = client.get(url, params={"page": 1, "page_size": 2}).json()["data"]
    second = client.get(url, params={"page": 2, "page_size": 2}).json()["data"]
    assert first["total"] == second["total"] == 3
    assert len(first["reviews"]) == 2 and len(second["reviews"]) == 1
    assert {r["id"] for r in first["reviews"]}.isdisjoint(r["id"] for r in second["reviews"])
    assert first["reviews"][0]["reviewer_name"] == "Patient"
    assert client.get("/api/doctors/doctor-b/reviews").json()["data"]["reviews"] == []


@pytest.mark.parametrize("payload", [
    {"rating": 0, "review": "Helpful consultation."},
    {"rating": 6, "review": "Helpful consultation."},
    {"rating": 5, "review": "short"},
    {"rating": 5, "review": "a" * 201},
])
def test_review_validation(review_api, payload):
    client, db = review_api
    assert client.post("/api/doctors/doctor-a/reviews", json=payload, headers=headers("patient")).status_code == 422
    assert db.query(DoctorReview).count() == 0
