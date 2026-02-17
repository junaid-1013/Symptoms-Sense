"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, ClipboardList, Stethoscope, UserCircle } from "lucide-react";
import {
  DiseaseReasoningPayload,
  RiskLevel,
  SymptomExtractionPayload,
  DoctorSuggestionResult,
  UrgencyLevel,
} from "@/types/medicalChat";

interface MedicalInsightsPanelProps {
  extractedSymptoms: SymptomExtractionPayload | null;
  diseaseReasoning: DiseaseReasoningPayload | null;
  doctorSuggestions: DoctorSuggestionResult | null;
  isMedicalQuery: boolean;
  loading: boolean;
}

const riskTone: Record<RiskLevel, string> = {
  low: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  moderate: "bg-amber-50 text-amber-700 border border-amber-200",
  high: "bg-rose-50 text-rose-700 border border-rose-200",
};

const urgencyTone: Record<UrgencyLevel, string> = {
  low: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  moderate: "bg-amber-50 text-amber-700 border border-amber-200",
  high: "bg-rose-50 text-rose-700 border border-rose-200",
  emergency: "bg-red-600/10 text-red-700 border border-red-300",
};

const fallbackMessage =
  "Share your symptoms to view detected issues, possible conditions, and which specialist can help.";

export function MedicalInsightsPanel({
  extractedSymptoms,
  diseaseReasoning,
  doctorSuggestions,
  isMedicalQuery,
  loading,
}: MedicalInsightsPanelProps) {
  const hasSymptoms = Boolean(extractedSymptoms?.symptoms?.length);
  const hasReasoning = Boolean(diseaseReasoning);
  const riskLevel: RiskLevel = diseaseReasoning?.risk_level ?? "low";
  const urgencyLevel: UrgencyLevel = doctorSuggestions?.urgency_level ?? "low";

  if (!isMedicalQuery) {
    return (
      <aside className="flex-1 space-y-4 min-w-[280px] mt-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Medical Queries Only
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Please ask a health-related question so we can evaluate symptoms and provide safe medical guidance.
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="flex-1 space-y-4 min-w-[280px] mt-1">
      <Card>
        <CardHeader className="flex flex-col space-y-2 pb-3">
          <div className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Risk Assessment
            </CardTitle>
            <Badge className={cn("uppercase tracking-wide text-xs", riskTone[riskLevel])}>{riskLevel}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Urgency</span>
            <Badge className={cn("uppercase tracking-wide text-xs", urgencyTone[urgencyLevel])}>
              {urgencyLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Analyzing symptoms and urgency...</p>
          ) : hasReasoning ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">{diseaseReasoning?.explanation}</p>
              {doctorSuggestions?.reasoning && (
                <p className="text-xs text-muted-foreground mb-1">{doctorSuggestions.reasoning}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This is not a diagnosis. Please consult a healthcare professional, and seek emergency care if you feel
                severely unwell.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{fallbackMessage}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Detected Symptoms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasSymptoms ? (
            extractedSymptoms?.symptoms.map((symptom) => (
              <div key={symptom.name} className="rounded-md border border-border p-3">
                <p className="font-medium">{symptom.name}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  {symptom.severity && <p>Severity: {symptom.severity}</p>}
                  {symptom.duration && <p>Duration: {symptom.duration}</p>}
                  {symptom.description && <p>Notes: {symptom.description}</p>}
                  {symptom.risk_factors?.length ? (
                    <p>Risk factors: {symptom.risk_factors.join(", ")}</p>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{loading ? "Extracting symptoms..." : fallbackMessage}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Possible Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasReasoning && diseaseReasoning?.possible_conditions?.length ? (
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {diseaseReasoning.possible_conditions.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loading ? "Generating possible conditions..." : fallbackMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Recommended Specializations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {hasReasoning && diseaseReasoning?.recommended_specializations?.length ? (
            diseaseReasoning.recommended_specializations.map((specialization) => (
              <Badge key={specialization} variant="secondary" className="text-xs">
                {specialization}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {loading ? "Mapping specialists..." : fallbackMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            Recommended Doctors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {doctorSuggestions?.recommended_doctors?.length ? (
            doctorSuggestions.recommended_doctors.map((doc) => (
              <div key={doc.id} className="rounded-md border border-border p-3">
                <p className="font-medium">{doc.full_name}</p>
                <p className="text-xs text-muted-foreground mb-1">{doc.specialization}</p>
                {doc.clinic && <p className="text-xs text-muted-foreground">Clinic: {doc.clinic}</p>}
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  {doc.experience_years != null && <span>{doc.experience_years} yrs experience</span>}
                  {doc.rating != null && <span>Rating: {doc.rating.toFixed(1)}/5</span>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {loading ? "Finding suitable doctors..." : "Doctors will appear here once we understand your symptoms."}
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

