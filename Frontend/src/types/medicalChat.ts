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

export interface MedicalChatApiResponse {
  reply: string;
  extracted_symptoms: SymptomExtractionPayload;
  disease_reasoning: DiseaseReasoningPayload | null;
  doctor_suggestions: DoctorSuggestionResult | null;
  is_medical_query: boolean;
}

