"""Failure-injection tests with isolated SQLite, a paused job store, and mocked SMTP."""
import os
from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

os.environ.setdefault('DATABASE_URL', 'postgresql+psycopg2://test:test@localhost/unused')
os.environ.setdefault('SECRET_KEY', 'test-only')
os.environ.setdefault('OPENAI_API_KEY', 'unused')

from app.core import scheduler as sched
from app.core.exception_handlers import exception_handlers
from app.core.security import SecurityUtils
from app.db.database import get_db
from app.db.base_class import Base
from app.models import User, Patient, MedicineReminder
from app.reminders.controller import router
from app.reminders.service import ReminderService

PAYLOAD = dict(medicine_name='Medicine', dosage=1, medicine_type='Tablet', days_of_week=['Mon'], reminder_time='10:30')


@pytest.fixture
def setup(tmp_path, monkeypatch):
    engine = create_engine(f'sqlite:///{tmp_path / "app.sqlite"}', connect_args={'check_same_thread': False})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as db:
        for name in ('owner', 'other'):
            user = User(id=name, email=f'{name}@example.test', name=name, user_type='patient')
            db.add(Patient(id=f'{name}-patient', user=user))
        db.commit()
    monkeypatch.setattr('app.db.database.SessionLocal', factory)
    delivery = Mock(return_value=True)
    confirmation = Mock(return_value=True)
    monkeypatch.setattr('app.core.mailer.send_email', delivery)
    monkeypatch.setattr('app.reminders.controller.send_email', confirmation)
    job_url = f'sqlite:///{tmp_path / "jobs.sqlite"}'
    scheduler = BackgroundScheduler(jobstores={'default': SQLAlchemyJobStore(url=job_url)})
    scheduler.start(paused=True)
    monkeypatch.setattr(sched, '_scheduler', scheduler)
    app = FastAPI(exception_handlers=exception_handlers)
    app.include_router(router, prefix='/api')
    def get_session():
        with factory() as db:
            yield db
    app.dependency_overrides[get_db] = get_session
    client = TestClient(app)
    client.headers['Authorization'] = f"Bearer {SecurityUtils.create_access_token({'sub': 'owner'})}"
    yield client, factory, scheduler, delivery, confirmation, job_url
    if scheduler.running:
        scheduler.shutdown()
    engine.dispose()


def create(setup):
    client, factory, *_ = setup
    assert client.post('/api/reminders', json=PAYLOAD).status_code == 201
    with factory() as db:
        return db.query(MedicineReminder).one().id


def test_create_registers_id_only_then_activates(setup):
    _, factory, scheduler, _, confirmation, _ = setup
    reminder_id = create(setup)
    with factory() as db:
        assert db.get(MedicineReminder, reminder_id).is_active
    job = scheduler.get_job(f'reminder:{reminder_id}')
    assert job.kwargs == {'reminder_id': reminder_id}
    assert not job.args
    assert confirmation.call_args.kwargs['subject'] == 'Medicine Reminder Added'


@pytest.mark.parametrize('partial', [False, True])
def test_registration_failure_never_leaves_active_reminder(setup, monkeypatch, partial):
    client, factory, scheduler, delivery, confirmation, _ = setup
    original = sched.schedule_reminder
    def fail(reminder):
        assert not reminder.is_active
        if partial:
            original(reminder)
        raise RuntimeError('Job store failed')
    monkeypatch.setattr(sched, 'schedule_reminder', fail)
    assert client.post('/api/reminders', json=PAYLOAD).status_code == 503
    with factory() as db:
        row = db.query(MedicineReminder).one()
        assert not row.is_active and row.deleted_at is not None
        sched._send_reminder_email_job(reminder_id=row.id)
    assert scheduler.get_jobs() == []
    confirmation.assert_not_called(); delivery.assert_not_called()


def test_failed_activation_cleans_registered_job(setup, monkeypatch):
    client, factory, scheduler, _, confirmation, _ = setup
    monkeypatch.setattr(ReminderService, 'activate_reminder', Mock(side_effect=RuntimeError('DB unavailable')))
    assert client.post('/api/reminders', json=PAYLOAD).status_code == 503
    with factory() as db:
        assert not db.query(MedicineReminder).one().is_active
    assert scheduler.get_jobs() == []
    confirmation.assert_not_called()


def test_failed_registration_and_cleanup_remain_inert(setup, monkeypatch):
    client, factory, scheduler, delivery, confirmation, _ = setup
    original = sched.schedule_reminder
    def fail(reminder):
        original(reminder)
        raise RuntimeError('Partial job failure')
    monkeypatch.setattr(sched, 'schedule_reminder', fail)
    monkeypatch.setattr(sched, 'unschedule_reminder', Mock(side_effect=RuntimeError('Cleanup failed')))
    assert client.post('/api/reminders', json=PAYLOAD).status_code == 503
    with factory() as db:
        row = db.query(MedicineReminder).one()
        assert not row.is_active
        assert scheduler.get_job(f'reminder:{row.id}')
        sched._send_reminder_email_job(reminder_id=row.id)
    delivery.assert_not_called(); confirmation.assert_not_called()


def test_delete_cleanup_failure_and_repeated_delete(setup, monkeypatch):
    client, factory, scheduler, delivery, confirmation, _ = setup
    reminder_id = create(setup)
    confirmation.reset_mock()
    original = sched.unschedule_reminder
    monkeypatch.setattr(sched, 'unschedule_reminder', Mock(side_effect=RuntimeError('Job store unavailable')))
    assert client.delete(f'/api/reminders/{reminder_id}').status_code == 200
    assert client.delete(f'/api/reminders/{reminder_id}').status_code == 200
    assert confirmation.call_count == 1
    assert client.get('/api/reminders').json()['data']['reminders'] == []
    assert scheduler.get_job(f'reminder:{reminder_id}')
    sched._send_reminder_email_job(reminder_id=reminder_id)
    delivery.assert_not_called()
    monkeypatch.setattr(sched, 'unschedule_reminder', original)
    sched._rehydrate_reminder_jobs()
    assert scheduler.get_job(f'reminder:{reminder_id}') is None


def test_missing_job_and_owner_checks(setup):
    client, factory, scheduler, _, confirmation, _ = setup
    reminder_id = create(setup)
    other_headers = {'Authorization': f"Bearer {SecurityUtils.create_access_token({'sub': 'other'})}"}
    assert client.delete(f'/api/reminders/{reminder_id}', headers=other_headers).status_code == 403
    sched.unschedule_reminder(reminder_id)
    sched.unschedule_reminder(reminder_id)
    assert client.delete(f'/api/reminders/{reminder_id}').status_code == 200
    assert client.delete(f'/api/reminders/{reminder_id}', headers=other_headers).status_code == 403
    assert client.delete('/api/reminders/unknown').status_code == 404


def test_delivery_reads_current_recipient_and_content(setup):
    _, factory, _, delivery, _, _ = setup
    reminder_id = create(setup)
    with factory() as db:
        db.get(User, 'owner').email = 'updated@example.test'
        db.get(MedicineReminder, reminder_id).medicine_name = 'Updated medicine'
        db.commit()
    sched._send_reminder_email_job(reminder_id=reminder_id)
    assert delivery.call_args.kwargs['to'] == 'updated@example.test'
    assert 'Updated medicine' in delivery.call_args.kwargs['body']


@pytest.mark.parametrize('state', ['inactive', 'deleted', 'missing', 'patient_deleted', 'user_inactive', 'user_deleted'])
def test_ineligible_jobs_do_not_deliver(setup, state):
    _, factory, _, delivery, _, _ = setup
    reminder_id = create(setup)
    with factory() as db:
        row = db.get(MedicineReminder, reminder_id)
        if state == 'inactive': row.is_active = False
        elif state == 'deleted': row.soft_delete()
        elif state == 'missing': db.delete(row)
        elif state == 'patient_deleted': db.get(Patient, 'owner-patient').soft_delete()
        elif state == 'user_inactive': db.get(User, 'owner').is_active = False
        elif state == 'user_deleted': db.get(User, 'owner').soft_delete()
        db.commit()
    sched._send_reminder_email_job(reminder_id=reminder_id)
    delivery.assert_not_called()


def test_legacy_payload_never_delivers(setup):
    delivery = setup[3]
    sched._send_reminder_email_job(to='old@example.test', medicine_name='Old', dosage=1, medicine_type='Tablet')
    delivery.assert_not_called()


def test_restart_migrates_legacy_and_removes_orphan_jobs(setup, monkeypatch):
    _, factory, scheduler, delivery, _, job_url = setup
    reminder_id = create(setup)
    job_id = f'reminder:{reminder_id}'
    trigger = scheduler.get_job(job_id).trigger
    legacy = dict(to='old@example.test', medicine_name='Old', dosage=1, medicine_type='Tablet')
    scheduler.add_job(sched._send_reminder_email_job, trigger, id=job_id, kwargs=legacy, replace_existing=True)
    scheduler.add_job(sched._send_reminder_email_job, trigger, id='reminder:orphan', kwargs=legacy)
    scheduler.add_job(sched._send_reminder_email_job, trigger, id='unrelated-job', kwargs=legacy)
    scheduler.shutdown()
    restarted = BackgroundScheduler(jobstores={'default': SQLAlchemyJobStore(url=job_url)})
    restarted.start(paused=True)
    monkeypatch.setattr(sched, '_scheduler', restarted)
    try:
        assert restarted.get_job(job_id).kwargs == legacy
        sched._rehydrate_reminder_jobs()
        assert restarted.get_job(job_id).kwargs == {'reminder_id': reminder_id}
        assert restarted.get_job('reminder:orphan') is None
        assert restarted.get_job('unrelated-job') is not None
        saved_next = restarted.get_job(job_id).next_run_time
        sched._rehydrate_reminder_jobs()
        assert restarted.get_job(job_id).next_run_time == saved_next
        delivery.assert_not_called()
    finally:
        restarted.shutdown()


def test_missing_active_job_restored(setup):
    _, _, scheduler, _, _, _ = setup
    reminder_id = create(setup)
    sched.unschedule_reminder(reminder_id)
    sched._rehydrate_reminder_jobs()
    assert scheduler.get_job(f'reminder:{reminder_id}').kwargs == {'reminder_id': reminder_id}


def test_smtp_failure_does_not_change_persistence(setup):
    client, factory, _, _, confirmation, _ = setup
    confirmation.return_value = False
    reminder_id = create(setup)
    with factory() as db:
        assert db.get(MedicineReminder, reminder_id).is_active
    assert client.delete(f'/api/reminders/{reminder_id}').status_code == 200
    with factory() as db:
        assert not db.get(MedicineReminder, reminder_id).is_active


def test_activation_commit_failure_rolls_back_before_compensation(setup, monkeypatch):
    from unittest.mock import patch
    client, factory, scheduler, delivery, confirmation, _ = setup
    original = ReminderService.activate_reminder
    def fail_commit(service, reminder):
        with patch.object(service.db, 'commit', side_effect=RuntimeError('Commit failed')):
            original(service, reminder)
    monkeypatch.setattr(ReminderService, 'activate_reminder', fail_commit)
    assert client.post('/api/reminders', json=PAYLOAD).status_code == 503
    with factory() as db:
        row = db.query(MedicineReminder).one()
        assert not row.is_active and row.deleted_at is not None
        sched._send_reminder_email_job(reminder_id=row.id)
    assert not scheduler.get_jobs()
    delivery.assert_not_called(); confirmation.assert_not_called()


def test_failed_registration_with_unavailable_compensation_stays_inactive(setup, monkeypatch):
    client, factory, _, delivery, confirmation, _ = setup
    monkeypatch.setattr(sched, 'schedule_reminder', Mock(side_effect=RuntimeError('Job store down')))
    monkeypatch.setattr(ReminderService, 'delete_reminder', Mock(side_effect=RuntimeError('DB down')))
    assert client.post('/api/reminders', json=PAYLOAD).status_code == 503
    with factory() as db:
        row = db.query(MedicineReminder).one()
        assert not row.is_active
        sched._send_reminder_email_job(reminder_id=row.id)
    delivery.assert_not_called(); confirmation.assert_not_called()
