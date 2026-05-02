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


# ========== Reminder helpers (filled in by Module 6) ==========

def _reminder_job_id(reminder_id: str) -> str:
    """Stable job id for a medicine reminder so we can find/replace/remove it."""
    return f"reminder:{reminder_id}"


def schedule_reminder(reminder) -> None:
    """
    Register an APScheduler cron job for a MedicineReminder.

    """
    logger.debug("schedule_reminder called for %r (no-op until Module 6)", getattr(reminder, "id", reminder))


def reschedule_reminder(reminder) -> None:
    """Update an existing reminder's schedule. Implemented in Module 6."""
    logger.debug("reschedule_reminder called for %r (no-op until Module 6)", getattr(reminder, "id", reminder))


def unschedule_reminder(reminder_id: str) -> None:
    """Remove an APScheduler job for a reminder. Implemented in Module 6."""
    logger.debug("unschedule_reminder called for %r (no-op until Module 6)", reminder_id)


def _rehydrate_reminder_jobs() -> None:
    """Re-register active reminders into the scheduler on startup. Filled in by Module 6."""
    logger.debug("_rehydrate_reminder_jobs is a no-op until Module 6")


__all__ = [
    "get_scheduler",
    "init_scheduler",
    "shutdown_scheduler",
    "schedule_reminder",
    "reschedule_reminder",
    "unschedule_reminder",
    "CronTrigger",
]
