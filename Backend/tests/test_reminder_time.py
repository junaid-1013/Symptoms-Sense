"""Reminder validation/timezone checks; no real DB or email delivery."""
import os
from datetime import datetime, time, timezone
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.triggers.cron import CronTrigger

os.environ.setdefault('DATABASE_URL', 'postgresql+psycopg2://test:test@localhost/unused')
os.environ.setdefault('SECRET_KEY', 'test-only')
os.environ.setdefault('OPENAI_API_KEY', 'unused')

from app.core import scheduler as sched
from app.core.config import config
from app.db.base_class import Base
from app.models import User, Patient
from app.reminders.schema import ReminderCreateRequest
from app.reminders.service import ReminderService
from app.reminders.controller import router

PAYLOAD = dict(medicine_name='Medicine', dosage=1, medicine_type='Tablet', days_of_week=['Mon'], reminder_time='00:15')


@pytest.mark.parametrize('value', ['00:00', '23:59', '10:30', '10:30:00', ' 10:30 '])
def test_minute_time_normalization(value):
    data = ReminderCreateRequest(**{**PAYLOAD, 'reminder_time': value})
    assert data.reminder_time == value.strip()[:5]
    parsed = ReminderService._parse_time(value)
    assert parsed.second == parsed.microsecond == 0


@pytest.mark.parametrize('value', ['', '1:00', '01:1', '24:00', '12:60', '10:30:01', '10:30:99', '10:30:00:00', '10:30Z', '2026-09-30T10:30:00Z'])
def test_reject_malformed_time(value):
    with pytest.raises(ValidationError):
        ReminderCreateRequest(**{**PAYLOAD, 'reminder_time': value})
    with pytest.raises(ValueError):
        ReminderService._parse_time(value)


@pytest.mark.parametrize('changes', [
    {'medicine_name': '  '}, {'medicine_type': '  '}, {'days_of_week': []},
    {'days_of_week': ['Monday']}, {'dosage': 0}, {'dosage': -1},
    {'dosage': 1.5}, {'dosage': True}, {'dosage': '2'},
])
def test_invalid_reminder_fields(changes):
    with pytest.raises(ValidationError):
        ReminderCreateRequest(**{**PAYLOAD, **changes})


def test_trim_and_deduplicate():
    data = ReminderCreateRequest(**{**PAYLOAD, 'medicine_name': ' Medicine ', 'medicine_type': ' Tablet ', 'days_of_week': ['Mon', 'Mon']})
    assert data.medicine_name == 'Medicine' and data.medicine_type == 'Tablet'
    assert data.days_of_week == ['Mon']


def test_public_config_uses_backend_timezone(monkeypatch):
    monkeypatch.setattr(config, 'DEFAULT_TIMEZONE', 'Asia/Karachi')
    app = FastAPI()
    app.include_router(router, prefix='/api')
    response = TestClient(app).get('/api/reminders/config')
    assert response.status_code == 200
    assert response.json()['data'] == {'timezone': 'Asia/Karachi'}


def test_weekday_midnight_boundary(monkeypatch):
    monkeypatch.setattr(config, 'DEFAULT_TIMEZONE', 'Asia/Karachi')
    reminder = SimpleNamespace(days_of_week=['Mon'], reminder_time=time(0, 15))
    trigger = sched._build_reminder_trigger(reminder)
    # Sunday in UTC, already Monday in Karachi; next run is still Monday 00:15.
    now = datetime(2026, 7, 26, 19, 10, tzinfo=timezone.utc)
    next_run = trigger.get_next_fire_time(None, now)
    assert next_run.isoformat() == '2026-07-27T00:15:00+05:00'
    assert next_run.astimezone(timezone.utc).isoformat() == '2026-07-26T19:15:00+00:00'
    assert trigger.get_next_fire_time(next_run, next_run).isoformat() == '2026-08-03T00:15:00+05:00'


def test_persisted_utc_job_reconciled_before_resume(tmp_path, monkeypatch):
    monkeypatch.setattr(config, 'DEFAULT_TIMEZONE', 'Asia/Karachi')
    engine = create_engine('sqlite://')
    Base.metadata.create_all(engine)
    db = Session(engine)
    user = User(id='user', email='test@example.test', name='Test', user_type='patient')
    patient = Patient(id='patient', user=user)
    db.add_all([user, patient]); db.commit()
    reminder = ReminderService(db).create_reminder(patient.id, ReminderCreateRequest(**PAYLOAD))
    ReminderService(db).activate_reminder(reminder)
    assert ReminderService(db).list_reminders(patient.id)[0][0].timezone == 'Asia/Karachi'
    job_url = f'sqlite:///{tmp_path / "jobs.sqlite"}'
    first = BackgroundScheduler(jobstores={'default': SQLAlchemyJobStore(url=job_url)})
    first.start(paused=True)
    monkeypatch.setattr(sched, '_scheduler', first)
    sched.schedule_reminder(reminder)
    first.reschedule_job(f'reminder:{reminder.id}', trigger=CronTrigger(day_of_week='mon', hour=0, minute=15, timezone='UTC'))
    first.shutdown()
    restarted = BackgroundScheduler(jobstores={'default': SQLAlchemyJobStore(url=job_url)})
    restarted.start(paused=True)
    monkeypatch.setattr(sched, '_scheduler', restarted)
    monkeypatch.setattr('app.db.database.SessionLocal', lambda: db)
    try:
        assert str(restarted.get_job(f'reminder:{reminder.id}').trigger.timezone) == 'UTC'
        sched._rehydrate_reminder_jobs()
        job = restarted.get_job(f'reminder:{reminder.id}')
        assert str(job.trigger.timezone) == 'Asia/Karachi'
        assert str(job.trigger) == str(sched._build_reminder_trigger(reminder))
        assert restarted.state == 2  # scheduler stays paused; no emails executed
    finally:
        restarted.shutdown()
        db.close(); engine.dispose()


def test_startup_reconciles_before_resume(monkeypatch):
    fake = Mock()
    monkeypatch.setattr(sched, '_scheduler', None)
    monkeypatch.setattr(sched, 'BackgroundScheduler', lambda **kwargs: fake)
    monkeypatch.setattr(sched, 'SQLAlchemyJobStore', lambda **kwargs: object())
    def reconcile():
        fake.start.assert_called_once_with(paused=True)
        fake.resume.assert_not_called()
    monkeypatch.setattr(sched, '_rehydrate_reminder_jobs', reconcile)
    sched.init_scheduler()
    fake.resume.assert_called_once()


def test_reconciliation_failure_prevents_execution(monkeypatch):
    fake = Mock()
    monkeypatch.setattr(sched, '_scheduler', None)
    monkeypatch.setattr(sched, 'BackgroundScheduler', lambda **kwargs: fake)
    monkeypatch.setattr(sched, 'SQLAlchemyJobStore', lambda **kwargs: object())
    monkeypatch.setattr(sched, '_rehydrate_reminder_jobs', Mock(side_effect=ValueError('Invalid persisted time')))
    with pytest.raises(ValueError):
        sched.init_scheduler()
    fake.resume.assert_not_called()
    fake.shutdown.assert_called_once()
    assert sched._scheduler is None
