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
    _scheduler.start()
    logger.info("Scheduler started (timezone=%s)", config.DEFAULT_TIMEZONE)

    # rehydrate active medicine reminders from the DB so
    # any reminders not present in the SQLAlchemy job store get re-registered.
    try:
        _rehydrate_reminder_jobs()
    except Exception as exc:
        logger.exception("Failed to rehydrate reminder jobs: %s", exc)

    return _scheduler


def shutdown_scheduler(wait: bool = False) -> None:
    """Stop the scheduler if it is running."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=wait)
        logger.info("Scheduler stopped")
    _scheduler = None


# ========== Reminder email job (top-level so APScheduler can serialize it) ==========
def _send_reminder_email_job(
    to: str,
    medicine_name: str,
    dosage: int,
    medicine_type: str,
) -> None:
    """Scheduled job function called by APScheduler to email the patient."""
    from app.core.mailer import send_email
    send_email(
        to=to,
        subject=f"Medicine Reminder: {medicine_name}",
        body=(
            f"Hi,\n\n"
            f"This is your scheduled reminder to take your medicine:\n"
            f"  Medicine: {medicine_name}\n"
            f"  Dosage: {dosage}\n"
            f"  Type: {medicine_type}\n\n"
            "Take care and stay healthy!"
        ),
    )

# ========== Reminder helpers ==========

def _reminder_job_id(reminder_id: str) -> str:
    """Stable job id for a medicine reminder so we can find/replace/remove it."""
    return f"reminder:{reminder_id}"


def schedule_reminder(reminder, user_email: str) -> None:
    """
    Register an APScheduler cron job for a MedicineReminder.

    Args:
        reminder: MedicineReminder ORM instance with days_of_week and reminder_time populated.
        user_email: The patient's email address (passed explicitly to avoid a DB hit inside the job).
    """
    scheduler = get_scheduler()
    job_id = _reminder_job_id(reminder.id)

    day_of_week = ",".join(d.lower() for d in (reminder.days_of_week or []))
    hour = reminder.reminder_time.hour if reminder.reminder_time else 8
    minute = reminder.reminder_time.minute if reminder.reminder_time else 0

    trigger = CronTrigger(
        day_of_week=day_of_week,
        hour=hour,
        minute=minute,
        timezone=config.DEFAULT_TIMEZONE,
    )

    scheduler.add_job(
        _send_reminder_email_job,
        trigger=trigger,
        id=job_id,
        name=f"Reminder: {getattr(reminder, 'medicine_name', reminder.id)}",
        kwargs={
            "to": user_email,
            "medicine_name": reminder.medicine_name,
            "dosage": reminder.dosage,
            "medicine_type": reminder.medicine_type,
        },
        replace_existing=True,
    )
    logger.info("Scheduled reminder job %s for %s", job_id, user_email)


def reschedule_reminder(reminder, user_email: str) -> None:
    """Update an existing reminder's schedule (convenience wrapper)."""
    schedule_reminder(reminder, user_email)


def unschedule_reminder(reminder_id: str) -> None:
    """Remove the APScheduler job for a reminder (silently ignores missing jobs)."""
    scheduler = get_scheduler()
    job_id = _reminder_job_id(reminder_id)
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info("Unscheduled reminder job %s", job_id)
    else:
        logger.debug("No job found for %s — nothing to remove", job_id)


def _rehydrate_reminder_jobs() -> None:
    """Re-register any active reminders that are missing from the job store.

    Called once at startup after the scheduler starts, so jobs survive app restarts
    even if the APScheduler job table was cleared.
    """
    from app.db.database import SessionLocal
    from app.models.reminder import MedicineReminder
    from app.models.patient import Patient
    from app.models.user import User
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
        rehydrated = 0
        for reminder in reminders:
            job_id = _reminder_job_id(reminder.id)
            if not scheduler.get_job(job_id):
                try:
                    user_email = reminder.patient.user.email
                    schedule_reminder(reminder, user_email)
                    rehydrated += 1
                except Exception as exc:
                    logger.warning("Could not rehydrate reminder %s: %s", reminder.id, exc)
        logger.info("Rehydrated %d/%d reminder job(s)", rehydrated, len(reminders))
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