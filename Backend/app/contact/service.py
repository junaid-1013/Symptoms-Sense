"""
Contact-form business logic — composes the email body and delegates to the mailer.
"""
from app.core.config import config
from app.core.mailer import send_email
from app.contact.schema import ContactRequest

def send_contact_email(payload: ContactRequest) -> bool:
    """
    Build the contact-form notification email and dispatch it via SMTP.

    Safe to call from FastAPI BackgroundTasks; returns the mailer's bool result.
    """
    subject = f"Contact form: {payload.subject}"
    body = (
        f"Name: {payload.name}\n"
        f"Email: {payload.email}\n"
        f"Phone: {payload.phone}\n"
        f"Subject: {payload.subject}\n\n"
        f"Message:\n{payload.message}\n"
    )
    recipient = config.CONTACT_EMAIL_TO or config.MAILER_USERNAME
    return send_email(to=recipient, subject=subject, body=body)