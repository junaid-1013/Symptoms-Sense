"""
Background scheduler powered by APScheduler with a persistent SQLAlchemyJobStore.

Used to schedule recurring medicine-reminder emails. Jobs are persisted in the
`apscheduler_jobs` table (auto-created by APScheduler on first start) so that
they survive application restarts.
"""
import logging
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.jobstores.base import JobLookupError
from apscheduler.triggers.cron import CronTrigger

from app.core.config import config

logger = logging.getLogger(__name__)

_scheduler: Optional[BackgroundScheduler] = None


def get_scheduler() -> BackgroundScheduler:
    """Return the running scheduler instance.

    Raises RuntimeError if init_scheduler() has not been called yet.
    """
    if _scheduler is None:
        raise RuntimeError("Scheduler is not initialized. Call init_scheduler() first.")
    return _scheduler


def init_scheduler() -> BackgroundScheduler:
    """
    Create, configure, and start the BackgroundScheduler.

    Safe to call multiple times; subsequent calls return the existing instance.
    """
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return _scheduler

    jobstores = {
        "default": SQLAlchemyJobStore(url=config.DATABASE_URL),
    }
    job_defaults = {
        "coalesce": True,        # Skip missed runs and just run once when caught up
        "max_instances": 1,      # Don't run a single job in parallel with itself
        "misfire_grace_time": 300,  # Allow 5 minutes of lateness before declaring a misfire
    }

    _scheduler = BackgroundScheduler(
        jobstores=jobstores,
        job_defaults=job_defaults,
        timezone=config.DEFAULT_TIMEZONE,
    )
    # Persisted triggers may use an old timezone. Inspect them before any job runs.
    try:
        _scheduler.start(paused=True)
        _rehydrate_reminder_jobs()
        _scheduler.resume()
    except Exception as exc:
        logger.exception("Failed to rehydrate reminder jobs: %s", exc)
        shutdown_scheduler()
        raise

    logger.info("Scheduler started (timezone=%s)", config.DEFAULT_TIMEZONE)

    return _scheduler


def shutdown_scheduler(wait: bool = False) -> None:
    """Stop the scheduler if it is running."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=wait)
        logger.info("Scheduler stopped")
    _scheduler = None


# ========== Reminder email job (top-level so APScheduler can serialize it) ==========
def _send_reminder_email_job(reminder_id: Optional[str] = None, **legacy_payload) -> None:
    """Look up the current reminder before delivery; legacy serialized jobs are inert.

    Keep this function path and accept the old keyword arguments so APScheduler
    can deserialize old jobs for startup migration without sending stale mail.
    """
    if reminder_id is None or legacy_payload:
        logger.warning("Skipped legacy reminder job pending reconciliation")
        return

    from app.db.database import SessionLocal
    from app.models.reminder import MedicineReminder
    from app.models.patient import Patient
    from sqlalchemy.orm import joinedload
    from app.core.mailer import send_email

    db = SessionLocal()
    try:
        reminder = (
            db.query(MedicineReminder)
            .options(joinedload(MedicineReminder.patient).joinedload(Patient.user))
            .filter(
                MedicineReminder.id == reminder_id,
                MedicineReminder.is_active.is_(True),
                MedicineReminder.deleted_at.is_(None),
            )
            .first()
        )
        if reminder is None:
            logger.info("Skipped inactive or missing reminder %s", reminder_id)
            return
        patient = reminder.patient
        user = patient.user if patient else None
        if (patient is None or patient.deleted_at is not None or user is None
                or user.deleted_at is not None or not user.is_active):
            logger.info("Skipped reminder %s for unavailable patient", reminder_id)
            return
        recipient = user.email
        subject = f"Medicine Reminder: {reminder.medicine_name}"
        body = (
            "Hi,\n\nThis is your scheduled reminder to take your medicine:\n"
            f"  Medicine: {reminder.medicine_name}\n"
            f"  Dosage: {reminder.dosage}\n"
            f"  Type: {reminder.medicine_type}\n\n"
            "Take care and stay healthy!"
        )
    finally:
        db.close()
    # Cancellation cannot recall an email already entering SMTP delivery.
    send_email(to=recipient, subject=subject, body=body)

# ========== Reminder helpers ==========

def _reminder_job_id(reminder_id: str) -> str:
    """Stable job id for a medicine reminder so we can find/replace/remove it."""
    return f"reminder:{reminder_id}"


def _build_reminder_trigger(reminder) -> CronTrigger:
    """Interpret persisted weekdays/time in the configured zone at minute precision."""
    if not reminder.days_of_week or reminder.reminder_time is None:
        raise ValueError("Reminder weekdays and time are required")
    if reminder.reminder_time.second or reminder.reminder_time.microsecond:
        raise ValueError("Reminder time must use minute precision")
    return CronTrigger(
        day_of_week=",".join(day.lower() for day in reminder.days_of_week),
        hour=reminder.reminder_time.hour,
        minute=reminder.reminder_time.minute,
        second=0,
        timezone=config.DEFAULT_TIMEZONE,
    )


def schedule_reminder(reminder) -> None:
    """
    Register an APScheduler cron job for a MedicineReminder.

    Args:
        reminder: MedicineReminder ORM instance with days_of_week and reminder_time populated.
    """
    scheduler = get_scheduler()
    job_id = _reminder_job_id(reminder.id)

    trigger = _build_reminder_trigger(reminder)

    scheduler.add_job(
        _send_reminder_email_job,
        trigger=trigger,
        id=job_id,
        name=f"Reminder: {getattr(reminder, 'medicine_name', reminder.id)}",
        kwargs={"reminder_id": reminder.id},
        replace_existing=True,
    )
    logger.info("Scheduled reminder job %s", job_id)


def reschedule_reminder(reminder) -> None:
    """Update an existing reminder's schedule (convenience wrapper)."""
    schedule_reminder(reminder)


def unschedule_reminder(reminder_id: str) -> None:
    """Remove the APScheduler job for a reminder (silently ignores missing jobs)."""
    scheduler = get_scheduler()
    job_id = _reminder_job_id(reminder_id)
    try:
        scheduler.remove_job(job_id)
        logger.info("Unscheduled reminder job %s", job_id)
    except JobLookupError:
        logger.debug("No job found for %s — nothing to remove", job_id)


def _rehydrate_reminder_jobs() -> None:
    """Restore active jobs, migrate legacy payloads, and remove stale jobs before execution.

    Called once at startup while the scheduler is paused, so jobs survive app restarts
    even if the APScheduler job table was cleared.
    """
    from app.db.database import SessionLocal
    from app.models.reminder import MedicineReminder
    from app.models.patient import Patient
    from sqlalchemy.orm import joinedload

    scheduler = get_scheduler()
    db = SessionLocal()
    try:
        reminders = (
            db.query(MedicineReminder)
            .options(
                joinedload(MedicineReminder.patient).joinedload(Patient.user)
            )
            .filter(
                MedicineReminder.is_active.is_(True),
                MedicineReminder.deleted_at.is_(None),
            )
            .all()
        )
        active_ids = {_reminder_job_id(reminder.id) for reminder in reminders}
        removed = 0
        for job in scheduler.get_jobs():
            if job.id.startswith("reminder:") and job.id not in active_ids:
                unschedule_reminder(job.id.removeprefix("reminder:"))
                removed += 1

        rehydrated = 0
        for reminder in reminders:
            job_id = _reminder_job_id(reminder.id)
            existing = scheduler.get_job(job_id)
            expected = _build_reminder_trigger(reminder)
            if (existing is None
                    or existing.func_ref != "app.core.scheduler:_send_reminder_email_job"
                    or existing.args
                    or existing.kwargs != {"reminder_id": reminder.id}
                    or str(existing.trigger) != str(expected)
                    or str(existing.trigger.timezone) != str(expected.timezone)):
                schedule_reminder(reminder)
                rehydrated += 1
        logger.info("Reconciled %d active reminder jobs; removed %d stale jobs", rehydrated, removed)
    finally:
        db.close()


__all__ = [
    "get_scheduler",
    "init_scheduler",
    "shutdown_scheduler",
    "schedule_reminder",
    "reschedule_reminder",
    "unschedule_reminder",
    "CronTrigger",
]
