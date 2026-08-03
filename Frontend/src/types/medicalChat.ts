export interface ChatSymptom {
  name: string;
  severity?: string | null;
  duration?: string | null;
  description?: string | null;
  risk_factors?: string[] | null;
}

export interface SymptomExtractionPayload {
  symptoms: ChatSymptom[];
  confidence_score: number;
}

export type RiskLevel = "low" | "moderate" | "high";
export type UrgencyLevel = "low" | "moderate" | "high" | "emergency";

export interface DiseaseReasoningPayload {
  possible_conditions: string[];
  risk_level: RiskLevel;
  recommended_specializations: string[];
  explanation: string;
}

export interface DoctorRecommendation {
  id: string;
  full_name: string;
  specialization: string;
  clinic: string | null;
  experience_years: number | null;
  rating: number | null;
}

export interface DoctorSuggestionResult {
  recommended_doctors: DoctorRecommendation[];
  urgency_level: UrgencyLevel;
  reasoning: string;
}

export interface ConversationState {
  intent?: string | null;
  booking_stage?: string | null;
  selected_doctor_id?: string | null;
  selected_timeslot_id?: string | null;
  extracted_date?: string | null;
  extracted_time?: string | null;
  chief_complaint?: string | null;
  context_data?: Record<string, any>;
}

export interface CardDoctor {
  id: string;
  name: string;
  specialization: string;
  clinic?: string | null;
  address?: string | null;
  experience_years?: number | null;
  avatar_url?: string | null;
  rating?: number | null;
  review_count?: number;
}

export interface CardAppointment {
  id: string;
  doctor_name: string;
  specialization?: string;
  clinic?: string;
  date: string | null;
  time: string | null;
  status: string;
  reason?: string | null;
}

export type ActionStatus = "pending" | "confirmed" | "dismissed" | "failed";

export type ChatCard =
  | { type: "doctor_list"; doctors: CardDoctor[] }
  | {
      type: "slot_picker";
      doctor: CardDoctor;
      days: Array<{ date: string; label: string; slots: Array<{ time: string; label: string }> }>;
    }
  | {
      type: "appointment_confirm";
      action_id: string;
      status: ActionStatus;
      summary: { doctor: CardDoctor; date_label: string; time_label: string; reason: string };
    }
  | { type: "cancel_confirm"; action_id: string; status: ActionStatus; summary: { appointment: CardAppointment } }
  | {
      type: "reschedule_confirm";
      action_id: string;
      status: ActionStatus;
      summary: { appointment: CardAppointment; new_date_label: string; new_time_label: string };
    }
  | {
      type: "reminder_confirm";
      action_id: string;
      status: ActionStatus;
      summary: ReminderSummary;
    }
  | { type: "appointment_created"; summary: { doctor: CardDoctor; date?: string; time?: string; date_label: string; time_label: string; reason: string } }
  | { type: "appointment_cancelled"; summary: { appointment: CardAppointment } }
  | {
      type: "appointment_rescheduled";
      summary: { appointment: CardAppointment; new_date_label: string; new_time_label: string };
    }
  | { type: "reminder_created"; summary: ReminderSummary }
  | { type: "appointment_list"; appointments: CardAppointment[] }
  | {
      type: "reminder_list";
      timezone: string;
      reminders: Array<{
        id: string;
        medicine_name: string;
        dosage: number;
        medicine_type: string;
        days_of_week: string[];
        reminder_time: string;
      }>;
    }
  | { type: "login_required" }
  | { type: "urgent_notice"; level: "high" | "emergency" };

export interface ReminderSummary {
  medicine_name: string;
  dosage: number;
  medicine_type: string;
  days_of_week: string[];
  time: string;
  time_label: string;
  timezone: string;
}

export interface MedicalChatApiResponse {
  cards?: ChatCard[];
  conversation_id?: string | null;
  reply: string;
  extracted_symptoms: SymptomExtractionPayload;
  disease_reasoning: DiseaseReasoningPayload | null;
  doctor_suggestions: DoctorSuggestionResult | null;
  is_medical_query: boolean;
  conversation_state?: ConversationState | null;
  appointment_created?: Record<string, any> | null;
  interactive_options?: Array<{
    label: string;
    value: string;
    type: string;
  }> | null;
  doctors_list?: Array<{
    id: string;
    name: string;
    specializations: string[];
    clinic_name: string;
    experience_years?: number | null;
    bio?: string | null;
  }> | null;
}

export interface InteractiveOption {
  label: string;
  value: string;
  type: string;
}

export interface DoctorInfo {
  id: string;
  name: string;
  specializations: string[];
  clinic_name?: string;
  experience_years?: number | null;
  bio?: string | null;
}
