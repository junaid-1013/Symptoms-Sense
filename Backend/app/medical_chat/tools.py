"""
Tools the medical chat agent can call.

Read tools run immediately. Write tools (book / cancel / reschedule / reminder) are two-step:
`propose_*` validates the request and stores a *pending action* in the conversation state, returning a
confirmation card. Nothing is written until the signed-in user clicks Confirm, which hits
`execute_pending_action` through a dedicated endpoint. The model can never commit a write by itself,
and `patient_id` / `user_id` always come from the server, never from model arguments.
"""
import logging
import uuid
from dataclasses import dataclass, field
from datetime import date as date_cls, datetime, timedelta, timezone
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.appointments.schema import AppointmentCreateRequest, AppointmentUpdateRequest
from app.appointments.service import AppointmentService
from app.core.config import config
from app.core.exceptions import (
    InsufficientPermissionsException,
    UserNotFoundException,
    ValidationException,
)
from app.doctors.service import DoctorsService
from app.medical_chat.schema import ConversationState
from app.models.doctor import Doctor
from app.models.doctor_review import DoctorReview
from app.reminders.schema import VALID_DAYS, ReminderCreateRequest
from app.reminders.service import ReminderService
from app.schedules.schema import CreateTimeslotFromVirtualRequest
from app.schedules.service import DoctorScheduleService

logger = logging.getLogger(__name__)

MAX_PENDING_ACTIONS = 10
SLOT_SCAN_DAYS = 14
DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


# ---------------------------------------------------------------- context

@dataclass
class ToolContext:
    db: Session
    state: ConversationState
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_type: Optional[str] = None
    patient_id: Optional[str] = None
    cards: List[Dict[str, Any]] = field(default_factory=list)
    # Set by the agent: runs symptom extraction + reasoning + doctor suggestion for this conversation.
    assess_symptoms: Optional[Callable[[], Awaitable[Dict[str, Any]]]] = None

    @property
    def pending(self) -> Dict[str, Any]:
        return self.state.context_data.setdefault("pending_actions", {})


# ---------------------------------------------------------------- helpers

def _naive_utc(value: datetime) -> datetime:
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _fmt_time(value: datetime) -> str:
    return value.strftime("%I:%M %p").lstrip("0")


def _fmt_date(value: date_cls) -> str:
    return f"{DAY_NAMES[value.weekday()]}, {value.day} {value.strftime('%b %Y')}"


def _parse_date(value: str) -> date_cls:
    try:
        return date_cls.fromisoformat(str(value).strip())
    except ValueError:
        raise ValidationException("Date must be in YYYY-MM-DD format")


def _parse_clock(value: str) -> Tuple[int, int]:
    try:
        hour, minute = str(value).strip().split(":")[:2]
        hour, minute = int(hour), int(minute)
        if not (0 <= hour < 24 and 0 <= minute < 60):
            raise ValueError
        return hour, minute
    except ValueError:
        raise ValidationException("Time must be in 24-hour HH:MM format")


def _doctor_ratings(db: Session, doctor_ids: List[str]) -> Dict[str, Tuple[Optional[float], int]]:
    if not doctor_ids:
        return {}
    rows = (
        db.query(DoctorReview.doctor_id, func.avg(DoctorReview.rating), func.count(DoctorReview.id))
        .filter(
            DoctorReview.doctor_id.in_(doctor_ids),
            DoctorReview.deleted_at.is_(None),
            DoctorReview.rating.isnot(None),
        )
        .group_by(DoctorReview.doctor_id)
        .all()
    )
    return {doctor_id: (round(float(avg), 1), int(count)) for doctor_id, avg, count in rows}


def doctor_card_item(info: Any, ratings: Dict[str, Tuple[Optional[float], int]]) -> Dict[str, Any]:
    rating, count = ratings.get(info.id, (None, 0))
    return {
        "id": info.id,
        "name": info.name,
        "specialization": (info.specializations or [""])[0],
        "clinic": info.clinic_name,
        "address": info.clinic_address,
        "experience_years": info.experience_years,
        "avatar_url": info.avatar_url,
        "rating": rating,
        "review_count": count,
    }


def _get_doctor_info(ctx: ToolContext, doctor_id: str) -> Dict[str, Any]:
    doctor = (
        ctx.db.query(Doctor)
        .filter(Doctor.id == doctor_id, Doctor.deleted_at.is_(None), Doctor.status == "active")
        .first()
    )
    if not doctor:
        raise UserNotFoundException("Doctor not found. Use search_doctors to find a valid doctor id.")
    info = DoctorsService(ctx.db)._build_doctor_basic_info(doctor)
    return doctor_card_item(info, _doctor_ratings(ctx.db, [doctor.id]))


def _available_slots(ctx: ToolContext, doctor_id: str, day: date_cls) -> List[Any]:
    now = datetime.utcnow()
    slots = DoctorScheduleService(ctx.db).get_available_timeslots_for_date(doctor_id=doctor_id, target_date=day)
    return sorted(
        (s for s in slots if s.is_available and _naive_utc(s.start_time) > now),
        key=lambda s: _naive_utc(s.start_time),
    )


def _find_slot(ctx: ToolContext, doctor_id: str, day: date_cls, hour: int, minute: int) -> Any:
    for slot in _available_slots(ctx, doctor_id, day):
        start = _naive_utc(slot.start_time)
        if start.hour == hour and start.minute == minute:
            return slot
    raise ValidationException(
        "That time is not an open slot for this doctor. Call get_available_slots to see what is free."
    )


def _require_patient(ctx: ToolContext) -> Optional[Dict[str, Any]]:
    """Return an error payload (and add a sign-in card) when the user cannot perform write actions."""
    if ctx.patient_id:
        return None
    if not any(card.get("type") == "login_required" for card in ctx.cards):
        ctx.cards.append({"type": "login_required"})
    if ctx.user_id and ctx.user_type != "patient":
        return {"error": "Only patient accounts can book appointments or set reminders."}
    return {"error": "The user is not signed in as a patient. Ask them to sign in; do not try again until they do."}


def _store_pending(ctx: ToolContext, action_type: str, payload: Dict[str, Any], summary: Dict[str, Any]) -> str:
    action_id = uuid.uuid4().hex[:12]
    pending = ctx.pending
    while len(pending) >= MAX_PENDING_ACTIONS:
        pending.pop(next(iter(pending)))
    pending[action_id] = {
        "id": action_id,
        "type": action_type,
        "payload": payload,
        "summary": summary,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return action_id


def _confirm_card(card_type: str, action_id: str, summary: Dict[str, Any]) -> Dict[str, Any]:
    return {"type": card_type, "action_id": action_id, "status": "pending", "summary": summary}


def _appointment_item(item: Any) -> Dict[str, Any]:
    slot = item.timeslot
    return {
        "id": item.id,
        "doctor_name": item.doctor.name,
        "specialization": (item.doctor.specializations or [""])[0],
        "clinic": item.clinic.name,
        "date": slot.date if slot else None,
        "time": slot.start_time[:5] if slot else None,
        "status": item.status,
        "reason": item.chief_complaint,
    }


def _owned_appointment(ctx: ToolContext, appointment_id: str) -> Any:
    appointment = AppointmentService(ctx.db).get_appointment_model_by_id(appointment_id)
    if not appointment or appointment.patient_id != ctx.patient_id:
        raise UserNotFoundException("Appointment not found. Use list_appointments to get valid ids.")
    return appointment


# ---------------------------------------------------------------- read tools

def search_doctors(ctx: ToolContext, specialization: Optional[str] = None, name: Optional[str] = None,
                   city: Optional[str] = None) -> Dict[str, Any]:
    doctors, _ = DoctorsService(ctx.db).search_doctors(
        specialization=specialization or None, search=name or None, page=1, page_size=50
    )
    if city:
        needle = city.strip().lower()
        doctors = [d for d in doctors if needle in (d.clinic_address or "").lower()]
    ratings = _doctor_ratings(ctx.db, [d.id for d in doctors])
    items = [doctor_card_item(d, ratings) for d in doctors]
    items.sort(key=lambda d: (-(d["rating"] or 0), -(d["experience_years"] or 0)))
    items = items[:4]
    if items:
        ctx.cards.append({"type": "doctor_list", "doctors": items})
    return {
        "count": len(items),
        "doctors": items,
        "note": "Doctor cards are already shown to the user; do not repeat every detail, just guide them.",
    }


def get_available_slots(ctx: ToolContext, doctor_id: str, date: Optional[str] = None) -> Dict[str, Any]:
    doctor = _get_doctor_info(ctx, doctor_id)
    days: List[Dict[str, Any]] = []
    if date:
        day = _parse_date(date)
        if day < date_cls.today():
            raise ValidationException("That date is in the past")
        candidates = [day]
    else:
        today = date_cls.today()
        candidates = [today + timedelta(days=i) for i in range(SLOT_SCAN_DAYS)]
    for day in candidates:
        slots = _available_slots(ctx, doctor_id, day)
        if slots:
            days.append({
                "date": day.isoformat(),
                "label": _fmt_date(day),
                "slots": [
                    {"time": _naive_utc(s.start_time).strftime("%H:%M"), "label": _fmt_time(_naive_utc(s.start_time))}
                    for s in slots[:12]
                ],
            })
        if not date and len(days) >= 3:
            break
    if days:
        ctx.cards.append({"type": "slot_picker", "doctor": doctor, "days": days})
    return {
        "doctor": {"id": doctor["id"], "name": doctor["name"]},
        "days": [{"date": d["date"], "times": [s["time"] for s in d["slots"]]} for d in days],
        "note": "A slot picker card is shown to the user." if days else "No open slots in the searched range.",
    }


def list_appointments(ctx: ToolContext) -> Dict[str, Any]:
    if (error := _require_patient(ctx)):
        return error
    items = [_appointment_item(i) for i in AppointmentService(ctx.db).get_patient_appointments(ctx.patient_id)]
    today = date_cls.today().isoformat()
    upcoming = sorted(
        (i for i in items if i["status"] in ("pending", "scheduled") and (i["date"] or "") >= today),
        key=lambda i: (i["date"] or "", i["time"] or ""),
    )
    past = sorted(
        (i for i in items if i not in upcoming), key=lambda i: (i["date"] or "", i["time"] or ""), reverse=True
    )
    shown = (upcoming + past)[:8]
    if shown:
        ctx.cards.append({"type": "appointment_list", "appointments": shown})
    return {"appointments": shown, "upcoming_count": len(upcoming)}


def list_reminders(ctx: ToolContext) -> Dict[str, Any]:
    if (error := _require_patient(ctx)):
        return error
    items, _ = ReminderService(ctx.db).list_reminders(ctx.patient_id)
    shown = [
        {
            "id": r.id, "medicine_name": r.medicine_name, "dosage": r.dosage, "medicine_type": r.medicine_type,
            "days_of_week": r.days_of_week, "reminder_time": r.reminder_time,
        }
        for r in items
    ]
    if shown:
        ctx.cards.append({"type": "reminder_list", "reminders": shown, "timezone": config.DEFAULT_TIMEZONE})
    return {"reminders": shown}


async def assess_symptoms(ctx: ToolContext) -> Dict[str, Any]:
    if not ctx.assess_symptoms:
        return {"error": "Symptom assessment is unavailable."}
    result = await ctx.assess_symptoms()
    doctors = result.pop("doctor_cards", [])
    if doctors:
        ctx.cards.append({"type": "doctor_list", "doctors": doctors[:4]})
    return result


# ---------------------------------------------------------------- propose tools (write step 1)

def propose_appointment(ctx: ToolContext, doctor_id: str, date: str, time: str,
                        reason: Optional[str] = None) -> Dict[str, Any]:
    if (error := _require_patient(ctx)):
        return error
    doctor = _get_doctor_info(ctx, doctor_id)
    day, (hour, minute) = _parse_date(date), _parse_clock(time)
    slot = _find_slot(ctx, doctor_id, day, hour, minute)
    start, end = _naive_utc(slot.start_time), _naive_utc(slot.end_time)
    reason = (reason or "General consultation").strip()[:500]
    summary = {
        "doctor": doctor, "date": day.isoformat(), "date_label": _fmt_date(day),
        "time": start.strftime("%H:%M"), "time_label": _fmt_time(start), "reason": reason,
    }
    action_id = _store_pending(
        ctx, "appointment",
        {"doctor_id": doctor_id, "start": start.isoformat(), "end": end.isoformat(), "reason": reason}, summary,
    )
    ctx.cards.append(_confirm_card("appointment_confirm", action_id, summary))
    return {"status": "awaiting_user_confirmation",
            "note": "A confirmation card is shown. The appointment is NOT booked until the user taps Confirm."}


def propose_cancel_appointment(ctx: ToolContext, appointment_id: str) -> Dict[str, Any]:
    if (error := _require_patient(ctx)):
        return error
    appointment = _owned_appointment(ctx, appointment_id)
    if appointment.status not in AppointmentService.AppointmentStatus.LOCKING_STATUSES:
        raise ValidationException(f"This appointment is already {appointment.status}.")
    item = next(i for i in AppointmentService(ctx.db).get_patient_appointments(ctx.patient_id) if i.id == appointment_id)
    summary = {"appointment": _appointment_item(item)}
    action_id = _store_pending(ctx, "cancel_appointment", {"appointment_id": appointment_id}, summary)
    ctx.cards.append(_confirm_card("cancel_confirm", action_id, summary))
    return {"status": "awaiting_user_confirmation",
            "note": "A confirmation card is shown. Nothing is cancelled until the user taps Confirm. "
                    "Appointments cannot be cancelled within 24 hours of the start time."}


def propose_reschedule_appointment(ctx: ToolContext, appointment_id: str, date: str, time: str) -> Dict[str, Any]:
    if (error := _require_patient(ctx)):
        return error
    appointment = _owned_appointment(ctx, appointment_id)
    if appointment.status not in AppointmentService.AppointmentStatus.LOCKING_STATUSES:
        raise ValidationException(f"This appointment is already {appointment.status}.")
    day, (hour, minute) = _parse_date(date), _parse_clock(time)
    slot = _find_slot(ctx, appointment.doctor_id, day, hour, minute)
    start, end = _naive_utc(slot.start_time), _naive_utc(slot.end_time)
    item = next(i for i in AppointmentService(ctx.db).get_patient_appointments(ctx.patient_id) if i.id == appointment_id)
    summary = {
        "appointment": _appointment_item(item), "new_date": day.isoformat(), "new_date_label": _fmt_date(day),
        "new_time": start.strftime("%H:%M"), "new_time_label": _fmt_time(start),
    }
    action_id = _store_pending(
        ctx, "reschedule_appointment",
        {"appointment_id": appointment_id, "start": start.isoformat(), "end": end.isoformat()}, summary,
    )
    ctx.cards.append(_confirm_card("reschedule_confirm", action_id, summary))
    return {"status": "awaiting_user_confirmation",
            "note": "A confirmation card is shown. Nothing changes until the user taps Confirm. "
                    "Appointments cannot be moved within 24 hours of the start time."}


def propose_reminder(ctx: ToolContext, medicine_name: str, time: str, days_of_week: List[str],
                     dosage: int = 1, medicine_type: str = "Tablet") -> Dict[str, Any]:
    if (error := _require_patient(ctx)):
        return error
    days = list(DAY_NAMES) if any(str(d).lower() in ("daily", "everyday", "every day") for d in days_of_week) else [
        str(d).strip().title()[:3] for d in days_of_week
    ]
    hour, minute = _parse_clock(time)
    try:
        data = ReminderCreateRequest(
            medicine_name=medicine_name, dosage=int(dosage), medicine_type=medicine_type or "Tablet",
            days_of_week=days, reminder_time=f"{hour:02d}:{minute:02d}",
        )
    except Exception as exc:
        invalid = f"Valid days are {', '.join(sorted(VALID_DAYS))}." if "day" in str(exc).lower() else ""
        raise ValidationException(f"Invalid reminder details. {invalid}".strip())
    existing, _ = ReminderService(ctx.db).list_reminders(ctx.patient_id)
    if any(r.medicine_name.lower() == data.medicine_name.lower() and r.reminder_time == data.reminder_time
           and set(r.days_of_week) == set(data.days_of_week) for r in existing):
        return {"error": "An identical reminder already exists."}
    summary = {
        "medicine_name": data.medicine_name, "dosage": data.dosage, "medicine_type": data.medicine_type,
        "days_of_week": data.days_of_week, "time": data.reminder_time,
        "time_label": _fmt_time(datetime(2000, 1, 1, hour, minute)), "timezone": config.DEFAULT_TIMEZONE,
    }
    action_id = _store_pending(ctx, "reminder", data.model_dump(), summary)
    ctx.cards.append(_confirm_card("reminder_confirm", action_id, summary))
    return {"status": "awaiting_user_confirmation",
            "note": "A confirmation card is shown. The reminder is NOT set until the user taps Confirm."}


# ---------------------------------------------------------------- confirm (write step 2)

def execute_pending_action(db: Session, *, user_id: str, user_type: str, patient_id: str,
                           action: Dict[str, Any]) -> Tuple[str, Dict[str, Any], Optional[Dict[str, Any]]]:
    """Commit a pending action. Returns (assistant message, result card, email payload or None).

    Raises ValidationException / UserNotFoundException / InsufficientPermissionsException with
    user-presentable messages.
    """
    kind, payload, summary = action["type"], action["payload"], action["summary"]
    appointments = AppointmentService(db)

    if kind == "appointment":
        doctor = db.query(Doctor).filter(Doctor.id == payload["doctor_id"], Doctor.deleted_at.is_(None)).first()
        if not doctor:
            raise UserNotFoundException("Doctor not found")
        created = appointments.create_appointment(AppointmentCreateRequest(
            patient_id=patient_id, doctor_id=doctor.id, clinic_id=doctor.clinic_id,
            start_time=datetime.fromisoformat(payload["start"]), end_time=datetime.fromisoformat(payload["end"]),
            appointment_type="Consultation", chief_complaint=payload["reason"],
        ))
        card = {"type": "appointment_created", "summary": summary, "appointment_id": created.id,
                "status": created.status}
        return (f"Your appointment with {summary['doctor']['name']} is booked for {summary['date_label']} "
                f"at {summary['time_label']}."), card, None

    if kind == "cancel_appointment":
        appointments.cancel_appointment_as_user(user_id, user_type, payload["appointment_id"])
        card = {"type": "appointment_cancelled", "summary": summary}
        appt = summary["appointment"]
        return f"Your appointment with {appt['doctor_name']} on {appt['date']} has been cancelled.", card, None

    if kind == "reschedule_appointment":
        appointment = appointments.get_appointment_model_by_id(payload["appointment_id"])
        if not appointment or appointment.patient_id != patient_id:
            raise InsufficientPermissionsException("You can only change your own appointments")
        slot = DoctorScheduleService(db).create_timeslot_from_virtual(
            doctor_id=appointment.doctor_id,
            data=CreateTimeslotFromVirtualRequest(
                start_time=datetime.fromisoformat(payload["start"]), end_time=datetime.fromisoformat(payload["end"])),
        )
        appointments.update_appointment(appointment.id, AppointmentUpdateRequest(timeslot_id=slot.id))
        card = {"type": "appointment_rescheduled", "summary": summary}
        return (f"Done. Your appointment with {summary['appointment']['doctor_name']} is now on "
                f"{summary['new_date_label']} at {summary['new_time_label']}."), card, None

    if kind == "reminder":
        reminder = ReminderService(db).create_scheduled_reminder(patient_id, ReminderCreateRequest(**payload))
        card = {"type": "reminder_created", "summary": summary, "reminder_id": reminder.id}
        email = {
            "subject": "Medicine Reminder Added",
            "body": (
                f"Your medicine reminder has been set up:\n"
                f"  Medicine: {summary['medicine_name']}\n  Dosage: {summary['dosage']}\n"
                f"  Type: {summary['medicine_type']}\n  Days: {', '.join(summary['days_of_week'])}\n"
                f"  Time: {summary['time']} ({config.DEFAULT_TIMEZONE})\n\n"
                "You'll receive an email reminder at the scheduled time."
            ),
        }
        return (f"Reminder set: {summary['medicine_name']} at {summary['time_label']} on "
                f"{', '.join(summary['days_of_week'])}. I'll email you at that time."), card, email

    raise ValidationException("Unknown action")


# ---------------------------------------------------------------- registry

TOOL_SCHEMAS: List[Dict[str, Any]] = [
    {"type": "function", "function": {
        "name": "assess_symptoms",
        "description": "Analyse the symptoms the user described in this conversation: extracts symptoms, estimates risk "
                       "and urgency, and finds suitable doctors. Call once the user has described a health concern "
                       "in enough detail. Not a diagnosis.",
        "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {
        "name": "search_doctors",
        "description": "Find doctors by specialization, name and/or city. Shows doctor cards to the user.",
        "parameters": {"type": "object", "properties": {
            "specialization": {"type": "string", "description": "e.g. Cardiologist, Dermatologist, General Physician"},
            "name": {"type": "string", "description": "Part of the doctor's name"},
            "city": {"type": "string", "description": "e.g. Lahore, Karachi, Islamabad"}}}}},
    {"type": "function", "function": {
        "name": "get_available_slots",
        "description": "Get open appointment times for a doctor. With a date: that day only. Without: the next days "
                       "that have openings. Shows a slot picker to the user.",
        "parameters": {"type": "object", "properties": {
            "doctor_id": {"type": "string"},
            "date": {"type": "string", "description": "YYYY-MM-DD, optional"}},
            "required": ["doctor_id"]}}},
    {"type": "function", "function": {
        "name": "propose_appointment",
        "description": "Prepare an appointment for the user to confirm. Only call when the user has chosen a doctor, "
                       "date and time. Shows a confirmation card; does NOT book.",
        "parameters": {"type": "object", "properties": {
            "doctor_id": {"type": "string"},
            "date": {"type": "string", "description": "YYYY-MM-DD"},
            "time": {"type": "string", "description": "24-hour HH:MM, exactly one of the open slots"},
            "reason": {"type": "string", "description": "Short reason for the visit, from the user's words"}},
            "required": ["doctor_id", "date", "time"]}}},
    {"type": "function", "function": {
        "name": "list_appointments",
        "description": "List the signed-in patient's appointments (upcoming first).",
        "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {
        "name": "propose_cancel_appointment",
        "description": "Prepare cancelling an appointment for the user to confirm. Does NOT cancel.",
        "parameters": {"type": "object", "properties": {"appointment_id": {"type": "string"}},
                       "required": ["appointment_id"]}}},
    {"type": "function", "function": {
        "name": "propose_reschedule_appointment",
        "description": "Prepare moving an appointment to a new open slot with the same doctor, for the user to confirm.",
        "parameters": {"type": "object", "properties": {
            "appointment_id": {"type": "string"},
            "date": {"type": "string", "description": "YYYY-MM-DD"},
            "time": {"type": "string", "description": "24-hour HH:MM, an open slot"}},
            "required": ["appointment_id", "date", "time"]}}},
    {"type": "function", "function": {
        "name": "propose_reminder",
        "description": "Prepare a recurring medicine reminder (email at the chosen time) for the user to confirm. "
                       "Does NOT create it. Ask for the medicine name, time and days if missing.",
        "parameters": {"type": "object", "properties": {
            "medicine_name": {"type": "string"},
            "time": {"type": "string", "description": "24-hour HH:MM"},
            "days_of_week": {"type": "array", "items": {"type": "string"},
                             "description": "Any of Mon,Tue,Wed,Thu,Fri,Sat,Sun, or [\"daily\"]"},
            "dosage": {"type": "integer", "description": "Positive integer amount, default 1"},
            "medicine_type": {"type": "string", "description": "Tablet, Capsule, Syrup, Injection, Drops..."}},
            "required": ["medicine_name", "time", "days_of_week"]}}},
    {"type": "function", "function": {
        "name": "list_reminders",
        "description": "List the signed-in patient's active medicine reminders.",
        "parameters": {"type": "object", "properties": {}}}},
]

_SYNC_TOOLS = {
    "search_doctors": search_doctors,
    "get_available_slots": get_available_slots,
    "propose_appointment": propose_appointment,
    "list_appointments": list_appointments,
    "propose_cancel_appointment": propose_cancel_appointment,
    "propose_reschedule_appointment": propose_reschedule_appointment,
    "propose_reminder": propose_reminder,
    "list_reminders": list_reminders,
}


async def run_tool(ctx: ToolContext, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool; errors become `{"error": ...}` results the model can explain to the user."""
    try:
        if name == "assess_symptoms":
            return await assess_symptoms(ctx)
        tool = _SYNC_TOOLS.get(name)
        if tool is None:
            return {"error": f"Unknown tool {name}"}
        return tool(ctx, **arguments)
    except (ValidationException, UserNotFoundException, InsufficientPermissionsException) as exc:
        ctx.db.rollback()
        return {"error": str(exc)}
    except TypeError as exc:
        return {"error": f"Invalid arguments for {name}: {exc}"}
    except Exception:
        ctx.db.rollback()
        logger.exception("Tool %s failed", name)
        return {"error": "Something went wrong while running this step."}
