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

export interface MedicalChatApiResponse {
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
