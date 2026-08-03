"""
Tool-calling medical chat agent.

One OpenAI chat-completions loop with function calling replaces the old keyword state machine. The model
decides which tool to call (search doctors, check slots, propose a booking or reminder, ...); the tools in
`tools.py` do the real work and attach UI cards. Write actions are only *proposed* here and committed when the
user confirms (see `execute_pending_action`).
"""
import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from openai import AsyncOpenAI

from app.core.config import config
from app.medical_chat.schema import ChatRequest, ChatResponse, ConversationState, SymptomExtraction
from app.medical_chat.tools import TOOL_SCHEMAS, ToolContext, run_tool

logger = logging.getLogger(__name__)

MODEL = "gpt-4o-mini"
MAX_TOOL_ROUNDS = 6
MAX_HISTORY_MESSAGES = 20
MAX_TOOL_RESULT_CHARS = 6000
# History carries bracketed notes about cards; the model sometimes echoes them.
CARD_NOTE = re.compile(r"\s*\[[^\]]*(?:card[s]? shown|shown:|doctor_id|appointment_id|\bdone\b)[^\]]*\]")

SYSTEM_PROMPT = """You are Symptoms Sense, a warm, concise health assistant on a platform where patients can find \
doctors, book appointments and set medicine reminders. You act through tools; you never invent doctors, slots, \
appointments or ids.

Today is {today} ({weekday}). Timezone: {timezone}. Resolve relative dates ("tomorrow", "next Monday") to YYYY-MM-DD \
yourself. The user is {user_line}.

HOW TO WORK
- Act, don't interrogate: call tools as soon as you reasonably can. Optional details (city, exact specialty) never block \
a search; search first, refine after.
- Whenever the user mentions symptoms, you MUST call assess_symptoms in that same turn, even if they also ask for a doctor \
(it already returns matching doctors; call search_doctors only if it found none or the user wants a specific city/name). \
Ask a follow-up instead only if there is nothing at all to assess.
- Never ask "shall I proceed?" in text for bookings, cancellations, reschedules or reminders: call the propose_* tool and \
the confirmation card does the asking.
- Respond to the user's latest request; do not re-run earlier requests.
- Never write bracketed notes like [... card shown] yourself; they are for your context only.
- Doctors, slots and appointments are rendered as cards. Never list them (or their times) in your text; refer to them \
briefly. Earlier cards appear in the history as bracketed notes with ids you can reuse; do not search again for a doctor \
you already have an id for.
- After get_available_slots or search_doctors, write ONE short sentence (e.g. "Pick a time below."). No bullet lists of times, doctors or dates.

WHAT YOU DO
- Symptoms: ask a clarifying question or two if the description is vague, then call assess_symptoms. Explain in plain \
language which kind of specialist fits and why. You are not a doctor: never diagnose, never prescribe or suggest \
medicines or doses.
- Doctors: use search_doctors (specialization / name / city). Doctor cards are shown to the user automatically.
- Booking: after the user picks a doctor, call get_available_slots, let them choose, then call propose_appointment. \
A confirmation card appears; tell the user to tap Confirm. NEVER say something is booked, cancelled, rescheduled or \
set until the user has confirmed. If they just reply "yes" in text, remind them to tap the Confirm button on the card.
- Existing appointments: list_appointments, propose_cancel_appointment, propose_reschedule_appointment. Changes inside \
24 hours of the visit are not allowed; relay tool errors honestly.
- Reminders: propose_reminder needs medicine name, time and days. Ask for what is missing (default dosage 1, type \
Tablet). Reminders are sent by email at the chosen time. Use list_reminders to show existing ones.

SAFETY
- If symptoms suggest an emergency (chest pain, trouble breathing, stroke signs, severe bleeding, fainting, suicidal \
thoughts, etc.) tell the user to call local emergency services or go to the nearest ER now, before anything else, and \
do not push booking.
- If the user is not signed in, you may help with symptoms and finding doctors, but booking, appointments and \
reminders need a sign-in; tell them so (a sign-in card appears automatically).
- If a tool returns an error, explain it simply and offer the next step. Do not retry the same failing call.
- Stay on health and platform topics; politely redirect anything else.

STYLE
- Short replies (2-5 sentences). No markdown headings. Use a short list only when it helps. Do not repeat details already \
shown on cards. Reply in the user's language."""


class MedicalChatAgent:
    def __init__(self, db, client: Optional[AsyncOpenAI] = None):
        self.db = db
        self.client = client or AsyncOpenAI(api_key=config.OPENAI_API_KEY)

    # ------------------------------------------------------------------ symptom pipeline

    def _build_assess(self, ctx: ToolContext, request: ChatRequest, insights: Dict[str, Any]):
        async def assess() -> Dict[str, Any]:
            # Reuse the existing extraction / reasoning / suggestion pipeline.
            from app.medical_chat.service import MedicalChatService
            from app.medical_chat.doctor_suggestion_agent import run_doctor_suggestion_agent

            service = MedicalChatService(db=self.db)
            extraction = await service._extract_symptoms(request)
            if not extraction.symptoms:
                return {"symptoms": [], "note": "No clear symptoms yet. Ask the user to describe what they feel."}
            reasoning = await service.disease_reasoning_service.generate_disease_reasoning(extraction)
            suggestions = (
                run_doctor_suggestion_agent(service.doctor_suggestion_service, extraction, reasoning)
                if service.doctor_suggestion_service and reasoning else None
            )
            insights["extracted_symptoms"] = extraction
            insights["disease_reasoning"] = reasoning.model_dump() if reasoning else None
            insights["doctor_suggestions"] = suggestions.model_dump() if suggestions else None

            cards: List[Dict[str, Any]] = []
            urgency = suggestions.urgency_level if suggestions else (reasoning.risk_level if reasoning else "low")
            if urgency in ("high", "emergency"):
                ctx.cards.append({"type": "urgent_notice", "level": urgency})
            if suggestions:
                from app.medical_chat.tools import _doctor_ratings, doctor_card_item
                from app.doctors.service import DoctorsService
                from app.models.doctor import Doctor
                ids = [d.id for d in suggestions.recommended_doctors]
                ratings = _doctor_ratings(self.db, ids)
                doctors_service = DoctorsService(self.db)
                for doctor_id in ids:
                    doctor = self.db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.deleted_at.is_(None)).first()
                    if doctor:
                        cards.append(doctor_card_item(doctors_service._build_doctor_basic_info(doctor), ratings))
            return {
                "symptoms": [s.model_dump(exclude_none=True) for s in extraction.symptoms],
                "possible_areas": reasoning.possible_conditions if reasoning else [],
                "risk_level": reasoning.risk_level if reasoning else None,
                "recommended_specializations": reasoning.recommended_specializations if reasoning else [],
                "urgency": urgency,
                "explanation": reasoning.explanation if reasoning else None,
                "doctors_found": len(cards),
                "doctor_cards": cards,
                "note": "Not a diagnosis. Doctor cards are shown to the user." if cards else "No matching doctors found.",
            }
        return assess

    # ------------------------------------------------------------------ main loop

    def _system_prompt(self, request: ChatRequest) -> str:
        try:
            now = datetime.now(ZoneInfo(config.DEFAULT_TIMEZONE))
        except Exception:
            now = datetime.now()
        if request.patient_id:
            user_line = f"signed in as a patient named {request.user_name or 'unknown'}"
        elif request.user_id:
            user_line = "signed in, but not as a patient (no booking or reminders available)"
        else:
            user_line = "not signed in"
        return SYSTEM_PROMPT.format(
            today=now.strftime("%Y-%m-%d"), weekday=now.strftime("%A"),
            timezone=config.DEFAULT_TIMEZONE, user_line=user_line,
        )

    @staticmethod
    def _tidy_cards(cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """One doctor list per reply, and none next to a slot picker / confirmation about a chosen doctor."""
        focused = any(c["type"] in ("slot_picker", "appointment_confirm") for c in cards)
        doctor_lists = [c for c in cards if c["type"] == "doctor_list"]
        keep_doctors = doctor_lists[-1:] if not focused else []
        return [c for c in cards if c["type"] != "doctor_list" or c in keep_doctors]

    async def run(self, request: ChatRequest) -> ChatResponse:
        state = request.conversation_state or ConversationState()
        ctx = ToolContext(
            db=self.db, state=state, user_id=request.user_id, user_name=request.user_name,
            user_type=request.user_type, patient_id=request.patient_id,
        )
        insights: Dict[str, Any] = {}
        ctx.assess_symptoms = self._build_assess(ctx, request, insights)

        messages: List[Dict[str, Any]] = [{"role": "system", "content": self._system_prompt(request)}]
        for item in request.conversation_history[-MAX_HISTORY_MESSAGES:]:
            if item.role in ("user", "assistant") and item.content:
                messages.append({"role": item.role, "content": item.content})
        messages.append({"role": "user", "content": request.message})

        reply = ""
        for _ in range(MAX_TOOL_ROUNDS):
            completion = await self.client.chat.completions.create(
                model=MODEL, messages=messages, tools=TOOL_SCHEMAS, temperature=0.4, max_tokens=700,
            )
            message = completion.choices[0].message
            if not message.tool_calls:
                reply = (message.content or "").strip()
                break
            messages.append({
                "role": "assistant", "content": message.content or "",
                "tool_calls": [
                    {"id": call.id, "type": "function",
                     "function": {"name": call.function.name, "arguments": call.function.arguments}}
                    for call in message.tool_calls
                ],
            })
            for call in message.tool_calls:
                try:
                    arguments = json.loads(call.function.arguments or "{}")
                    if not isinstance(arguments, dict):
                        raise ValueError
                except ValueError:
                    result: Dict[str, Any] = {"error": "Tool arguments were not valid JSON."}
                else:
                    result = await run_tool(ctx, call.function.name, arguments)
                messages.append({
                    "role": "tool", "tool_call_id": call.id,
                    "content": json.dumps(result, default=str)[:MAX_TOOL_RESULT_CHARS],
                })
        reply = CARD_NOTE.sub("", reply).strip()
        if not reply:
            reply = "Sorry, I couldn't finish that. Could you rephrase or try again?"

        ctx.cards[:] = self._tidy_cards(ctx.cards)
        extraction = insights.get("extracted_symptoms") or SymptomExtraction(symptoms=[], confidence_score=0.0)
        return ChatResponse(
            reply=reply,
            symptoms_extracted=extraction,
            disease_reasoning=insights.get("disease_reasoning"),
            doctor_suggestions=insights.get("doctor_suggestions"),
            is_medical_query=True,
            conversation_state=state,
            cards=ctx.cards,
        )
