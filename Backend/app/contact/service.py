"""
Contact-form business logic — composes the email body and delegates to the mailer.
"""
from app.core.config import config
from app.core.mailer import send_email
from app.contact.schema import ContactRequest
from app.core.email_templates import contact_notification

def send_contact_email(payload: ContactRequest) -> bool:
    """
    Build the contact-form notification email and dispatch it via SMTP.

    Safe to call from FastAPI BackgroundTasks; returns the mailer's bool result.
    """
    subject, body, html_body = contact_notification(
        payload.name, str(payload.email), payload.phone, payload.subject, payload.message
    )
    recipient = config.CONTACT_EMAIL_TO or config.MAILER_USERNAME
    return send_email(to=recipient, subject=subject, body=body, html_body=html_body)