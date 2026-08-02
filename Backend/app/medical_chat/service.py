"""
Production-grade medical chat service with full appointment booking capabilities.
"""
import json
import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, time

from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.core.config import config
from app.medical_chat.schema import (
    Message,
    SymptomExtraction,
    ChatRequest,
    ChatResponse,
    Symptom,
    ConversationState,
    DoctorInfo,
    InteractiveOption,
)
from app.medical_chat.prompts import (
    MEDICAL_CHAT_SYSTEM_PROMPT,
    SYMPTOM_EXTRACTION_PROMPT,
    APPOINTMENT_BOOKING_PROMPT,
    APPOINTMENT_EXTRACTION_PROMPT,
)
from app.services import DiseaseReasoningService, DoctorSuggestionService
from app.doctors.service import DoctorsService
from app.appointments.service import AppointmentService
from app.appointments.schema import AppointmentCreateRequest, AppointmentUpdateRequest
from app.schedules.service import DoctorScheduleService
from app.schedules.schema import TimeslotResponse, CreateTimeslotFromVirtualRequest
from app.models.patient import Patient
from app.models.doctor import DoctorSchedule
from app.core.exceptions import ValidationException
from sqlalchemy import func
from app.medical_chat.doctor_suggestion_agent import run_doctor_suggestion_agent

# Configure logging
logger = logging.getLogger(__name__)


class MedicalChatService:
    """Production-grade medical chat service with conversation state management."""

    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        self.disease_reasoning_service = DiseaseReasoningService(self.client)
        self.doctor_suggestion_service: Optional[DoctorSuggestionService] = (
            DoctorSuggestionService(self.db) if self.db is not None else None
        )
        self.doctors_service = DoctorsService(self.db) if self.db else None
        self.appointment_service = AppointmentService(self.db) if self.db else None
        self.schedule_service = DoctorScheduleService(self.db) if self.db else None

    def get_patient_id_for_user(self, user_id: str) -> Optional[str]:
        """
        Resolve patient id for an authenticated user. Returns None if user has no patient profile
        (e.g. not yet onboarded as patient). Used by the chat controller to pass patient_id into chat.
        """
        if not self.db:
            return None
        try: 
            patient = self.db.query(Patient).filter(
                Patient.user_id == user_id,
                Patient.deleted_at.is_(None)
            ).first()
            return patient.id if patient else None
        except Exception as e:
            logger.error(f"Error getting patient id for user {user_id}: {str(e)}", exc_info=True)
            return None


    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Handle a chat turn with the tool-calling agent (see `agent.MedicalChatAgent`)."""
        from app.medical_chat.agent import MedicalChatAgent

        request.message = self._sanitize_input(request.message)
        if not request.message:
            return self._create_error_response("Please type a message so I can help.")
        return await MedicalChatAgent(self.db, client=self.client).run(request)

    async def _handle_doctor_search(
        self, request: ChatRequest, state: ConversationState
    ) -> ChatResponse:
        """Handle doctor search queries with enhanced results."""
        try:
            # Extract specialization from query
            specialization = await self._extract_specialization(request.message)
            
            # If LLM extraction failed or returned generic term, try keyword-based extraction
            if not specialization or specialization == "general":
                message_lower = request.message.lower()
                # Map common terms to database specialization values
                specialization_map = {
                    "cardiologist": "cardiologist",
                    "cardiology": "cardiologist",
                    "heart specialist": "cardiologist",
                    "heart doctor": "cardiologist",
                    "cardiac": "cardiologist",
                    "dermatologist": "dermatologist",
                    "dermatology": "dermatologist",
                    "skin": "dermatologist",
                    "dentist": "dentist",
                    "dental": "dentist",
                    "neurologist": "neurologist",
                    "neurology": "neurologist",
                    "brain": "neurologist",
                    "orthopedic": "orthopedic",
                    "orthopedics": "orthopedic",
                    "bone": "orthopedic",
                    "pediatrician": "pediatrician",
                    "pediatric": "pediatrician",
                    "pediatrics": "pediatrician",
                    "child": "pediatrician",
                    "gynecologist": "gynecologist",
                    "gynecology": "gynecologist",
                    "gyno": "gynecologist",
                    "urologist": "urologist",
                    "urology": "urologist",
                    "psychiatrist": "psychiatrist",
                    "psychiatry": "psychiatrist",
                    "mental": "psychiatrist",
                }
                
                # Check for exact matches first (longer phrases first)
                for key, spec in sorted(specialization_map.items(), key=lambda x: -len(x[0])):
                    if key in message_lower:
                        specialization = spec
                        break

            if not self.db or not self.doctors_service:
                return ChatResponse(
                    reply="I'm sorry, but I can't access doctor information right now. Please try again later.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            # Normalize specialization to match database format
            # The database might store "cardiologist" but LLM might return "cardiology"
            if specialization:
                specialization_normalized = specialization.lower().strip()
                # Map common variations to standard forms
                normalization_map = {
                    "cardiology": "cardiologist",
                    "dermatology": "dermatologist",
                    "neurology": "neurologist",
                    "orthopedics": "orthopedic",
                    "pediatrics": "pediatrician",
                    "gynecology": "gynecologist",
                    "urology": "urologist",
                    "psychiatry": "psychiatrist",
                }
                if specialization_normalized in normalization_map:
                    specialization = normalization_map[specialization_normalized]
            doctors, total = self.doctors_service.search_doctors(
                specialization=specialization,
                page=1,
                page_size=5
            )

            if not doctors:
                reply = (
                    f"I couldn't find any doctors specializing in {specialization or 'that area'}. "
                    "Would you like me to search for a different specialization, or would you prefer to see general practitioners?"
                )
                interactive_options = [
                    {"label": "Search General Physicians", "value": "search_general", "type": "button"},
                    {"label": "Try Different Search", "value": "search_again", "type": "button"},
                ]
            else:
                reply = f"I found {total} doctor{'s' if total > 1 else ''} for {specialization or 'your needs'}:\n\n"
                for i, doctor in enumerate(doctors[:5], 1):
                    specs = ', '.join(doctor.specializations) if doctor.specializations else 'General Practice'
                    reply += f"{i}. **Dr. {doctor.name}**\n"
                    reply += f"   Specialization: {specs}\n"
                    reply += f"   Clinic: {doctor.clinic_name}\n"
                    if doctor.experience_years:
                        reply += f"   Experience: {doctor.experience_years} years\n"
                    if doctor.bio:
                        reply += f"   {doctor.bio[:100]}...\n"
                    reply += "\n"

                if total > 5:
                    reply += f"Showing 5 of {total} doctors. Would you like to see more options?\n\n"
                
                reply += "Would you like me to help you book an appointment with any of these doctors?"

            doctors_list = [
                DoctorInfo(
                    id=str(doctor.id),
                    name=doctor.name or "Unknown",
                    specializations=doctor.specializations or [],
                    clinic_name=doctor.clinic_name or "Unknown Clinic",
                    experience_years=doctor.experience_years,
                    bio=doctor.bio,
                )
                for doctor in doctors
            ]

            interactive_options = [
                InteractiveOption(
                    label=f"Book with Dr. {doctor.name}",
                    value=f"book_{doctor.id}",
                    type="button"
                )
                for doctor in doctors[:3]
            ]
            interactive_options.append(
                InteractiveOption(
                    label="See More Doctors",
                    value="see_more_doctors",
                    type="button"
                )
            )

            return ChatResponse(
                reply=reply,
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                interactive_options=interactive_options,
                doctors_list=doctors_list,
                conversation_state=state,
            )

        except Exception as e:
            logger.error(f"Doctor search error: {str(e)}", exc_info=True)
            return ChatResponse(
                reply="I had trouble searching for doctors. Please try rephrasing your request or contact support.",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

    async def _handle_appointment_booking(
        self, request: ChatRequest, state: ConversationState
    ) -> ChatResponse:
        """
        Handle appointment booking with multi-turn conversation flow.
        
        Stages:
        1. initial - Gather requirements
        2. doctor_selected - Doctor chosen, need date/time
        3. date_time_provided - Date/time provided, need confirmation
        4. confirming - Final confirmation
        5. completed - Booking done
        """
        # Check if this is actually a reschedule request that was misrouted
        import re
        message_lower = request.message.lower()
        if ("change" in message_lower and "appointment" in message_lower) or \
           ("reschedule" in message_lower) or \
           (re.search(r'\bfrom\s+.*\s+to\s+', message_lower) and "appointment" in message_lower):
            return await self._handle_reschedule_appointment(request, state)
        
        try:
            # Check if user is authenticated and has patient profile
            if not request.patient_id:
                # Check if this is a continuation of a booking flow
                if state.booking_stage:
                    # User was in booking flow but lost authentication or doesn't have patient profile
                    state.booking_stage = None  # Reset booking state
                    return ChatResponse(
                        reply=(
                            "I notice you're trying to book an appointment. "
                            "To complete the booking, please ensure:\n\n"
                            "1. You're logged in to your account\n"
                            "2. You've completed your patient profile setup (onboarding)\n\n"
                            "If you're already logged in but haven't completed your patient profile, "
                            "please complete the onboarding process first. You can do this through your account settings."
                        ),
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )
                else:
                    return ChatResponse(
                        reply=(
                            "To book an appointment, I need you to:\n\n"
                            "1. **Log in** to your patient account\n"
                            "2. **Complete your patient profile** (if you haven't already)\n\n"
                            "Once both are done, I can help you schedule an appointment with any available doctor. "
                            "You can complete your patient profile through the onboarding process in your account settings."
                        ),
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )

            # Get patient
            patient = self.db.query(Patient).filter(
                Patient.id == request.patient_id,
                Patient.deleted_at.is_(None)
            ).first() if self.db else None

            if not patient:
                return ChatResponse(
                    reply="I couldn't find your patient profile. Please ensure you're logged in correctly.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            # Extract booking details from message
            extracted_data = await self._extract_appointment_details(request.message)
            
            # Update state based on extracted data
            if extracted_data.get("doctor_id"):
                state.selected_doctor_id = extracted_data["doctor_id"]
            if extracted_data.get("date"):
                state.extracted_date = extracted_data["date"]
            if extracted_data.get("time"):
                state.extracted_time = extracted_data["time"]
            if extracted_data.get("chief_complaint"):
                state.chief_complaint = extracted_data["chief_complaint"]

            # Check if user wants to show available slots (reset from date_time stage)
            message_lower = request.message.lower()
            show_slots_keywords = ["show", "time", "slots", "available", "times", "show me", "display"]
            if state.booking_stage == "date_time_provided" and any(keyword in message_lower for keyword in show_slots_keywords) and (
                "time" in message_lower or "slot" in message_lower or "available" in message_lower
            ):
                # Reset to doctor_selected stage to show available slots
                state.booking_stage = "doctor_selected"
                state.extracted_date = None
                state.extracted_time = None
                return await self._handle_doctor_selected_stage(request, state, extracted_data, patient)

            # Determine current stage
            if not state.booking_stage:
                state.booking_stage = "initial"

            # Handle booking stages
            if state.booking_stage == "initial":
                return await self._handle_initial_booking_stage(request, state, extracted_data)
            elif state.booking_stage == "doctor_selected":
                return await self._handle_doctor_selected_stage(request, state, extracted_data, patient)
            elif state.booking_stage == "date_time_provided":
                return await self._handle_date_time_stage(request, state, extracted_data, patient)
            elif state.booking_stage == "confirming":
                return await self._handle_confirmation_stage(request, state, patient)
            else:
                # Reset to initial if unknown stage
                state.booking_stage = "initial"
                return await self._handle_initial_booking_stage(request, state, extracted_data)

        except Exception as e:
            logger.error(f"Appointment booking error: {str(e)}", exc_info=True)
            return ChatResponse(
                reply="I encountered an issue while processing your booking request. Please try again or contact support.",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

    async def _handle_initial_booking_stage(
        self, request: ChatRequest, state: ConversationState, extracted_data: Dict[str, Any]
    ) -> ChatResponse:
        """Handle initial booking stage - gather doctor preference."""
        specialization = extracted_data.get("specialization")
        doctor_id = extracted_data.get("doctor_id")
        doctor_name = extracted_data.get("doctor_name")
        
        # Also try to extract doctor name directly from message if not extracted
        message_lower = request.message.lower()
        if not doctor_name:
            # Look for patterns like "book with [name]", "show time for [name]", "[name]"
            import re
            # Patterns: "with doctor [name]", "with [name]", "for [name]", "doctor [name]"
            patterns = [
                r'(?:with|for)\s+(?:doctor|dr\.?)?\s*([a-z]+)',
                r'doctor\s+([a-z]+)',
                r'dr\.?\s+([a-z]+)',
            ]
            for pattern in patterns:
                match = re.search(pattern, message_lower)
                if match:
                    potential_name = match.group(1).strip()
                    # Skip common words
                    if potential_name not in ["me", "you", "the", "a", "an", "time", "available", "appointment", "book", "show"]:
                        doctor_name = potential_name
                        break

        if doctor_id:
            # Doctor ID provided, move to next stage
            state.selected_doctor_id = doctor_id
            state.booking_stage = "doctor_selected"
            return await self._handle_doctor_selected_stage(
                request, state, extracted_data, None
            )

        # Search for doctor by name if provided
        if doctor_name and self.doctors_service:
            doctors, _ = self.doctors_service.search_doctors(
                search=doctor_name,
                page=1,
                page_size=5
            )
            
            if doctors:
                if len(doctors) == 1:
                    # Single match, use it
                    state.selected_doctor_id = doctors[0].id
                    state.booking_stage = "doctor_selected"
                    return await self._handle_doctor_selected_stage(
                        request, state, extracted_data, None
                    )
                else:
                    # Multiple matches, show options
                    doctors_list = [
                        DoctorInfo(
                            id=str(d.id),
                            name=d.name or "Unknown",
                            specializations=d.specializations or [],
                            clinic_name=d.clinic_name or "Unknown",
                            experience_years=d.experience_years,
                            bio=d.bio,
                        )
                        for d in doctors
                    ]
                    
                    interactive_options = [
                        InteractiveOption(
                            label=f"Book with Dr. {d.name}",
                            value=f"book_{d.id}",
                            type="button"
                        )
                        for d in doctors[:3]
                    ]

                    reply = f"I found {len(doctors)} doctors matching '{doctor_name}':\n\n"
                    for i, doctor in enumerate(doctors[:3], 1):
                        reply += f"{i}. Dr. {doctor.name} - {doctor.clinic_name}\n"
                    reply += "\nWhich doctor would you like to book with?"

                    return ChatResponse(
                        reply=reply,
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        interactive_options=interactive_options,
                        doctors_list=doctors_list,
                        conversation_state=state,
                    )
            else:
                # No doctor found with that name
                reply = f"I couldn't find a doctor named '{doctor_name}'. Would you like me to search for a different doctor or help you find doctors by specialization?"
                return ChatResponse(
                    reply=reply,
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

        # Need to find doctors
        if specialization:
            # Search for doctors by specialization
            if self.doctors_service:
                doctors, _ = self.doctors_service.search_doctors(
                    specialization=specialization,
                    page=1,
                    page_size=5
                )
                
                if doctors:
                    doctors_list = [
                        DoctorInfo(
                            id=str(d.id),
                            name=d.name or "Unknown",
                            specializations=d.specializations or [],
                            clinic_name=d.clinic_name or "Unknown",
                            experience_years=d.experience_years,
                            bio=d.bio,
                        )
                        for d in doctors
                    ]
                    
                    interactive_options = [
                        InteractiveOption(
                            label=f"Book with Dr. {d.name}",
                            value=f"book_{d.id}",
                            type="button"
                        )
                        for d in doctors[:3]
                    ]

                    reply = f"I found some {specialization} specialists:\n\n"
                    for i, doctor in enumerate(doctors[:3], 1):
                        reply += f"{i}. Dr. {doctor.name} - {doctor.clinic_name}\n"
                    reply += "\nWhich doctor would you like to book with?"

                    return ChatResponse(
                        reply=reply,
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        interactive_options=interactive_options,
                        doctors_list=doctors_list,
                        conversation_state=state,
                    )

        # Generic initial response
        reply = (
            "I'd be happy to help you book an appointment! To get started, please tell me:\n\n"
            "1. What type of doctor or specialist you need (e.g., cardiologist, dermatologist, general physician)\n"
            "2. Or if you already know which doctor you'd like to see, just let me know their name\n\n"
            "I'll then help you find available appointment times."
        )

        interactive_options = [
            InteractiveOption(label="Find Cardiologist", value="search_cardiology", type="button"),
            InteractiveOption(label="Find Dermatologist", value="search_dermatology", type="button"),
            InteractiveOption(label="Find General Physician", value="search_general", type="button"),
            InteractiveOption(label="Find Pediatrician", value="search_pediatrics", type="button"),
        ]

        return ChatResponse(
            reply=reply,
            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
            disease_reasoning=None,
            doctor_suggestions=None,
            is_medical_query=True,
            interactive_options=interactive_options,
            doctors_list=None,
            conversation_state=state,
        )

    async def _handle_doctor_selected_stage(
        self, request: ChatRequest, state: ConversationState, 
        extracted_data: Dict[str, Any], patient: Optional[Patient]
    ) -> ChatResponse:
        """Handle stage where doctor is selected - need date/time."""
        # Check if doctor_id is in the message (user clicked button or mentioned)
        message_lower = request.message.lower()
        if "book_" in message_lower or state.selected_doctor_id:
            # Extract doctor ID from message if present
            doctor_match = re.search(r'book_([a-f0-9-]+)', message_lower)
            if doctor_match:
                state.selected_doctor_id = doctor_match.group(1)
            elif not state.selected_doctor_id and extracted_data.get("doctor_id"):
                state.selected_doctor_id = extracted_data["doctor_id"]

        if not state.selected_doctor_id:
            return ChatResponse(
                reply="I need to know which doctor you'd like to book with. Please select a doctor or tell me their name.",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

        # Get available timeslots for the doctor
        if self.schedule_service and state.selected_doctor_id:
            try:
                # Verify doctor exists first
                if self.doctors_service:
                    doctor_detail = self.doctors_service.get_doctor_by_id(state.selected_doctor_id)
                    if not doctor_detail:
                        return ChatResponse(
                            reply="I couldn't find that doctor. Please try selecting a different doctor.",
                            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                            disease_reasoning=None,
                            doctor_suggestions=None,
                            is_medical_query=True,
                            conversation_state=state,
                        )
                
                # Get available timeslots for next 14 days
                available_slots = []
                now = datetime.now()
                today = now.date()
                
                for i in range(14):
                    target_date = today + timedelta(days=i)
                    slots = self.schedule_service.get_available_timeslots_for_date(
                        doctor_id=state.selected_doctor_id,
                        target_date=target_date
                    )
                    
                    # Filter out past slots for today
                    if target_date == today:
                        # Only include slots that are in the future
                        filtered_slots = [
                            slot for slot in slots
                            if isinstance(slot.start_time, datetime) and slot.start_time > now
                        ]
                        available_slots.extend(filtered_slots)
                    else:
                        # For future dates, include all slots
                        available_slots.extend(slots)
                
                # Get available slots over next 14 days (excluding past slots for today)

                if available_slots:
                    # Format available slots for display - show ALL slots, not limited
                    slots_by_date: Dict[str, List[str]] = {}
                    slots_by_date_datetime: Dict[str, List[datetime]] = {}  # Store datetime for validation
                    for slot in available_slots:
                        # Parse datetime from slot
                        if isinstance(slot.start_time, datetime):
                            date_str = slot.start_time.strftime("%Y-%m-%d")
                            # Display in 12-hour format with AM/PM for clarity
                            time_str = slot.start_time.strftime("%I:%M %p").lstrip('0')  # Remove leading zero, e.g., "09:00 AM" -> "9:00 AM"
                            
                            # Skip if this is today and the slot is in the past
                            if date_str == today.strftime("%Y-%m-%d") and slot.start_time <= now:
                                continue
                            
                            if date_str not in slots_by_date:
                                slots_by_date[date_str] = []
                                slots_by_date_datetime[date_str] = []
                            slots_by_date[date_str].append(time_str)
                            slots_by_date_datetime[date_str].append(slot.start_time)

                    # Sort dates and remove today if it has no available slots
                    sorted_dates = sorted(slots_by_date.keys())
                    today_str = today.strftime("%Y-%m-%d")
                    
                    # Skip today if no slots available (all passed)
                    if today_str in sorted_dates:
                        if not slots_by_date.get(today_str) or len(slots_by_date[today_str]) == 0:
                            sorted_dates = [d for d in sorted_dates if d != today_str]

                    if not sorted_dates:
                        # Reset booking state to allow user to try different options
                        state.booking_stage = "initial"
                        state.selected_doctor_id = None
                        reply = (
                            "I'm sorry, but there are no available appointment slots for this doctor "
                            "in the next 14 days. Would you like to:\n\n"
                            "1. Search for another doctor\n"
                            "2. Try a different doctor\n"
                            "3. Check back later for new availability"
                        )
                        interactive_options = [
                            InteractiveOption(label="Search for another doctor", value="search_doctor", type="button"),
                            InteractiveOption(label="Try different doctor", value="different_doctor", type="button"),
                        ]
                        return ChatResponse(
                            reply=reply,
                            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                            disease_reasoning=None,
                            doctor_suggestions=None,
                            is_medical_query=True,
                            interactive_options=interactive_options,
                            conversation_state=state,
                        )
                    else:
                        reply = "Great! Here are some available appointment times:\n\n"
                        # Show next 7 days with all available slots
                        for date in sorted_dates[:7]:
                            # Sort by datetime to ensure chronological order
                            time_datetime_pairs = list(zip(slots_by_date[date], slots_by_date_datetime[date]))
                            # Normalize datetimes for sorting (convert timezone-aware to naive)
                            def normalize_dt_for_sort(dt):
                                if dt is None:
                                    return datetime.min
                                if isinstance(dt, datetime):
                                    if dt.tzinfo is not None:
                                        return dt.replace(tzinfo=None)
                                    return dt
                                return dt
                            time_datetime_pairs.sort(key=lambda x: normalize_dt_for_sort(x[1]))  # Sort by datetime
                            times = [pair[0] for pair in time_datetime_pairs]  # Extract display times
                            reply += f"**{date}**:\n"
                            for time in times:  # Show ALL times, not limited
                                reply += f"  - {time}\n"
                            reply += "\n"

                        reply += (
                            "Please let me know which date and time you prefer, "
                            "or tell me if you'd like to see more options."
                        )

                        # Create interactive options for quick selection (show more options)
                        interactive_options = []
                        slot_count = 0
                        for date in sorted_dates[:5]:  # Show up to 5 days
                            # Get both display times and datetimes, sorted together
                            time_datetime_pairs = list(zip(slots_by_date[date], slots_by_date_datetime[date]))
                            # Sort by datetime to ensure correct order (normalize for comparison)
                            time_datetime_pairs.sort(key=lambda x: normalize_dt_for_sort(x[1]))
                            
                            for time_display, slot_datetime in time_datetime_pairs[:4]:  # Show up to 4 times per day
                                if slot_count >= 15:  # Increased limit
                                    break
                                # Use 24-hour format in value for parsing, but display in 12-hour
                                time_value = slot_datetime.strftime("%H:%M")
                                interactive_options.append(
                                    InteractiveOption(
                                        label=f"{date} at {time_display}",
                                        value=f"slot_{date}_{time_value}",
                                        type="button"
                                    )
                                )
                                slot_count += 1
                            if slot_count >= 15:
                                break

                    state.booking_stage = "date_time_provided"
                    return ChatResponse(
                        reply=reply,
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        interactive_options=interactive_options[:6],  # Limit to 6 options
                        doctors_list=None,
                        conversation_state=state,
                    )
                else:
                    # Reset booking state to allow user to try different options
                    state.booking_stage = "initial"
                    state.selected_doctor_id = None
                    reply = (
                        "I'm sorry, but there are no available appointment slots for this doctor "
                        "in the next 14 days. Would you like to:\n\n"
                        "1. Search for another doctor\n"
                        "2. Try a different doctor\n"
                        "3. Check back later for new availability"
                    )
                    interactive_options = [
                        InteractiveOption(label="Search for another doctor", value="search_doctor", type="button"),
                        InteractiveOption(label="Try different doctor", value="different_doctor", type="button"),
                    ]
                    return ChatResponse(
                        reply=reply,
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        interactive_options=interactive_options,
                        conversation_state=state,
                    )
            except Exception as e:
                logger.error(f"Error fetching timeslots: {str(e)}", exc_info=True)
                reply = "I had trouble checking availability. Please try again or select a different doctor."

        # If no date/time extracted yet, ask for it
        if not state.extracted_date or not state.extracted_time:
            reply = (
                "When would you like to schedule your appointment? "
                "Please provide a date and time, or let me know your preferred day and I'll show you available times."
            )

        return ChatResponse(
            reply=reply,
            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
            disease_reasoning=None,
            doctor_suggestions=None,
            is_medical_query=True,
            conversation_state=state,
        )

    async def _handle_date_time_stage(
        self, request: ChatRequest, state: ConversationState,
        extracted_data: Dict[str, Any], patient: Optional[Patient]
    ) -> ChatResponse:
        """Handle stage where date/time is provided - need confirmation."""
        message_lower = request.message.lower()
        
        # Check if user wants to see available slots again
        show_slots_keywords = ["show", "time", "slots", "available", "times", "show me", "display"]
        if any(keyword in message_lower for keyword in show_slots_keywords) and (
            "time" in message_lower or "slot" in message_lower or "available" in message_lower
        ):
            # Reset to doctor_selected stage to show available slots
            state.booking_stage = "doctor_selected"
            state.extracted_date = None
            state.extracted_time = None
            return await self._handle_doctor_selected_stage(request, state, extracted_data, patient)
        
        # Extract date/time from message or use extracted data
        if "slot_" in message_lower:
            # User clicked a slot button
            slot_match = re.search(r'slot_(\d{4}-\d{2}-\d{2})_(\d{2}:\d{2})', request.message)
            if slot_match:
                state.extracted_date = slot_match.group(1)
                state.extracted_time = slot_match.group(2)

        # Update state with extracted data, ensuring relative dates are converted
        if extracted_data.get("date"):
            date_value = extracted_data["date"]
            # Convert relative dates to actual dates
            date_lower = str(date_value).lower()
            today = datetime.now().date()
            
            # Handle day-of-week references first
            day_date = self._parse_day_of_week_reference(date_lower, today)
            if day_date:
                state.extracted_date = day_date.strftime("%Y-%m-%d")
            elif "tomorrow" in date_lower:
                state.extracted_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")
            elif "today" in date_lower:
                state.extracted_date = today.strftime("%Y-%m-%d")
            else:
                # Try to parse and normalize the date
                try:
                    # If it's already in YYYY-MM-DD format, use it
                    parsed_date = datetime.strptime(date_value, "%Y-%m-%d").date()
                    state.extracted_date = parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    # Try other formats
                    date_formats = ["%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y"]
                    for fmt in date_formats:
                        try:
                            parsed_date = datetime.strptime(date_value, fmt).date()
                            state.extracted_date = parsed_date.strftime("%Y-%m-%d")
                            break
                        except ValueError:
                            continue
                    else:
                        # If all parsing fails, try day-of-week parsing as fallback
                        day_date = self._parse_day_of_week_reference(date_lower, today)
                        if day_date:
                            state.extracted_date = day_date.strftime("%Y-%m-%d")
                        else:
                            # Use as-is (might be invalid)
                            state.extracted_date = date_value
        
        if extracted_data.get("time"):
            state.extracted_time = extracted_data["time"]

        if not state.extracted_date or not state.extracted_time:
            return ChatResponse(
                reply="I need both a date and time for your appointment. Please provide both, for example: 'December 15th at 2 PM' or 'tomorrow at 10:00'.",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

        # Validate that the requested time is within doctor's schedule
        appointment_datetime = self._parse_appointment_datetime(
            state.extracted_date, state.extracted_time
        )
        
        if not appointment_datetime:
            return ChatResponse(
                reply="I had trouble understanding the date and time. Please provide them in a clear format like 'December 15, 2024 at 2:00 PM'.",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )
        
        # Check if the requested time slot is available
        if self.schedule_service and state.selected_doctor_id:
            try:
                # Get available slots for the requested date
                target_date = appointment_datetime.date()
                available_slots = self.schedule_service.get_available_timeslots_for_date(
                    doctor_id=state.selected_doctor_id,
                    target_date=target_date
                )
                
                # Check if the requested time matches any available slot
                # Normalize both datetimes for comparison (handle timezone and precision differences)
                slot_found = False
                # Normalize appointment_datetime to naive, minute precision
                appointment_dt_naive = appointment_datetime
                if appointment_datetime.tzinfo is not None:
                    appointment_dt_naive = appointment_datetime.replace(tzinfo=None)
                appointment_dt_normalized = appointment_dt_naive.replace(second=0, microsecond=0)
                
                for slot in available_slots:
                    if isinstance(slot.start_time, datetime):
                        # Normalize slot time to naive, minute precision
                        slot_time = slot.start_time
                        if slot_time.tzinfo is not None:
                            slot_time = slot_time.replace(tzinfo=None)
                        slot_time_normalized = slot_time.replace(second=0, microsecond=0)
                        
                        # Compare normalized times
                        if slot_time_normalized == appointment_dt_normalized:
                            slot_found = True
                            break
                
                if not slot_found:
                    # Check if there's a similar time available (AM/PM confusion)
                    suggested_slot = None
                    requested_hour = appointment_datetime.hour
                    requested_minute = appointment_datetime.minute
                    
                    # If PM time requested, check if AM version exists
                    if requested_hour >= 12:
                        # Check for AM version (subtract 12 hours)
                        am_hour = requested_hour - 12
                        if am_hour == 0:
                            am_hour = 12
                        for slot in available_slots:
                            if isinstance(slot.start_time, datetime):
                                slot_time = slot.start_time
                                if slot_time.tzinfo is not None:
                                    slot_time = slot_time.replace(tzinfo=None)
                                if (slot_time.hour == am_hour and 
                                    slot_time.minute == requested_minute):
                                    suggested_slot = slot.start_time
                                    break
                    else:
                        # If AM time requested, check if PM version exists
                        pm_hour = requested_hour + 12
                        for slot in available_slots:
                            if isinstance(slot.start_time, datetime):
                                slot_time = slot.start_time
                                if slot_time.tzinfo is not None:
                                    slot_time = slot_time.replace(tzinfo=None)
                                if (slot_time.hour == pm_hour and 
                                    slot_time.minute == requested_minute):
                                    suggested_slot = slot.start_time
                                    break
                    
                    # Get doctor's schedule to show available hours
                    day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                    day_of_week = day_names[target_date.weekday()]
                    
                    # Get schedule for this day
                    schedules = self.schedule_service.db.query(DoctorSchedule).filter(
                        DoctorSchedule.doctor_id == state.selected_doctor_id,
                        func.lower(DoctorSchedule.day_of_week) == day_of_week,
                        DoctorSchedule.is_active == True,
                        DoctorSchedule.deleted_at.is_(None)
                    ).all()
                    
                    if suggested_slot:
                        # Found a similar time - suggest it
                        suggested_time_str = suggested_slot.strftime("%I:%M %p").lstrip('0')
                        reply = (
                            f"I notice you requested {appointment_datetime.strftime('%I:%M %p').lstrip('0')}, but that time is not available. "
                            f"Did you mean {suggested_time_str}? That slot is available on {target_date.strftime('%B %d, %Y')}. "
                            f"Please confirm or choose another time from the available slots."
                        )
                    elif schedules:
                        # Show available hours
                        schedule_info = []
                        for sched in schedules:
                            start_str = sched.start_time.strftime("%I:%M %p").lstrip('0')
                            end_str = sched.end_time.strftime("%I:%M %p").lstrip('0')
                            schedule_info.append(f"{start_str} - {end_str}")
                        
                        available_hours = " or ".join(schedule_info)
                        reply = (
                            f"I'm sorry, but {appointment_datetime.strftime('%I:%M %p').lstrip('0')} is not available on {target_date.strftime('%B %d, %Y')}. "
                            f"The doctor's available hours on {day_of_week.capitalize()} are: {available_hours}. "
                            f"Please choose a time within these hours from the available slots shown above."
                        )
                    else:
                        reply = (
                            f"I'm sorry, but {appointment_datetime.strftime('%I:%M %p').lstrip('0')} is not available on {target_date.strftime('%B %d, %Y')}. "
                            f"The doctor doesn't have a schedule for {day_of_week.capitalize()}. "
                            f"Please choose a different date or time."
                        )
                    
                    return ChatResponse(
                        reply=reply,
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )
                    
            except Exception as e:
                logger.error(f"Error validating time slot: {str(e)}", exc_info=True)
                # Continue to confirmation if validation fails (will catch error later)

        # Get doctor info for confirmation
        doctor_info = "Unknown Doctor"
        if state.selected_doctor_id and self.doctors_service:
            doctor_detail = self.doctors_service.get_doctor_by_id(state.selected_doctor_id)
            if doctor_detail:
                doctor_info = f"Dr. {doctor_detail.name}"

        # Prepare confirmation message with properly formatted date
        chief_complaint_text = f"\nReason for visit: {state.chief_complaint}" if state.chief_complaint else ""
        
        # Format date nicely
        formatted_date = state.extracted_date
        if state.extracted_date:
            try:
                # Try to parse and format the date
                date_obj = datetime.strptime(state.extracted_date, "%Y-%m-%d").date()
                formatted_date = date_obj.strftime("%B %d, %Y")  # e.g., "November 20, 2025"
            except (ValueError, AttributeError):
                # If parsing fails, use as-is
                formatted_date = state.extracted_date
        
        # Format time nicely
        formatted_time = state.extracted_time
        if state.extracted_time:
            try:
                # Try to parse and format the time
                time_match = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?', state.extracted_time, re.IGNORECASE)
                if time_match:
                    hour = int(time_match.group(1))
                    minute = int(time_match.group(2))
                    am_pm = time_match.group(3)
                    
                    if am_pm:
                        formatted_time = f"{hour}:{minute:02d} {am_pm.upper()}"
                    else:
                        # Convert 24-hour to 12-hour if needed
                        if hour > 12:
                            formatted_time = f"{hour-12}:{minute:02d} PM"
                        elif hour == 12:
                            formatted_time = f"{hour}:{minute:02d} PM"
                        elif hour == 0:
                            formatted_time = f"12:{minute:02d} AM"
                        else:
                            formatted_time = f"{hour}:{minute:02d} AM"
            except (ValueError, AttributeError):
                # If parsing fails, use as-is
                formatted_time = state.extracted_time
        
        reply = (
            f"Perfect! Let me confirm your appointment details:\n\n"
            f"**Doctor**: {doctor_info}\n"
            f"**Date**: {formatted_date}\n"
            f"**Time**: {formatted_time}"
            f"{chief_complaint_text}\n\n"
            "Does this look correct? Please confirm to proceed with booking."
        )

        interactive_options = [
            InteractiveOption(label="Yes, confirm booking", value="confirm_booking", type="button"),
            InteractiveOption(label="No, change details", value="change_details", type="button"),
        ]

        state.booking_stage = "confirming"
        return ChatResponse(
            reply=reply,
            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
            disease_reasoning=None,
            doctor_suggestions=None,
            is_medical_query=True,
            interactive_options=interactive_options,
            doctors_list=None,
            conversation_state=state,
        )

    async def _handle_confirmation_stage(
        self, request: ChatRequest, state: ConversationState, patient: Patient
    ) -> ChatResponse:
        """Handle final confirmation and create appointment."""
        message_lower = request.message.lower()
        
        if "no" in message_lower or "change" in message_lower or "cancel" in message_lower:
            # User wants to change details
            state.booking_stage = "initial"
            state.extracted_date = None
            state.extracted_time = None
            return ChatResponse(
                reply="No problem! Let's start over. What type of doctor would you like to book with?",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

        if "yes" in message_lower or "confirm" in message_lower or "book" in message_lower:
            # Create appointment
            if not self.appointment_service or not state.selected_doctor_id:
                return ChatResponse(
                    reply="I'm sorry, but I'm missing some information needed to book your appointment. Please try again.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            try:
                # Get doctor details to retrieve clinic_id
                if not self.doctors_service:
                    return ChatResponse(
                        reply="I'm sorry, but I can't access doctor information right now. Please try again later.",
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )
                
                doctor_detail = self.doctors_service.get_doctor_by_id(state.selected_doctor_id)
                if not doctor_detail or not doctor_detail.clinic_id:
                    return ChatResponse(
                        reply="I couldn't find the clinic information for this doctor. Please try selecting a different doctor.",
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )
                
                # Parse date and time
                appointment_datetime = self._parse_appointment_datetime(
                    state.extracted_date, state.extracted_time
                )
                
                if not appointment_datetime:
                    return ChatResponse(
                        reply="I had trouble understanding the date and time. Please provide them in a clear format like 'December 15, 2024 at 2:00 PM'.",
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )

                # Create appointment
                appointment_data = AppointmentCreateRequest(
                    patient_id=patient.id,
                    doctor_id=state.selected_doctor_id,
                    clinic_id=doctor_detail.clinic_id,  # Get clinic_id from doctor
                    start_time=appointment_datetime,
                    end_time=appointment_datetime + timedelta(minutes=30),  # Default 30 min appointment
                    appointment_type="consultation",
                    chief_complaint=state.chief_complaint or "General consultation",
                )

                try:
                    appointment = self.appointment_service.create_appointment(
                        appointment_data,
                        created_by="patient"
                    )
                except ValidationException as e:
                    # Handle validation errors (e.g., time outside schedule)
                    error_msg = str(e)
                    if "does not match the doctor's schedule" in error_msg:
                        # Get doctor's schedule to show available hours
                        day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                        day_of_week = day_names[appointment_datetime.date().weekday()]
                        
                        schedules = self.schedule_service.db.query(DoctorSchedule).filter(
                            DoctorSchedule.doctor_id == state.selected_doctor_id,
                            func.lower(DoctorSchedule.day_of_week) == day_of_week,
                            DoctorSchedule.is_active == True,
                            DoctorSchedule.deleted_at.is_(None)
                        ).all()
                        
                        if schedules:
                            schedule_info = []
                            for sched in schedules:
                                start_str = sched.start_time.strftime("%I:%M %p")
                                end_str = sched.end_time.strftime("%I:%M %p")
                                schedule_info.append(f"{start_str} - {end_str}")
                            
                            available_hours = " or ".join(schedule_info)
                            reply = (
                                f"I'm sorry, but {appointment_datetime.strftime('%I:%M %p')} is outside the doctor's available hours. "
                                f"The doctor's schedule on {day_of_week.capitalize()} is: {available_hours}. "
                                f"Please choose a time within these hours."
                            )
                        else:
                            reply = (
                                f"I'm sorry, but the selected time is not available. "
                                f"Please choose a different date or time from the available slots."
                            )
                    else:
                        reply = f"I'm sorry, but I couldn't book the appointment: {error_msg}. Please try again with a different time."
                    
                    # Reset to date/time stage to allow user to choose again
                    state.booking_stage = "doctor_selected"
                    state.extracted_date = None
                    state.extracted_time = None
                    
                    return ChatResponse(
                        reply=reply,
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )

                # Reset state
                # Clear booking state completely after successful booking
                state.booking_stage = None
                state.intent = None
                state.selected_doctor_id = None
                state.extracted_date = None
                state.extracted_time = None
                state.chief_complaint = None
                # Clear any booking-related context
                state.context_data.pop("suggested_doctors", None)
                state.context_data.pop("booking_doctor_name", None)

                appointment_details = {
                    "id": appointment.id,
                    "doctor": self._get_doctor_name(appointment.doctor),
                    "date": appointment_datetime.strftime("%Y-%m-%d"),
                    "time": appointment_datetime.strftime("%H:%M"),
                    "status": appointment.status,
                }

                reply = (
                    f"✅ **Appointment booked successfully!**\n\n"
                    f"Your appointment details:\n"
                    f"- Doctor: {appointment_details['doctor']}\n"
                    f"- Date: {appointment_details['date']}\n"
                    f"- Time: {appointment_details['time']}\n"
                    f"- Status: {appointment.status}\n\n"
                    f"You'll receive a confirmation shortly. Is there anything else I can help you with?"
                )

                return ChatResponse(
                    reply=reply,
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                    appointment_created=appointment_details,
                )

            except Exception as e:
                logger.error(f"Error creating appointment: {str(e)}", exc_info=True)
                error_msg = str(e)
                if "timeslot" in error_msg.lower() or "available" in error_msg.lower():
                    reply = (
                        "I'm sorry, but that time slot is no longer available. "
                        "Would you like to choose a different date and time?"
                    )
                else:
                    reply = (
                        "I encountered an issue while booking your appointment. "
                        "Please try again or contact support for assistance."
                    )
                
                return ChatResponse(
                    reply=reply,
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

        # Default response if confirmation unclear
        return ChatResponse(
            reply="Please confirm by saying 'yes' to book the appointment, or 'no' to change the details.",
            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
            disease_reasoning=None,
            doctor_suggestions=None,
            is_medical_query=True,
            conversation_state=state,
        )

    # ========== Appointment Management Handlers ==========
    
    def _get_doctor_name(self, doctor_obj: Any) -> str:
        """
        Get doctor name from either a Pydantic DoctorNestedResponse or SQLAlchemy Doctor model.
        
        Args:
            doctor_obj: Either DoctorNestedResponse (has .name) or SQLAlchemy Doctor (has .user.name)
        
        Returns:
            Doctor name or "Unknown Doctor"
        """
        if not doctor_obj:
            return "Unknown Doctor"
        
        # Check if it's a Pydantic model (DoctorNestedResponse) - has name directly
        if hasattr(doctor_obj, 'name') and not hasattr(doctor_obj, 'user'):
            return doctor_obj.name or "Unknown Doctor"
        
        # Check if it's a SQLAlchemy model - has user.name
        if hasattr(doctor_obj, 'user') and doctor_obj.user:
            return doctor_obj.user.name if hasattr(doctor_obj.user, 'name') else "Unknown Doctor"
        
        # Fallback
        return "Unknown Doctor"
    
    def _parse_timeslot_datetime(self, timeslot: Any) -> Optional[datetime]:
        """
        Parse timeslot start_time into datetime object.
        Handles both datetime objects and TimeslotNestedResponse format (date + time strings).
        """
        try:
            if not timeslot or not timeslot.start_time:
                return None
            
            start_time = timeslot.start_time
            
            # If it's already a datetime object, return it
            if isinstance(start_time, datetime):
                return start_time
            
            # If it's a string, try to parse it
            if isinstance(start_time, str):
                # Check if it's a full datetime string (ISO format)
                if 'T' in start_time or ('-' in start_time[:10] and len(start_time) > 10):
                    try:
                        return datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    except ValueError:
                        pass
                
                # If it's just a time string (HH:MM:SS or HH:MM), combine with date
                if ':' in start_time and len(start_time) <= 8:
                    # Get date from timeslot.date if available (TimeslotNestedResponse format)
                    date_str = None
                    if hasattr(timeslot, 'date') and timeslot.date:
                        date_str = timeslot.date
                    elif hasattr(timeslot, 'start_time') and isinstance(timeslot.start_time, datetime):
                        date_str = timeslot.start_time.date()
                    
                    if date_str:
                        if isinstance(date_str, str):
                            try:
                                date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
                            except ValueError:
                                # Try other date formats
                                try:
                                    date_obj = datetime.strptime(date_str, "%Y/%m/%d").date()
                                except ValueError:
                                    return None
                        else:
                            date_obj = date_str
                        
                        # Parse time string (HH:MM:SS or HH:MM)
                        time_parts = start_time.split(':')
                        if len(time_parts) >= 2:
                            hour = int(time_parts[0])
                            minute = int(time_parts[1])
                            second = int(time_parts[2]) if len(time_parts) > 2 else 0
                            
                            time_obj = time(hour, minute, second)
                            return datetime.combine(date_obj, time_obj)
            
            return None
        except Exception as e:
            logger.error(f"Error parsing timeslot datetime: {str(e)}", exc_info=True)
            return None
    
    async def _handle_view_appointments(
        self, request: ChatRequest, state: ConversationState
    ) -> ChatResponse:
        """Handle viewing user's appointments."""
        try:
            # Check if user is authenticated and has patient profile
            if not request.patient_id:
                return ChatResponse(
                    reply=(
                        "To view your appointments, please log in to your patient account. "
                        "Once logged in, I can show you all your upcoming and past appointments."
                    ),
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )
            
            # Get patient
            patient = self.db.query(Patient).filter(
                Patient.id == request.patient_id,
                Patient.deleted_at.is_(None)
            ).first() if self.db else None

            if not patient:
                return ChatResponse(
                    reply="I couldn't find your patient profile. Please ensure you're logged in correctly.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            # Get appointments
            if not self.appointment_service:
                return ChatResponse(
                    reply="I'm sorry, but I can't access appointment information right now. Please try again later.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            appointments = self.appointment_service.get_patient_appointments(patient.id)
            
            if not appointments:
                return ChatResponse(
                    reply="You don't have any appointments scheduled. Would you like me to help you book one?",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            # Separate upcoming and past appointments
            now = datetime.now()
            upcoming = []
            past = []
            
            for apt in appointments:
                if apt.timeslot and apt.timeslot.start_time:
                    apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                    if apt_datetime and apt_datetime > now:
                        upcoming.append(apt)
                    elif apt_datetime:
                        past.append(apt)
                    else:
                        # If parsing failed, use created_at
                        if apt.created_at and apt.created_at > now:
                            upcoming.append(apt)
                        else:
                            past.append(apt)
                else:
                    # If no timeslot, check created_at
                    if apt.created_at and apt.created_at > now:
                        upcoming.append(apt)
                    else:
                        past.append(apt)

            # Format response
            reply = "Here are your appointments:\n\n"
            
            if upcoming:
                reply += "**Upcoming Appointments:**\n"
                for i, apt in enumerate(upcoming[:10], 1):  # Limit to 10
                    doctor_name = self._get_doctor_name(apt.doctor)
                    clinic_name = apt.clinic.name if apt.clinic else "Unknown Clinic"
                    
                    if apt.timeslot and apt.timeslot.start_time:
                        apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                        if apt_datetime:
                            date_str = apt_datetime.strftime("%B %d, %Y")
                            time_str = apt_datetime.strftime("%I:%M %p").lstrip('0')
                        else:
                            # Fallback: use date and time strings from timeslot
                            date_str = apt.timeslot.date if hasattr(apt.timeslot, 'date') and apt.timeslot.date else "Date TBD"
                            time_str = apt.timeslot.start_time if isinstance(apt.timeslot.start_time, str) else "Time TBD"
                    else:
                        date_str = "Date TBD"
                        time_str = "Time TBD"
                    
                    status_emoji = {
                        "pending": "⏳",
                        "scheduled": "✅",
                        "cancelled": "❌",
                        "completed": "✓"
                    }.get(apt.status.lower(), "•")
                    
                    reply += f"{i}. {status_emoji} **Dr. {doctor_name}** - {clinic_name}\n"
                    reply += f"   📅 {date_str} at {time_str}\n"
                    reply += f"   Status: {apt.status.capitalize()}\n"
                    if apt.chief_complaint:
                        reply += f"   Reason: {apt.chief_complaint}\n"
                    reply += "\n"
            else:
                reply += "**Upcoming Appointments:**\n"
                reply += "No upcoming appointments.\n\n"

            if past and len(past) <= 5:  # Only show recent past appointments
                reply += "**Recent Past Appointments:**\n"
                for i, apt in enumerate(past[:5], 1):
                    doctor_name = self._get_doctor_name(apt.doctor)
                    if apt.timeslot and apt.timeslot.start_time:
                        apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                        if apt_datetime:
                            date_str = apt_datetime.strftime("%B %d, %Y")
                        else:
                            date_str = apt.timeslot.date if hasattr(apt.timeslot, 'date') and apt.timeslot.date else "Date TBD"
                    else:
                        date_str = "Date TBD"
                    reply += f"{i}. Dr. {doctor_name} - {date_str} ({apt.status})\n"
                reply += "\n"

            reply += "Would you like to:\n"
            reply += "1. Cancel or reschedule an appointment\n"
            reply += "2. Book a new appointment\n"
            reply += "3. Get more details about a specific appointment"

            # Store appointments in context for cancel/reschedule operations
            appointments_context = []
            for apt in upcoming:
                apt_datetime = self._parse_timeslot_datetime(apt.timeslot) if apt.timeslot else None
                appointments_context.append({
                    "id": apt.id,
                    "doctor_name": self._get_doctor_name(apt.doctor),
                    "date": apt_datetime.strftime("%Y-%m-%d") if apt_datetime else (apt.timeslot.date if apt.timeslot and hasattr(apt.timeslot, 'date') and apt.timeslot.date else None),
                    "time": apt_datetime.strftime("%H:%M") if apt_datetime else (apt.timeslot.start_time if apt.timeslot and isinstance(apt.timeslot.start_time, str) else None),
                })
            state.context_data["appointments"] = appointments_context

            return ChatResponse(
                reply=reply,
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

        except Exception as e:
            logger.error(f"Error viewing appointments: {str(e)}", exc_info=True)
            return ChatResponse(
                reply="I had trouble retrieving your appointments. Please try again later or contact support.",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

    async def _handle_cancel_appointment(
        self, request: ChatRequest, state: ConversationState
    ) -> ChatResponse:
        """Handle appointment cancellation."""
        try:
            # Check if user is authenticated and has patient profile
            if not request.patient_id:
                return ChatResponse(
                    reply=(
                        "To cancel an appointment, please log in to your patient account. "
                        "Once logged in, I can help you cancel your appointments."
                    ),
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )
            
            # Get patient
            patient = self.db.query(Patient).filter(
                Patient.id == request.patient_id,
                Patient.deleted_at.is_(None)
            ).first() if self.db else None

            if not patient:
                return ChatResponse(
                    reply="I couldn't find your patient profile. Please ensure you're logged in correctly.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            if not self.appointment_service:
                return ChatResponse(
                    reply="I'm sorry, but I can't access appointment information right now. Please try again later.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            # Check if we're in confirmation stage
            if state.context_data.get("cancelling_appointment_id"):
                appointment_id = state.context_data["cancelling_appointment_id"]
                message_lower = request.message.lower()
                
                # Check if user said "no" but also provided new cancellation information
                has_new_cancellation_info = any(word in message_lower for word in ["cancel", "november", "december", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"])
                
                if "yes" in message_lower or ("confirm" in message_lower and "cancel" not in message_lower):
                    try:
                        # Cancel the appointment
                        cancelled_appointment = self.appointment_service.cancel_appointment(appointment_id)
                        
                        # Clear cancellation state
                        state.context_data.pop("cancelling_appointment_id", None)
                        
                        doctor_name = self._get_doctor_name(cancelled_appointment.doctor)
                        reply = (
                            f"✅ Your appointment with Dr. {doctor_name} has been cancelled successfully. "
                            f"The timeslot has been freed up. Is there anything else I can help you with?"
                        )
                        
                        return ChatResponse(
                            reply=reply,
                            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                            disease_reasoning=None,
                            doctor_suggestions=None,
                            is_medical_query=True,
                            conversation_state=state,
                        )
                    except ValidationException as e:
                        # Handle 24-hour rule violation
                        error_msg = str(e)
                        if "24 hours" in error_msg.lower():
                            reply = (
                                "I'm sorry, but appointments can only be cancelled at least 24 hours before the scheduled time. "
                                "Your appointment is less than 24 hours away, so it cannot be cancelled through the system. "
                                "Please contact the clinic directly for assistance."
                            )
                        else:
                            reply = f"I couldn't cancel the appointment: {error_msg}. Please try again or contact support."
                        
                        state.context_data.pop("cancelling_appointment_id", None)
                        return ChatResponse(
                            reply=reply,
                            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                            disease_reasoning=None,
                            doctor_suggestions=None,
                            is_medical_query=True,
                            conversation_state=state,
                            )
                elif "no" in message_lower:
                    # Clear the previous cancellation state
                    state.context_data.pop("cancelling_appointment_id", None)
                    
                    # If there's new cancellation information in the message, process it
                    if has_new_cancellation_info:
                        # Continue to process the new cancellation request below
                        pass
                    else:
                        # Just "no" without new info - cancel the cancellation
                        return ChatResponse(
                            reply="Cancellation cancelled. Your appointment remains scheduled. Is there anything else I can help you with?",
                            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                            disease_reasoning=None,
                            doctor_suggestions=None,
                            is_medical_query=True,
                            conversation_state=state,
                        )

            # Get appointments to identify which one to cancel
            appointments = self.appointment_service.get_patient_appointments(patient.id)
            
            # Filter to upcoming appointments only
            now = datetime.now()
            upcoming_appointments = []
            for apt in appointments:
                if apt.timeslot and apt.timeslot.start_time:
                    apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                    if apt_datetime and apt_datetime > now and apt.status.lower() not in ["cancelled", "completed"]:
                        upcoming_appointments.append(apt)
                elif apt.status.lower() not in ["cancelled", "completed"]:
                    upcoming_appointments.append(apt)

            if not upcoming_appointments:
                return ChatResponse(
                    reply="You don't have any upcoming appointments to cancel. Would you like me to help you book a new appointment?",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            # Try to extract appointment identifier from message
            appointment_to_cancel = await self._extract_appointment_identifier(
                request.message, upcoming_appointments
            )

            if appointment_to_cancel:
                # Show confirmation
                doctor_name = self._get_doctor_name(appointment_to_cancel.doctor)
                if appointment_to_cancel.timeslot and appointment_to_cancel.timeslot.start_time:
                    apt_datetime = self._parse_timeslot_datetime(appointment_to_cancel.timeslot)
                    if apt_datetime:
                        date_str = apt_datetime.strftime("%B %d, %Y")
                        time_str = apt_datetime.strftime("%I:%M %p").lstrip('0')
                    else:
                        date_str = "Date TBD"
                        time_str = "Time TBD"
                else:
                    date_str = "Date TBD"
                    time_str = "Time TBD"

                # Store appointment ID for confirmation
                state.context_data["cancelling_appointment_id"] = appointment_to_cancel.id

                reply = (
                    f"I found your appointment with Dr. {doctor_name} on {date_str} at {time_str}.\n\n"
                    f"Are you sure you want to cancel this appointment? "
                    f"(Note: Appointments must be cancelled at least 24 hours in advance.)"
                )

                interactive_options = [
                    InteractiveOption(label="Yes, cancel appointment", value="confirm_cancel", type="button"),
                    InteractiveOption(label="No, keep appointment", value="keep_appointment", type="button"),
                ]

                return ChatResponse(
                    reply=reply,
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    interactive_options=interactive_options,
                    conversation_state=state,
                )
            else:
                # Show list of appointments to choose from
                reply = "I can help you cancel an appointment. Here are your upcoming appointments:\n\n"
                for i, apt in enumerate(upcoming_appointments[:10], 1):
                    doctor_name = self._get_doctor_name(apt.doctor)
                    if apt.timeslot and apt.timeslot.start_time:
                        apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                        if apt_datetime:
                            date_str = apt_datetime.strftime("%B %d, %Y")
                            time_str = apt_datetime.strftime("%I:%M %p").lstrip('0')
                        else:
                            # Fallback: use date and time strings from timeslot
                            date_str = apt.timeslot.date if hasattr(apt.timeslot, 'date') and apt.timeslot.date else "Date TBD"
                            time_str = apt.timeslot.start_time if isinstance(apt.timeslot.start_time, str) else "Time TBD"
                    else:
                        date_str = "Date TBD"
                        time_str = "Time TBD"
                    reply += f"{i}. Dr. {doctor_name} - {date_str} at {time_str}\n"

                reply += "\nWhich appointment would you like to cancel? You can tell me the doctor's name, date, or appointment number."

                # Store appointments in context
                state.context_data["appointments"] = [
                    {
                        "id": apt.id,
                        "doctor_name": self._get_doctor_name(apt.doctor),
                        "date": (self._parse_timeslot_datetime(apt.timeslot).strftime("%Y-%m-%d") if self._parse_timeslot_datetime(apt.timeslot) else (apt.timeslot.date if apt.timeslot and hasattr(apt.timeslot, 'date') and apt.timeslot.date else None)) if apt.timeslot and apt.timeslot.start_time else None,
                    }
                    for apt in upcoming_appointments
                ]

                return ChatResponse(
                    reply=reply,
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

        except Exception as e:
            logger.error(f"Error cancelling appointment: {str(e)}", exc_info=True)
            return ChatResponse(
                reply="I had trouble processing your cancellation request. Please try again later or contact support.",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

    async def _handle_reschedule_appointment(
        self, request: ChatRequest, state: ConversationState
    ) -> ChatResponse:
        """Handle appointment rescheduling."""
        try:
            # Check if user is authenticated and has patient profile
            if not request.patient_id:
                logger.warning("Reschedule handler: No patient_id in request")
                return ChatResponse(
                    reply=(
                        "To reschedule an appointment, please log in to your patient account. "
                        "Once logged in, I can help you reschedule your appointments."
                    ),
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )
            
            # Get patient
            patient = self.db.query(Patient).filter(
                Patient.id == request.patient_id,
                Patient.deleted_at.is_(None)
            ).first() if self.db else None

            if not patient:
                return ChatResponse(
                    reply="I couldn't find your patient profile. Please ensure you're logged in correctly.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            if not self.appointment_service or not self.schedule_service:
                return ChatResponse(
                    reply="I'm sorry, but I can't access appointment information right now. Please try again later.",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            # Check if we're in confirmation stage OR waiting for date/time
            # Only process confirmation if the message is clearly a yes/no response
            # If the message contains reschedule keywords, it's a new request - clear old state
            message_lower = request.message.lower()
            is_new_reschedule_request = any(keyword in message_lower for keyword in [
                "reschedule", "change appointment", "move appointment", "change time", 
                "different time", "different date"
            ])
            
            # Check if we're waiting for date/time (have appointment_id but missing date or time)
            has_appointment_id = bool(state.context_data.get("rescheduling_appointment_id"))
            has_date = bool(state.context_data.get("rescheduling_new_date"))
            has_time = bool(state.context_data.get("rescheduling_new_time"))
            
            if has_appointment_id and not (has_date and has_time) and not is_new_reschedule_request:
                # We're in the middle of rescheduling - waiting for date/time
                # Try to extract the missing date/time from this message
                appointment_id = state.context_data["rescheduling_appointment_id"]
                extracted_data = await self._extract_appointment_details(request.message)
                new_date = extracted_data.get("date") or state.context_data.get("rescheduling_new_date")
                new_time = extracted_data.get("time") or state.context_data.get("rescheduling_new_time")
                
                if new_date and new_time:
                    # Now we have both date and time - proceed to confirmation
                    state.context_data["rescheduling_new_date"] = new_date
                    state.context_data["rescheduling_new_time"] = new_time
                    # Continue to confirmation flow below
                elif new_date or new_time:
                    # Still missing one piece - store what we have and ask for the other
                    if new_date:
                        state.context_data["rescheduling_new_date"] = new_date
                    if new_time:
                        state.context_data["rescheduling_new_time"] = new_time
                    
                    # Get appointment details
                    appointment = self.appointment_service.get_appointment_model_by_id(appointment_id)
                    if appointment:
                        doctor_name = self._get_doctor_name(appointment.doctor)
                        if appointment.timeslot and appointment.timeslot.start_time:
                            apt_datetime = self._parse_timeslot_datetime(appointment.timeslot)
                            if apt_datetime:
                                current_date = apt_datetime.strftime("%B %d, %Y")
                                current_time = apt_datetime.strftime("%I:%M %p").lstrip('0')
                            else:
                                current_date = "Date TBD"
                                current_time = "Time TBD"
                        else:
                            current_date = "Date TBD"
                            current_time = "Time TBD"
                        
                        if new_date and not new_time:
                            reply = (
                                f"I found your appointment with Dr. {doctor_name} on {current_date} at {current_time}. "
                                f"You want to reschedule to {new_date}. What time would you prefer?"
                            )
                        elif new_time and not new_date:
                            reply = (
                                f"I found your appointment with Dr. {doctor_name} on {current_date} at {current_time}. "
                                f"You want to reschedule to {new_time}. What date would you prefer?"
                            )
                        else:
                            reply = (
                                f"I found your appointment with Dr. {doctor_name} on {current_date} at {current_time}.\n\n"
                                f"What new date and time would you prefer?"
                            )
                        
                        return ChatResponse(
                            reply=reply,
                            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                            disease_reasoning=None,
                            doctor_suggestions=None,
                            is_medical_query=True,
                            conversation_state=state,
                        )
            
            if state.context_data.get("rescheduling_appointment_id") and state.context_data.get("rescheduling_new_date") and state.context_data.get("rescheduling_new_time"):
                # If this looks like a new reschedule request, clear old state and process as new
                if is_new_reschedule_request:
                    state.context_data.pop("rescheduling_appointment_id", None)
                    state.context_data.pop("rescheduling_new_date", None)
                    state.context_data.pop("rescheduling_new_time", None)
                else:
                    # This is a confirmation response
                    appointment_id = state.context_data["rescheduling_appointment_id"]
                    
                    if "yes" in message_lower or "confirm" in message_lower:
                        try:
                            # Get appointment details
                            appointment = self.appointment_service.get_appointment_model_by_id(appointment_id)
                            if not appointment:
                                raise ValidationException("Appointment not found")

                            # Parse new date and time
                            new_date_str = state.context_data["rescheduling_new_date"]
                            new_time_str = state.context_data["rescheduling_new_time"]
                            new_datetime = self._parse_appointment_datetime(new_date_str, new_time_str)
                            
                            if not new_datetime:
                                logger.error(f"Failed to parse date/time: date={new_date_str}, time={new_time_str}")
                                raise ValidationException("Invalid date or time format")
                            

                            # Check if new time is available
                            available_slots = self.schedule_service.get_available_timeslots_for_date(
                                doctor_id=appointment.doctor_id,
                                target_date=new_datetime.date()
                            )
                            
                            # Normalize new_datetime for comparison
                            new_dt_naive = new_datetime
                            if new_datetime.tzinfo is not None:
                                new_dt_naive = new_datetime.replace(tzinfo=None)
                            new_dt_normalized = new_dt_naive.replace(second=0, microsecond=0)
                            
                            slot_found = False
                            for slot in available_slots:
                                if isinstance(slot.start_time, datetime):
                                    # Normalize slot time for comparison
                                    slot_time = slot.start_time
                                    if slot_time.tzinfo is not None:
                                        slot_time = slot_time.replace(tzinfo=None)
                                    slot_time_normalized = slot_time.replace(second=0, microsecond=0)
                                    
                                    if slot_time_normalized == new_dt_normalized:
                                        slot_found = True
                                        break

                            if not slot_found:
                                # Suggest available times
                                day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                                day_of_week = day_names[new_datetime.date().weekday()]
                                
                                schedules = self.schedule_service.db.query(DoctorSchedule).filter(
                                    DoctorSchedule.doctor_id == appointment.doctor_id,
                                    func.lower(DoctorSchedule.day_of_week) == day_of_week,
                                    DoctorSchedule.is_active == True,
                                    DoctorSchedule.deleted_at.is_(None)
                                ).all()
                                
                                if schedules:
                                    schedule_info = []
                                    for sched in schedules:
                                        start_str = sched.start_time.strftime("%I:%M %p").lstrip('0')
                                        end_str = sched.end_time.strftime("%I:%M %p").lstrip('0')
                                        schedule_info.append(f"{start_str} - {end_str}")
                                    
                                    available_hours = " or ".join(schedule_info)
                                    reply = (
                                        f"I'm sorry, but {new_datetime.strftime('%I:%M %p').lstrip('0')} is not available on {new_datetime.strftime('%B %d, %Y')}. "
                                        f"The doctor's available hours are: {available_hours}. "
                                        f"Please choose a time within these hours."
                                    )
                                else:
                                    reply = "I'm sorry, but that time is not available. Please choose a different date or time."
                                
                                state.context_data.pop("rescheduling_appointment_id", None)
                                state.context_data.pop("rescheduling_new_date", None)
                                state.context_data.pop("rescheduling_new_time", None)
                                
                                return ChatResponse(
                                    reply=reply,
                                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                                    disease_reasoning=None,
                                    doctor_suggestions=None,
                                    is_medical_query=True,
                                    conversation_state=state,
                                )

                            # Get slot duration from doctor's schedule
                            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                            day_of_week = day_names[new_datetime.date().weekday()]
                            
                            schedules = self.schedule_service.db.query(DoctorSchedule).filter(
                                DoctorSchedule.doctor_id == appointment.doctor_id,
                                func.lower(DoctorSchedule.day_of_week) == day_of_week,
                                DoctorSchedule.is_active == True,
                                DoctorSchedule.deleted_at.is_(None)
                            ).first()
                            
                            slot_duration = schedules.slot_duration if schedules else 30  # Default to 30 minutes
                            
                            # Create timeslot from virtual slot
                            end_datetime = new_datetime + timedelta(minutes=slot_duration)
                            timeslot_data = CreateTimeslotFromVirtualRequest(
                                start_time=new_datetime,
                                end_time=end_datetime
                            )
                            
                            # Create or get existing timeslot
                            new_timeslot = self.schedule_service.create_timeslot_from_virtual(
                                doctor_id=appointment.doctor_id,
                                data=timeslot_data
                            )
                            
                            # Update appointment with new timeslot
                            update_data = AppointmentUpdateRequest(
                                timeslot_id=new_timeslot.id
                            )
                            
                            # Update the appointment and get the updated appointment
                            try:
                                updated_appointment = self.appointment_service.update_appointment(appointment_id, update_data)
                                
                                # Note: update_appointment already commits, but we'll verify the update worked
                                
                            except Exception as update_error:
                                logger.error(f"Error in update_appointment: {str(update_error)}", exc_info=True)
                                if self.db:
                                    self.db.rollback()
                                raise
                            
                            # Verify the update was successful
                            if not updated_appointment:
                                logger.error(f"Failed to update appointment {appointment_id}: update_appointment returned None")
                                raise ValidationException("Failed to update appointment. Please try again.")
                            
                            # Get fresh appointment data to verify the update
                            # Use a new query to ensure we get the latest data from the database
                            refreshed_appointment = self.appointment_service.get_appointment_model_by_id(appointment_id)
                            if not refreshed_appointment:
                                logger.error(f"Failed to retrieve updated appointment {appointment_id}")
                                raise ValidationException("Failed to retrieve updated appointment. Please try again.")
                            
                            # Verify timeslot ID was actually changed
                            if refreshed_appointment.timeslot_id != new_timeslot.id:
                                logger.error(
                                    f"CRITICAL: Timeslot ID was not updated! Expected {new_timeslot.id}, got {refreshed_appointment.timeslot_id}. "
                                    f"Old timeslot: {appointment.timeslot_id}. Update may have failed silently."
                                )
                                raise ValidationException(
                                    f"Appointment update failed - the timeslot was not changed. "
                                    f"Please try again or contact support. Expected timeslot {new_timeslot.id}, but got {refreshed_appointment.timeslot_id}."
                                )
                            
                            
                            if refreshed_appointment.timeslot:
                                # Verify the timeslot time matches
                                updated_slot_time = refreshed_appointment.timeslot.start_time
                                if updated_slot_time.tzinfo is not None:
                                    updated_slot_time = updated_slot_time.replace(tzinfo=None)
                                updated_slot_normalized = updated_slot_time.replace(second=0, microsecond=0)
                                
                                
                                # If timeslot ID matches but time doesn't, log warning but don't fail
                                # (This could be a timezone/precision issue, but the timeslot is correct)
                                if updated_slot_normalized != new_dt_normalized:
                                    logger.warning(
                                        f"Time mismatch (but timeslot ID is correct): Expected {new_dt_normalized}, got {updated_slot_normalized}. "
                                        f"This might be a timezone or precision issue. Timeslot ID {refreshed_appointment.timeslot_id} is correct."
                                    )
                            else:
                                logger.error(f"Updated appointment {appointment_id} has no timeslot assigned")
                                raise ValidationException("Updated appointment has no timeslot assigned. Please contact support.")
                            
                            # Clear rescheduling state
                            state.context_data.pop("rescheduling_appointment_id", None)
                            state.context_data.pop("rescheduling_new_date", None)
                            state.context_data.pop("rescheduling_new_time", None)
                            
                            # Clear all booking-related state to prevent interference with next query
                            state.booking_stage = None
                            state.selected_doctor_id = None
                            state.extracted_date = None
                            state.extracted_time = None
                            state.context_data.pop("suggested_doctors", None)
                            state.context_data.pop("booking_doctor_name", None)
                            
                            doctor_name = self._get_doctor_name(appointment.doctor)
                            reply = (
                                f"✅ Your appointment with Dr. {doctor_name} has been rescheduled successfully! "
                                f"Your new appointment is on {new_datetime.strftime('%B %d, %Y')} at {new_datetime.strftime('%I:%M %p').lstrip('0')}. "
                                f"Is there anything else I can help you with?"
                            )
                            
                            return ChatResponse(
                                reply=reply,
                                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                                disease_reasoning=None,
                                doctor_suggestions=None,
                                is_medical_query=True,
                                conversation_state=state,
                            )
                        except ValidationException as e:
                            error_msg = str(e)
                            logger.error(f"Error rescheduling appointment {appointment_id}: {error_msg}", exc_info=True)
                            if "24 hours" in error_msg.lower():
                                reply = (
                                    "I'm sorry, but appointments can only be rescheduled at least 24 hours before the scheduled time. "
                                    "Your appointment is less than 24 hours away. Please contact the clinic directly for assistance."
                                )
                            else:
                                reply = f"I couldn't reschedule the appointment: {error_msg}. Please try again."
                            
                            state.context_data.pop("rescheduling_appointment_id", None)
                            state.context_data.pop("rescheduling_new_date", None)
                            state.context_data.pop("rescheduling_new_time", None)
                            
                            # Clear all booking-related state
                            state.booking_stage = None
                            state.selected_doctor_id = None
                            state.extracted_date = None
                            state.extracted_time = None
                            state.context_data.pop("suggested_doctors", None)
                            state.context_data.pop("booking_doctor_name", None)
                            
                            return ChatResponse(
                                reply=reply,
                                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                                disease_reasoning=None,
                                doctor_suggestions=None,
                                is_medical_query=True,
                            conversation_state=state,
                        )
                        except Exception as e:
                            logger.error(f"Unexpected error rescheduling appointment {appointment_id}: {str(e)}", exc_info=True)
                            reply = "I encountered an unexpected error while rescheduling your appointment. Please try again or contact support."
                            
                            state.context_data.pop("rescheduling_appointment_id", None)
                            state.context_data.pop("rescheduling_new_date", None)
                            state.context_data.pop("rescheduling_new_time", None)
                            
                            return ChatResponse(
                                reply=reply,
                                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                                disease_reasoning=None,
                                doctor_suggestions=None,
                                is_medical_query=True,
                                conversation_state=state,
                            )
                    elif "no" in message_lower and not is_new_reschedule_request:
                        state.context_data.pop("rescheduling_appointment_id", None)
                        state.context_data.pop("rescheduling_new_date", None)
                        state.context_data.pop("rescheduling_new_time", None)
                        return ChatResponse(
                            reply="Rescheduling cancelled. Your appointment remains as scheduled. Is there anything else I can help you with?",
                            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                            disease_reasoning=None,
                            doctor_suggestions=None,
                            is_medical_query=True,
                            conversation_state=state,
                        )

            # Get appointments to identify which one to reschedule
            appointments = self.appointment_service.get_patient_appointments(patient.id)
            
            # Filter to upcoming appointments only
            now = datetime.now()
            upcoming_appointments = []
            for apt in appointments:
                if apt.timeslot and apt.timeslot.start_time:
                    apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                    if apt_datetime and apt_datetime > now and apt.status.lower() not in ["cancelled", "completed"]:
                        upcoming_appointments.append(apt)
                elif apt.status.lower() not in ["cancelled", "completed"]:
                    upcoming_appointments.append(apt)

            if not upcoming_appointments:
                return ChatResponse(
                    reply="You don't have any upcoming appointments to reschedule. Would you like me to help you book a new appointment?",
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

            # Extract new date/time FIRST (before extracting appointment identifier)
            # This is important because the appointment identifier extraction might use the time
            # to match the appointment, and we need to distinguish old time from new time
            extracted_data = await self._extract_appointment_details(request.message)
            new_date = extracted_data.get("date")
            new_time = extracted_data.get("time")
            
            # Try to extract appointment identifier from message
            appointment_to_reschedule = await self._extract_appointment_identifier(
                request.message, upcoming_appointments
            )

            if appointment_to_reschedule:
                if new_date and new_time:
                    # Both appointment and new date/time provided
                    # Parse and validate new date/time
                    new_datetime = self._parse_appointment_datetime(new_date, new_time)
                    
                    if not new_datetime:
                        reply = "I had trouble understanding the new date and time. Please provide them in a clear format like 'December 15, 2024 at 2:00 PM'."
                    else:
                        # Store rescheduling info
                        state.context_data["rescheduling_appointment_id"] = appointment_to_reschedule.id
                        state.context_data["rescheduling_new_date"] = new_date
                        state.context_data["rescheduling_new_time"] = new_time
                        
                        doctor_name = self._get_doctor_name(appointment_to_reschedule.doctor)
                        formatted_date = new_datetime.strftime("%B %d, %Y")
                        formatted_time = new_datetime.strftime("%I:%M %p").lstrip('0')
                        
                        # Get current appointment date and time
                        current_date_str = "Date TBD"
                        current_time_str = "Time TBD"
                        if appointment_to_reschedule.timeslot and appointment_to_reschedule.timeslot.start_time:
                            current_apt_datetime = self._parse_timeslot_datetime(appointment_to_reschedule.timeslot)
                            if current_apt_datetime:
                                current_date_str = current_apt_datetime.strftime("%B %d, %Y")
                                current_time_str = current_apt_datetime.strftime("%I:%M %p").lstrip('0')
                        
                        reply = (
                            f"I found your appointment with Dr. {doctor_name} on {current_date_str} at {current_time_str}. "
                            f"Reschedule to {formatted_date} at {formatted_time}?\n\n"
                            f"Confirm to proceed with rescheduling."
                        )
                        
                        interactive_options = [
                            InteractiveOption(label="Yes, reschedule", value="confirm_reschedule", type="button"),
                            InteractiveOption(label="No, keep original", value="keep_original", type="button"),
                        ]
                        
                        return ChatResponse(
                            reply=reply,
                            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                            disease_reasoning=None,
                            doctor_suggestions=None,
                            is_medical_query=True,
                            interactive_options=interactive_options,
                            conversation_state=state,
                        )
                elif new_date or new_time:
                    # Appointment identified and partial date/time provided
                    # Store what we have and ask for the missing piece
                    state.context_data["rescheduling_appointment_id"] = appointment_to_reschedule.id
                    if new_date:
                        state.context_data["rescheduling_new_date"] = new_date
                    if new_time:
                        state.context_data["rescheduling_new_time"] = new_time
                    
                    doctor_name = self._get_doctor_name(appointment_to_reschedule.doctor)
                    if appointment_to_reschedule.timeslot and appointment_to_reschedule.timeslot.start_time:
                        apt_datetime = self._parse_timeslot_datetime(appointment_to_reschedule.timeslot)
                        if apt_datetime:
                            current_date = apt_datetime.strftime("%B %d, %Y")
                            current_time = apt_datetime.strftime("%I:%M %p").lstrip('0')
                        else:
                            current_date = "Date TBD"
                            current_time = "Time TBD"
                    else:
                        current_date = "Date TBD"
                        current_time = "Time TBD"
                    
                    if new_date and not new_time:
                        reply = (
                            f"I found your appointment with Dr. {doctor_name} on {current_date} at {current_time}. "
                            f"You want to reschedule to {new_date}. What time would you prefer?"
                        )
                    elif new_time and not new_date:
                        reply = (
                            f"I found your appointment with Dr. {doctor_name} on {current_date} at {current_time}. "
                            f"You want to reschedule to {new_time}. What date would you prefer?"
                        )
                    else:
                        reply = (
                            f"I found your appointment with Dr. {doctor_name} on {current_date} at {current_time}.\n\n"
                            f"What new date and time would you prefer?"
                        )
                    
                    return ChatResponse(
                        reply=reply,
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )
                else:
                    # Appointment identified but no new date/time
                    doctor_name = self._get_doctor_name(appointment_to_reschedule.doctor)
                    if appointment_to_reschedule.timeslot and appointment_to_reschedule.timeslot.start_time:
                        apt_datetime = self._parse_timeslot_datetime(appointment_to_reschedule.timeslot)
                        if apt_datetime:
                            current_date = apt_datetime.strftime("%B %d, %Y")
                            current_time = apt_datetime.strftime("%I:%M %p").lstrip('0')
                        else:
                            current_date = "Date TBD"
                            current_time = "Time TBD"
                    else:
                        current_date = "Date TBD"
                        current_time = "Time TBD"
                    
                    state.context_data["rescheduling_appointment_id"] = appointment_to_reschedule.id
                    
                    reply = (
                        f"I found your appointment with Dr. {doctor_name} on {current_date} at {current_time}.\n\n"
                        f"What new date and time would you prefer?"
                    )
                    
                    return ChatResponse(
                        reply=reply,
                        symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                        disease_reasoning=None,
                        doctor_suggestions=None,
                        is_medical_query=True,
                        conversation_state=state,
                    )
            else:
                # Show list of appointments to choose from
                reply = "I can help you reschedule an appointment. Here are your upcoming appointments:\n\n"
                for i, apt in enumerate(upcoming_appointments[:10], 1):
                    doctor_name = self._get_doctor_name(apt.doctor)
                    if apt.timeslot and apt.timeslot.start_time:
                        apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                        if apt_datetime:
                            date_str = apt_datetime.strftime("%B %d, %Y")
                            time_str = apt_datetime.strftime("%I:%M %p").lstrip('0')
                        else:
                            # Fallback: use date and time strings from timeslot
                            date_str = apt.timeslot.date if hasattr(apt.timeslot, 'date') and apt.timeslot.date else "Date TBD"
                            time_str = apt.timeslot.start_time if isinstance(apt.timeslot.start_time, str) else "Time TBD"
                    else:
                        date_str = "Date TBD"
                        time_str = "Time TBD"
                    reply += f"{i}. Dr. {doctor_name} - {date_str} at {time_str}\n"

                reply += "\nWhich appointment would you like to reschedule? You can tell me the doctor's name or date."

                # Store appointments in context
                state.context_data["appointments"] = [
                    {
                        "id": apt.id,
                        "doctor_name": self._get_doctor_name(apt.doctor),
                        "date": (self._parse_timeslot_datetime(apt.timeslot).strftime("%Y-%m-%d") if self._parse_timeslot_datetime(apt.timeslot) else (apt.timeslot.date if apt.timeslot and hasattr(apt.timeslot, 'date') and apt.timeslot.date else None)) if apt.timeslot and apt.timeslot.start_time else None,
                    }
                    for apt in upcoming_appointments
                ]

                return ChatResponse(
                    reply=reply,
                    symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                    disease_reasoning=None,
                    doctor_suggestions=None,
                    is_medical_query=True,
                    conversation_state=state,
                )

        except Exception as e:
            logger.error(f"Error rescheduling appointment: {str(e)}", exc_info=True)
            return ChatResponse(
                reply="I had trouble processing your rescheduling request. Please try again later or contact support.",
                symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
                disease_reasoning=None,
                doctor_suggestions=None,
                is_medical_query=True,
                conversation_state=state,
            )

    async def _handle_symptom_chat(
        self, request: ChatRequest, state: ConversationState
    ) -> ChatResponse:
        """Handle symptom-based chat with disease reasoning and doctor suggestions."""
        # Prepare conversation history
        messages = self._prepare_messages(request)

        # Get chat response
        chat_response = await self._get_chat_response(messages)

        # Extract symptoms
        symptoms_extracted = await self._extract_symptoms(request)

        # Generate disease reasoning
        disease_reasoning = None
        if symptoms_extracted.symptoms:
            disease_reasoning = await self.disease_reasoning_service.generate_disease_reasoning(
                symptoms_extracted
            )

        # Phase 3: doctor suggestions + urgency via LangGraph agent (if DB available)
        doctor_suggestions = None
        if self.doctor_suggestion_service and disease_reasoning:
            doctor_suggestions = run_doctor_suggestion_agent(
                self.doctor_suggestion_service,
                symptoms_extracted,
                disease_reasoning,
            )
            
            # Enhance reply with doctor suggestions if available
            if doctor_suggestions and doctor_suggestions.recommended_doctors:
                chat_response += "\n\n**Recommended Doctors:**\n"
                suggested_doctor_names = []
                for i, doc in enumerate(doctor_suggestions.recommended_doctors[:3], 1):
                    doctor_name = doc.full_name
                    suggested_doctor_names.append(doctor_name)
                    chat_response += f"{i}. Dr. {doctor_name} - {doc.specialization}\n"
                chat_response += "\nWould you like me to help you book an appointment with any of these doctors?"
                
                # Store suggested doctors in conversation state for later reference
                if suggested_doctor_names:
                    state.context_data["suggested_doctors"] = suggested_doctor_names

        return ChatResponse(
            reply=chat_response,
            symptoms_extracted=symptoms_extracted,
            disease_reasoning=disease_reasoning.model_dump() if disease_reasoning else None,
            doctor_suggestions=doctor_suggestions.model_dump() if doctor_suggestions else None,
            is_medical_query=True,
            conversation_state=state,
        )

    # ========== Helper Methods ==========

    def _sanitize_input(self, message: str) -> str:
        """Sanitize and validate user input."""
        if not message or not isinstance(message, str):
            return ""
        
        # Remove excessive whitespace
        message = re.sub(r'\s+', ' ', message.strip())
        
        # Limit length
        if len(message) > 2000:
            message = message[:2000]
        
        return message

    def _create_error_response(self, message: str) -> ChatResponse:
        """Create a standardized error response."""
        return ChatResponse(
            reply=message,
            symptoms_extracted=SymptomExtraction(symptoms=[], confidence_score=0.0),
            disease_reasoning=None,
            doctor_suggestions=None,
            is_medical_query=True,
        )

    async def _extract_appointment_details(self, message: str) -> Dict[str, Any]:
        """Extract appointment booking details from user message."""
        try:
            # Get current date for context
            now = datetime.now()
            today = now.date()
            tomorrow = today + timedelta(days=1)
            
            # Get day of week name
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            day_of_week = day_names[today.weekday()]
            
            # Format prompt with current date context
            prompt = APPOINTMENT_EXTRACTION_PROMPT.format(
                current_date=today.strftime("%Y-%m-%d"),
                tomorrow_date=tomorrow.strftime("%Y-%m-%d"),
                day_of_week=day_of_week
            )
            
            extraction_messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": message}
            ]

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=extraction_messages,
                max_tokens=200,
                temperature=0.1,
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content.strip()
            extracted = json.loads(result_text)
            
            # Post-process: convert day-of-week references to actual dates
            if extracted.get("date"):
                date_str = str(extracted["date"]).lower().strip()
                
                # Handle simple relative dates
                if "tomorrow" in date_str:
                    extracted["date"] = tomorrow.strftime("%Y-%m-%d")
                elif "today" in date_str:
                    extracted["date"] = today.strftime("%Y-%m-%d")
                else:
                    # Handle day-of-week references
                    day_date = self._parse_day_of_week_reference(date_str, today)
                    if day_date:
                        extracted["date"] = day_date.strftime("%Y-%m-%d")
            
            return extracted

        except Exception as e:
            logger.error(f"Error extracting appointment details: {str(e)}")
            return {}
    
    def _parse_day_of_week_reference(self, date_str: str, today: datetime.date) -> Optional[datetime.date]:
        """
        Parse day-of-week references like 'next monday', 'this friday', 'monday', etc.
        Returns the actual date.
        """
        try:
            # Day name mapping
            day_map = {
                'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
                'friday': 4, 'saturday': 5, 'sunday': 6
            }
            
            date_lower = date_str.lower()
            current_weekday = today.weekday()
            
            # Check for each day name
            for day_name, target_weekday in day_map.items():
                if day_name in date_lower:
                    # Calculate days until target weekday
                    days_ahead = target_weekday - current_weekday
                    
                    # Handle "next" keyword
                    if "next" in date_lower:
                        # Next occurrence (always in the future)
                        if days_ahead <= 0:
                            days_ahead += 7  # Next week
                        return today + timedelta(days=days_ahead)
                    # Handle "this" keyword
                    elif "this" in date_lower:
                        # This week's occurrence
                        if days_ahead < 0:
                            days_ahead += 7  # Already passed, use next week
                        return today + timedelta(days=days_ahead)
                    else:
                        # Just the day name - use next occurrence
                        if days_ahead <= 0:
                            days_ahead += 7  # Next week
                        return today + timedelta(days=days_ahead)
            
            return None
            
        except Exception as e:
            logger.error(f"Error parsing day-of-week reference: {str(e)}")
            return None

    def _parse_appointment_datetime(self, date_str: str, time_str: str) -> Optional[datetime]:
        """Parse date and time strings into datetime object."""
        try:
            today = datetime.now().date()
            
            # Handle relative dates first
            date_lower = date_str.lower() if date_str else ""
            if "tomorrow" in date_lower:
                parsed_date = today + timedelta(days=1)
            elif "today" in date_lower:
                parsed_date = today
            else:
                # Try various date formats
                date_formats = [
                    "%Y-%m-%d",
                    "%m/%d/%Y",
                    "%d/%m/%Y",
                    "%B %d, %Y",
                    "%b %d, %Y",
                    "%d %B %Y",
                    "%Y/%m/%d",
                    "%d-%m-%Y",
                ]
                
                parsed_date = None
                for fmt in date_formats:
                    try:
                        parsed_date = datetime.strptime(date_str, fmt).date()
                        break
                    except ValueError:
                        continue

                if not parsed_date:
                    logger.warning(f"Could not parse date: {date_str}")
                    return None

            # Validate date is not in the past
            if parsed_date < today:
                logger.warning(f"Date {parsed_date} is in the past, using today instead")
                parsed_date = today

            # Parse time - handle various formats including "12:30 pm", "12:30PM", "12:30", etc.
            time_str_clean = time_str.strip() if time_str else ""
            if not time_str_clean:
                return None
                
            # Normalize time string - handle spaces and case
            time_str_clean = re.sub(r'\s+', ' ', time_str_clean)
            
            time_formats = [
                "%I:%M %p",      # 12:30 PM
                "%I:%M%p",        # 12:30PM
                "%H:%M",          # 14:30
                "%H:%M:%S",       # 14:30:00
                "%I:%M:%S %p",    # 12:30:00 PM
            ]
            
            parsed_time = None
            for fmt in time_formats:
                try:
                    parsed_time = datetime.strptime(time_str_clean, fmt).time()
                    break
                except ValueError:
                    continue

            if not parsed_time:
                # Try manual parsing for edge cases like "12:30pm" (no space)
                time_match = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?', time_str_clean, re.IGNORECASE)
                if time_match:
                    hour = int(time_match.group(1))
                    minute = int(time_match.group(2))
                    am_pm = time_match.group(3)
                    
                    if am_pm:
                        am_pm = am_pm.upper()
                        if am_pm == "PM" and hour != 12:
                            hour += 12
                        elif am_pm == "AM" and hour == 12:
                            hour = 0
                    
                    parsed_time = time(hour, minute)
                else:
                    logger.warning(f"Could not parse time: {time_str}")
                    return None

            # Combine date and time
            appointment_datetime = datetime.combine(parsed_date, parsed_time)
            
            # Validate appointment is in the future
            if appointment_datetime < datetime.now():
                logger.warning(f"Appointment time {appointment_datetime} is in the past")
                # If it's today but time has passed, suggest tomorrow
                if parsed_date == today:
                    parsed_date = today + timedelta(days=1)
                    appointment_datetime = datetime.combine(parsed_date, parsed_time)
            
            return appointment_datetime

        except Exception as e:
            logger.error(f"Error parsing datetime: {str(e)}", exc_info=True)
            return None

    async def _extract_appointment_identifier(
        self, message: str, appointments: List[Any]
    ) -> Optional[Any]:
        """
        Extract appointment identifier from user message.
        Matches by date+doctor (most specific), then date alone, then doctor alone, then appointment number.
        Returns the appointment object if found.
        """
        try:
            message_lower = message.lower()
            
            # Extract date, time, and doctor name from message
            # For reschedule, we need to extract the OLD appointment time, not the new time
            # Look for patterns like "on 25 november 1 pm" or "november 25 at 1 pm"
            import re
            message_lower = message.lower()
            
            # First, try to extract the appointment time from the message
            # Pattern: "on [date] [time]" or "[date] [time]" or "[date] at [time]"
            time_patterns = [
                r'(?:on\s+)?(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+to',  # "on 25 november 1 pm to"
                r'(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+to',  # "25 november 1 pm to"
                r'(?:on\s+)?(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+to',  # "on 25 november at 1 pm to"
            ]
            
            old_time_value = None
            for pattern in time_patterns:
                match = re.search(pattern, message_lower)
                if match:
                    old_time_value = match.group(2).strip()
                    break
            
            # If no pattern match, try extracting from _extract_appointment_details
            # but be careful - it might extract the new time instead
            extracted_data = await self._extract_appointment_details(message)
            date_value = extracted_data.get("date")
            # Only use time_value if we didn't find it via pattern matching
            if not old_time_value:
                time_value = extracted_data.get("time")
            else:
                time_value = old_time_value
            doctor_name_from_msg = extracted_data.get("doctor_name", "").lower() if extracted_data.get("doctor_name") else ""
            
            # Also try to extract doctor name directly from message (for cases like "hassan" matching "Dr Hassan Saeed")
            if not doctor_name_from_msg:
                # Look for common doctor name patterns in the message
                import re
                # Common first names that might be used
                doctor_names_in_msg = []
                for apt in appointments:
                    doctor_name = self._get_doctor_name(apt.doctor)
                    if doctor_name and doctor_name != "Unknown Doctor":
                        doctor_full_name = doctor_name.lower()
                        # Extract first name (usually first word after "dr" or "dr.")
                        name_parts = [part for part in doctor_full_name.replace("dr.", "dr").split() if part != "dr"]
                        if name_parts:
                            first_name = name_parts[0]
                            # Check if this first name appears in the message
                            if first_name in message_lower and len(first_name) > 2:  # Avoid matching very short words
                                doctor_names_in_msg.append((first_name, doctor_name))
                
                # If we found a doctor name, use it
                if doctor_names_in_msg:
                    # Use the first match
                    doctor_name_from_msg = doctor_names_in_msg[0][0]
            
            # Also try to extract date directly from message if LLM didn't extract it
            import re
            if not date_value:
                # Look for patterns like "november 20", "nov 20", "20 november", "20 nov"
                month_map = {
                    "january": 1, "jan": 1, "february": 2, "feb": 2,
                    "march": 3, "mar": 3, "april": 4, "apr": 4,
                    "may": 5, "june": 6, "jun": 6, "july": 7, "jul": 7,
                    "august": 8, "aug": 8, "september": 9, "sep": 9, "sept": 9,
                    "october": 10, "oct": 10, "november": 11, "nov": 11,
                    "december": 12, "dec": 12
                }
                for month_name, month_num in month_map.items():
                    if month_name in message_lower:
                        # Find day number near the month name
                        # Look for patterns like "november 20" or "20 november"
                        pattern1 = rf'{month_name}\s+(\d{{1,2}})\b'
                        pattern2 = rf'\b(\d{{1,2}})\s+{month_name}'
                        match1 = re.search(pattern1, message_lower)
                        match2 = re.search(pattern2, message_lower)
                        day_match = match1 or match2
                        if day_match:
                            day = int(day_match.group(1))
                            current_year = datetime.now().year
                            try:
                                parsed_date = datetime(current_year, month_num, day).date()
                                date_value = parsed_date.strftime("%Y-%m-%d")
                                break
                            except ValueError:
                                pass
            
            # Parse date if provided
            target_date = None
            if date_value:
                try:
                    if isinstance(date_value, str):
                        today = datetime.now().date()
                        date_lower = date_value.lower()
                        
                        # Handle relative dates
                        if "tomorrow" in date_lower:
                            target_date = today + timedelta(days=1)
                        elif "today" in date_lower:
                            target_date = today
                        else:
                            day_date = self._parse_day_of_week_reference(date_lower, today)
                            if day_date:
                                target_date = day_date
                            else:
                                try:
                                    target_date = datetime.strptime(date_value, "%Y-%m-%d").date()
                                except ValueError:
                                    # Try to extract date from natural language like "November 20"
                                    # Match patterns like "november 20", "nov 20", "20 november"
                                    month_map = {
                                        "january": 1, "jan": 1, "february": 2, "feb": 2,
                                        "march": 3, "mar": 3, "april": 4, "apr": 4,
                                        "may": 5, "june": 6, "jun": 6, "july": 7, "jul": 7,
                                        "august": 8, "aug": 8, "september": 9, "sep": 9, "sept": 9,
                                        "october": 10, "oct": 10, "november": 11, "nov": 11,
                                        "december": 12, "dec": 12
                                    }
                                    # Try to find month and day in date string
                                    for month_name, month_num in month_map.items():
                                        if month_name in date_lower:
                                            # Find day number
                                            day_match = re.search(r'\b(\d{1,2})\b', date_lower)
                                            if day_match:
                                                day = int(day_match.group(1))
                                                current_year = datetime.now().year
                                                try:
                                                    target_date = datetime(current_year, month_num, day).date()
                                                    break
                                                except ValueError:
                                                    pass
                except (ValueError, AttributeError) as e:
                    logger.debug(f"Error parsing date: {str(e)}")
                    pass
            
            # Priority 1: Match by date + doctor name (most specific)
            if target_date and doctor_name_from_msg:
                for apt in appointments:
                    doctor_name = self._get_doctor_name(apt.doctor)
                    if doctor_name and doctor_name != "Unknown Doctor":
                        doctor_name_lower = doctor_name.lower()
                        # Check if doctor name matches
                        if doctor_name_from_msg in doctor_name_lower or any(
                            word in doctor_name_lower for word in doctor_name_from_msg.split() if word
                        ):
                            # Check if date matches
                            if apt.timeslot and apt.timeslot.start_time:
                                apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                                if apt_datetime and apt_datetime.date() == target_date:
                                    return apt
            
            # Priority 2: Match by date alone (if date is specific)
            if target_date:
                matching_appointments = []
                for apt in appointments:
                    if apt.timeslot and apt.timeslot.start_time:
                        apt_datetime = self._parse_timeslot_datetime(apt.timeslot)
                        if apt_datetime and apt_datetime.date() == target_date:
                            matching_appointments.append(apt)
                
                # If only one match, return it
                if len(matching_appointments) == 1:
                    return matching_appointments[0]
                # If multiple matches and doctor name provided, filter by doctor
                elif len(matching_appointments) > 1 and doctor_name_from_msg:
                    for apt in matching_appointments:
                        doctor_name = self._get_doctor_name(apt.doctor)
                        if doctor_name and doctor_name != "Unknown Doctor":
                            doctor_name_lower = doctor_name.lower()
                            if doctor_name_from_msg in doctor_name_lower or any(
                                word in doctor_name_lower for word in doctor_name_from_msg.split() if word
                            ):
                                return apt
                # If multiple matches, return the first one (user can clarify)
                elif matching_appointments:
                    return matching_appointments[0]
            
            # Priority 3: Match by doctor name alone (if no date or date didn't match)
            if doctor_name_from_msg:
                matching_doctors = []
                for apt in appointments:
                    doctor_name = self._get_doctor_name(apt.doctor)
                    if doctor_name and doctor_name != "Unknown Doctor":
                        doctor_name_lower = doctor_name.lower()
                        doctor_name_parts = [part for part in doctor_name_lower.replace("dr.", "dr").split() if part != "dr"]
                        name_matches = (
                            doctor_name_from_msg in doctor_name_lower or
                            any(word in doctor_name_lower for word in doctor_name_from_msg.split() if word) or
                            (doctor_name_parts and doctor_name_from_msg in doctor_name_parts[0]) or
                            (doctor_name_parts and any(part.startswith(doctor_name_from_msg) for part in doctor_name_parts))
                        )
                        if name_matches:
                            matching_doctors.append(apt)
                
                # If only one match, return it
                if len(matching_doctors) == 1:
                    return matching_doctors[0]
                # If multiple matches, prefer the earliest one
                elif matching_doctors:
                    # Sort by date and return earliest
                    matching_doctors.sort(key=lambda x: (
                        self._parse_timeslot_datetime(x.timeslot) if x.timeslot else datetime.max
                    ))
                    return matching_doctors[0]
            
            # Try to match by appointment number (if user says "first", "second", "1", "2", etc.)
            import re
            number_match = re.search(r'\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|\d+)\b', message_lower)
            if number_match:
                number_str = number_match.group(1)
                # Convert to index
                number_map = {
                    "first": 0, "1st": 0, "1": 0,
                    "second": 1, "2nd": 1, "2": 1,
                    "third": 2, "3rd": 2, "3": 2,
                    "fourth": 3, "4th": 3, "4": 3,
                    "fifth": 4, "5th": 4, "5": 4,
                }
                index = number_map.get(number_str.lower(), None)
                if index is not None and index < len(appointments):
                    return appointments[index]
            
            # If no match found, return None
            return None

        except Exception as e:
            logger.error(f"Error extracting appointment identifier: {str(e)}")
            return None

    async def _extract_specialization(self, query: str) -> Optional[str]:
        """Extract medical specialization from a doctor search query."""
        try:
            extraction_messages = [
                {
                    "role": "system",
                    "content": """Extract the medical specialization from the user's query. Common specializations include:
- cardiology (heart)
- dermatology (skin)
- neurology (brain/nervous system)
- orthopedics (bones/joints)
- pediatrics (children)
- psychiatry (mental health)
- oncology (cancer)
- gynecology (women's health)
- urology (urinary system)
- gastroenterology (digestive system)

If no clear specialization is mentioned, respond with 'general' or the most relevant category based on keywords.

Respond with only the specialization name."""
                },
                {"role": "user", "content": query}
            ]

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=extraction_messages,
                max_tokens=20,
                temperature=0.1
            )

            specialization = response.choices[0].message.content.strip().lower()
            return specialization if specialization != "general" else None

        except Exception:
            return None

    def _prepare_messages(self, request: ChatRequest) -> List[Dict[str, str]]:
        """Prepare messages for OpenAI API."""
        messages = [
            {"role": "system", "content": MEDICAL_CHAT_SYSTEM_PROMPT}
        ]

        # Add conversation history
        for msg in request.conversation_history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add current message
        messages.append({
            "role": "user",
            "content": request.message
        })

        return messages

    async def _get_chat_response(self, messages: List[Dict[str, str]]) -> str:
        """Get response from OpenAI chat completion."""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=1000,
                temperature=0.7,
                top_p=0.9
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise Exception(f"OpenAI API error: {str(e)}")

    async def _extract_symptoms(self, request: ChatRequest) -> SymptomExtraction:
        """Extract symptoms from the conversation using OpenAI."""
        try:
            # Prepare conversation text for symptom extraction
            conversation_text = self._prepare_conversation_text(request)

            extraction_messages = [
                {"role": "system", "content": SYMPTOM_EXTRACTION_PROMPT},
                {"role": "user", "content": f"Conversation:\n{conversation_text}"}
            ]

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=extraction_messages,
                max_tokens=500,
                temperature=0.1,
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content.strip()
            result_data = json.loads(result_text)

            # Convert to SymptomExtraction schema
            symptoms = []
            for symptom_data in result_data.get("symptoms", []):
                symptoms.append(Symptom(**symptom_data))

            confidence_score = result_data.get("confidence_score", 0.5)

            return SymptomExtraction(
                symptoms=symptoms,
                confidence_score=confidence_score
            )

        except Exception as e:
            logger.error(f"Error extracting symptoms: {str(e)}")
            return SymptomExtraction(
                symptoms=[],
                confidence_score=0.0
            )

    def _prepare_conversation_text(self, request: ChatRequest) -> str:
        """Prepare conversation text for symptom extraction."""
        lines = []

        # Add conversation history
        for msg in request.conversation_history:
            role = "User" if msg.role == "user" else "Assistant"
            lines.append(f"{role}: {msg.content}")

        # Add current message
        lines.append(f"User: {request.message}")

        return "\n".join(lines)

    async def validate_medical_query(self, query: str) -> bool:
        """Validate if a query is healthcare-related."""
        try:
            validation_messages = [
                {
                    "role": "system",
                    "content": "Determine if the following query is related to healthcare topics including medical symptoms, health concerns, doctor recommendations, or appointment booking. Respond with only 'true' or 'false'."
                },
                {"role": "user", "content": query}
            ]

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=validation_messages,
                max_tokens=10,
                temperature=0.1
            )

            result = response.choices[0].message.content.strip().lower()
            return result == "true"

        except Exception:
            return True

    async def detect_query_intent(self, query: str) -> str:
        """Detect the intent of the query."""
        try:
            query_lower = query.lower().strip()
            
            # FIRST: Check for exit/greeting messages - these should be handled immediately
            exit_keywords = ["bye", "goodbye", "see you", "farewell", "take care", "have a good day", 
                           "have a nice day", "thanks bye", "thank you bye", "ok bye", "okay bye",
                           "alright bye", "alright, bye", "ok, bye", "okay, bye"]
            greeting_keywords = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening",
                               "greetings", "howdy"]
            
            if any(exit_phrase in query_lower for exit_phrase in exit_keywords):
                return "exit"
            
            if any(greeting_phrase in query_lower for greeting_phrase in greeting_keywords) and len(query_lower.split()) <= 3:
                return "greeting"
            
            # First, try keyword-based detection for common patterns (faster and more reliable)
            # IMPORTANT: Check doctor search FIRST before view appointments, because "list cardiologist" 
            # should be doctor_search, not view_appointments
            
            # Doctor search - check this FIRST to avoid false positives with "list", "show", etc.
            doctor_search_keywords = [
                "find doctor", "search doctor", "looking for doctor", "need a doctor", "doctor for",
                "specialist", "cardiologist", "dermatologist", "dentist", "neurologist", "orthopedic",
                "pediatrician", "gynecologist", "urologist", "psychiatrist", "heart specialist",
                "top doctor", "best doctor", "list doctor", "show doctor", "doctor near", "doctor in"
            ]
            if any(keyword in query_lower for keyword in doctor_search_keywords):
                return "doctor_search"
            
            # View appointments - but only if it's clearly about viewing user's own appointments
            # Check for "my appointments", "my bookings", or appointment-related context
            view_keywords = ["view", "show", "list", "see", "check"]
            appointment_context = ["my appointments", "my bookings", "what appointments", "all appointments", "upcoming appointments", "appointments i have", "my scheduled"]
            
            # Only classify as view_appointments if it mentions appointments/bookings explicitly
            # OR if it's a view/show/list keyword AND mentions appointments/bookings
            has_view_keyword = any(keyword in query_lower for keyword in view_keywords)
            has_appointment_context = any(context in query_lower for context in appointment_context) or ("appointment" in query_lower and "my" in query_lower) or ("booking" in query_lower and "my" in query_lower)
            
            if has_view_keyword and has_appointment_context:
                return "view_appointments"
            
            # Cancel appointment
            cancel_keywords = ["cancel", "delete", "remove appointment", "don't want", "don't need appointment"]
            if any(keyword in query_lower for keyword in cancel_keywords) and ("appointment" in query_lower or "booking" in query_lower):
                return "cancel_appointment"
            
            # Reschedule appointment - check this BEFORE booking to avoid false positives
            # Patterns like "change my appointment", "change appointment", "reschedule", etc.
            reschedule_keywords = [
                "reschedule", 
                "change appointment", 
                "change my appointment",
                "change the appointment",
                "move appointment", 
                "move my appointment",
                "change time",
                "change the time",
                "different time", 
                "different date"
            ]
            # Check for exact phrase matches first
            if any(keyword in query_lower for keyword in reschedule_keywords):
                return "reschedule_appointment"
            # Also check for "change" + "appointment" appearing together (even with words in between)
            if "change" in query_lower and "appointment" in query_lower:
                return "reschedule_appointment"
            # Check for "from X to Y" pattern (common in reschedule requests like "from 25 november to 26 november")
            import re
            if re.search(r'\bfrom\s+.*\s+to\s+', query_lower) and "appointment" in query_lower:
                return "reschedule_appointment"
            
            # Symptom queries (common symptoms)
            symptom_keywords = ["headache", "fever", "pain", "ache", "nausea", "dizziness", "cough", "sore", "hurt", "unwell", "sick", "symptom", "feeling", "i have", "i'm experiencing"]
            if any(keyword in query_lower for keyword in symptom_keywords):
                return "symptoms"
            
            # Appointment booking - check this AFTER reschedule to avoid false positives
            booking_keywords = ["book", "schedule", "appointment with", "make appointment", "set appointment"]
            if any(keyword in query_lower for keyword in booking_keywords):
                return "appointment_booking"
            
            # If keyword detection didn't work, use LLM
            intent_messages = [
                {
                    "role": "system",
                    "content": """Analyze the user's query and classify it into one of these categories:
- symptoms: describing health symptoms or conditions (e.g., "I have a headache", "feeling dizzy", "my stomach hurts")
- doctor_search: looking for doctors, specialists, or healthcare providers (e.g., "find a cardiologist", "I need a dentist")
- appointment_booking: wanting to schedule or book a NEW appointment (e.g., "book appointment", "schedule visit")
- view_appointments: wanting to see, list, or check EXISTING appointments (e.g., "show my appointments", "my bookings", "what appointments do I have", "view my all appointments")
- cancel_appointment: wanting to cancel an existing appointment (e.g., "cancel appointment", "cancel my booking")
- reschedule_appointment: wanting to change or reschedule an existing appointment (e.g., "reschedule", "change appointment time")
- general_health: general health questions or advice
- other: anything else

IMPORTANT: 
- "view my appointments" or "show appointments" = view_appointments (NOT appointment_booking)
- "I have [symptom]" = symptoms (NOT appointment_booking)
- Only NEW appointment requests = appointment_booking

Respond with only the category name."""
                },
                {"role": "user", "content": query}
            ]

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=intent_messages,
                max_tokens=20,
                temperature=0.1
            )

            intent = response.choices[0].message.content.strip().lower()
            valid_intents = [
                "symptoms", "doctor_search", "appointment_booking", 
                "view_appointments", "cancel_appointment", "reschedule_appointment",
                "general_health", "other"
            ]
            detected_intent = intent if intent in valid_intents else "general_health"
            
            # Map LLM response to our intent names
            if detected_intent == "symptoms":
                return "symptoms"
            elif detected_intent in ["doctor_search", "search"]:
                return "doctor_search"
            elif detected_intent in ["appointment_booking", "booking"]:
                return "appointment_booking"
            elif detected_intent in ["view_appointments", "view", "list"]:
                return "view_appointments"
            elif detected_intent in ["cancel_appointment", "cancel"]:
                return "cancel_appointment"
            elif detected_intent in ["reschedule_appointment", "reschedule"]:
                return "reschedule_appointment"
            else:
                return "symptoms"  # Default to symptoms for health-related queries

        except Exception as e:
            logger.error(f"Error detecting intent: {str(e)}", exc_info=True)
            # Fallback: check for symptom keywords
            query_lower = query.lower()
            if any(keyword in query_lower for keyword in ["headache", "pain", "fever", "ache", "sick", "hurt", "i have", "feeling"]):
                return "symptoms"
            return "general_health"
