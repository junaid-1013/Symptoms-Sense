"""
SMTP mailer using Python's stdlib (smtplib + email.mime).

Used for:
- Contact form submissions (called via FastAPI BackgroundTasks)
- Medicine reminder emails (called from APScheduler jobs)
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import config

logger = logging.getLogger(__name__)


def send_email(
    to: str,
    subject: str,
    body: str,
    html: bool = False,
    from_addr: Optional[str] = None,
    html_body: Optional[str] = None,
) -> bool:
    """
    Send an email via the configured SMTP server.

    `body` is the plain-text part. Pass `html_body` to send a multipart message whose HTML part is
    preferred by mail clients and whose plain part is the fallback.

    Returns True on success, False on failure. Failures are logged but never
    raised so callers running in BackgroundTasks or scheduler jobs are safe.
    """
    if not config.MAILER_USERNAME or not config.MAILER_PASSWORD:
        logger.error("Mailer is not configured (MAILER_USERNAME/MAILER_PASSWORD missing); skipping email to %s", to)
        return False

    sender = from_addr or config.MAILER_FROM or config.MAILER_USERNAME

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to
    msg.attach(MIMEText(body, "html" if html else "plain", "utf-8"))
    if html_body:
        msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(config.MAILER_HOST, config.MAILER_PORT, timeout=30) as server:
            server.ehlo()
            if config.MAILER_USE_TLS:
                server.starttls()
                server.ehlo()
            server.login(config.MAILER_USERNAME, config.MAILER_PASSWORD)
            server.sendmail(sender, [to], msg.as_string())
        logger.info("Email sent to %s (subject=%r)", to, subject)
        return True
    except Exception as exc:
        logger.exception("Failed to send email to %s: %s", to, exc)
        return False


__all__ = ["send_email"]
