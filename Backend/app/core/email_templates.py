"""
HTML email templates.

Table-based layout with inline styles only, so it renders in Gmail, Outlook and Apple Mail without
external CSS or images. Every dynamic value is HTML-escaped. Each builder returns
`(subject, plain_text, html)`; the plain text stays the fallback part of the message.
"""
from dataclasses import dataclass, field
from html import escape
from typing import List, Optional, Sequence, Tuple

from app.core.config import config

BRAND = "#263e73"
BRAND_DARK = "#1b2d57"
ACCENT = "#e8eefb"
TEXT = "#1e293b"
MUTED = "#64748b"
BORDER = "#e2e8f0"
PAGE_BG = "#f1f5fb"
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

Row = Tuple[str, str]


@dataclass
class Cta:
    label: str
    url: str


@dataclass
class Email:
    subject: str
    heading: str
    intro: str
    preheader: str = ""
    greeting: Optional[str] = None
    rows: Sequence[Row] = field(default_factory=list)
    message: Optional[str] = None  # free-text block (e.g. a contact message)
    outro: Optional[str] = None
    cta: Optional[Cta] = None
    badge: Optional[str] = None  # small pill above the heading, e.g. "Reminder"


def _site(path: str = "") -> str:
    return f"{config.FRONTEND_URL.rstrip('/')}{path}"


def _rows_html(rows: Sequence[Row]) -> str:
    if not rows:
        return ""
    cells = "".join(
        f'<tr><td style="padding:10px 16px;font-size:13px;color:{MUTED};width:34%;border-top:1px solid {BORDER};'
        f'vertical-align:top;">{escape(label)}</td>'
        f'<td style="padding:10px 16px;font-size:15px;color:{TEXT};font-weight:600;border-top:1px solid {BORDER};'
        f'vertical-align:top;">{escape(value)}</td></tr>'
        for label, value in rows
    )
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        f'style="margin:20px 0;border:1px solid {BORDER};border-radius:12px;border-collapse:separate;'
        f'background:#f8fafc;overflow:hidden;">{cells}</table>'
    )


def render_html(mail: Email) -> str:
    badge = (
        f'<span style="display:inline-block;background:{ACCENT};color:{BRAND};font-size:12px;font-weight:700;'
        f'letter-spacing:.04em;text-transform:uppercase;padding:5px 12px;border-radius:999px;">{escape(mail.badge)}</span>'
        if mail.badge else ""
    )
    greeting = (
        f'<p style="margin:0 0 12px;font-size:16px;color:{TEXT};">{escape(mail.greeting)}</p>' if mail.greeting else ""
    )
    message = (
        f'<div style="margin:20px 0;padding:16px 18px;background:#f8fafc;border-left:4px solid {BRAND};'
        f'border-radius:8px;font-size:15px;line-height:1.6;color:{TEXT};white-space:pre-wrap;">{escape(mail.message)}</div>'
        if mail.message else ""
    )
    outro = (
        f'<p style="margin:0;font-size:14px;line-height:1.6;color:{MUTED};">{escape(mail.outro)}</p>' if mail.outro else ""
    )
    cta = (
        f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>'
        f'<td style="border-radius:10px;background:{BRAND};">'
        f'<a href="{escape(mail.cta.url, quote=True)}" style="display:inline-block;padding:13px 26px;font-size:15px;'
        f'font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">{escape(mail.cta.label)}</a>'
        f"</td></tr></table>"
        if mail.cta else ""
    )
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>{escape(mail.subject)}</title>
</head>
<body style="margin:0;padding:0;background:{PAGE_BG};font-family:{FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{PAGE_BG};">{escape(mail.preheader or mail.intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{PAGE_BG};padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
    <tr><td style="background:{BRAND};background-image:linear-gradient(135deg,{BRAND} 0%,{BRAND_DARK} 100%);border-radius:16px 16px 0 0;padding:26px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="width:36px;height:36px;background:#ffffff;border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;font-weight:800;color:{BRAND};line-height:36px;">+</td>
        <td style="padding-left:12px;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-.01em;">Symptoms Sense</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;padding:32px;border-left:1px solid {BORDER};border-right:1px solid {BORDER};">
      {badge}
      <h1 style="margin:14px 0 14px;font-size:24px;line-height:1.3;color:{TEXT};letter-spacing:-.01em;">{escape(mail.heading)}</h1>
      {greeting}
      <p style="margin:0;font-size:15px;line-height:1.6;color:{TEXT};">{escape(mail.intro)}</p>
      {_rows_html(mail.rows)}
      {message}
      {cta}
      {outro}
    </td></tr>
    <tr><td style="background:#f8fafc;border:1px solid {BORDER};border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;">
      <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:{MUTED};">
        You are receiving this because of activity on your Symptoms Sense account. This message is automated; please do not reply.
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:{MUTED};">
        Symptoms Sense provides general health information and is not a substitute for professional medical advice.
        In an emergency, call your local emergency number.
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""


def render_plain(mail: Email) -> str:
    parts: List[str] = []
    if mail.greeting:
        parts.append(mail.greeting)
    parts.append(mail.intro)
    if mail.rows:
        parts.append("\n".join(f"  {label}: {value}" for label, value in mail.rows))
    if mail.message:
        parts.append(mail.message)
    if mail.outro:
        parts.append(mail.outro)
    if mail.cta:
        parts.append(f"{mail.cta.label}: {mail.cta.url}")
    return "\n\n".join(parts) + "\n"


def build(mail: Email) -> Tuple[str, str, str]:
    return mail.subject, render_plain(mail), render_html(mail)


# ---------------------------------------------------------------- concrete emails

def _hello(name: Optional[str]) -> str:
    return f"Hi {name}," if name else "Hi,"


def reminder_due(name: Optional[str], medicine: str, dosage: int, medicine_type: str) -> Tuple[str, str, str]:
    return build(Email(
        subject=f"Medicine Reminder: {medicine}",
        badge="Time for your medicine",
        heading=f"Take your {medicine}",
        greeting=_hello(name),
        intro="This is your scheduled reminder to take your medicine.",
        rows=[("Medicine", medicine), ("Dosage", str(dosage)), ("Type", medicine_type)],
        outro="Take care and stay healthy!",
        cta=Cta("Manage my reminders", _site("/medicineReminder")),
    ))


def reminder_added(name: Optional[str], medicine: str, dosage: int, medicine_type: str,
                   days: Sequence[str], time_label: str) -> Tuple[str, str, str]:
    every_day = len(set(days)) == 7
    return build(Email(
        subject="Medicine Reminder Added",
        badge="Reminder set",
        heading="Your reminder is all set",
        greeting=_hello(name),
        intro="We'll email you at the scheduled time so you never miss a dose.",
        rows=[
            ("Medicine", medicine), ("Dosage", str(dosage)), ("Type", medicine_type),
            ("Days", "Every day" if every_day else ", ".join(days)), ("Time", time_label),
        ],
        cta=Cta("View my reminders", _site("/medicineReminder")),
    ))


def reminder_removed(name: Optional[str], medicine: str) -> Tuple[str, str, str]:
    return build(Email(
        subject="Medicine Reminder Removed",
        badge="Reminder removed",
        heading="Your reminder was removed",
        greeting=_hello(name),
        intro=f"Your medicine reminder for {medicine} has been removed. You will no longer receive emails for it.",
        outro="If this wasn't you, you can set the reminder up again at any time.",
        cta=Cta("Set a new reminder", _site("/medicineReminder")),
    ))


def contact_notification(name: str, email: str, phone: str, subject: str, message: str) -> Tuple[str, str, str]:
    return build(Email(
        subject=f"Contact form: {subject}",
        badge="New message",
        heading=subject,
        intro=f"{name} sent a message through the contact form.",
        rows=[("Name", name), ("Email", email), ("Phone", phone)],
        message=message,
        outro="Reply directly to the sender's email address above.",
    ))
