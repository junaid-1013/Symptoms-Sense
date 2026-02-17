"""
Service responsible for generating structured disease reasoning.
"""

import json
from collections import Counter
from typing import List, Optional, Set, Tuple

from openai import AsyncOpenAI

from app.core.config import config
from app.data import SPECIALIZATION_MAPPING
from app.medical_chat.disease_reasoning_prompt import DISEASE_REASONING_PROMPT
from app.medical_chat.schema import DiseaseReasoning, SymptomExtraction


class DiseaseReasoningService:
    """Generate structured, safe disease reasoning from extracted symptoms."""

    def __init__(self, client: Optional[AsyncOpenAI] = None):
        self.client = client or AsyncOpenAI(api_key=config.OPENAI_API_KEY)

    async def generate_disease_reasoning(self, extraction: SymptomExtraction) -> DiseaseReasoning:
        """Call the LLM and blend static mapping results to produce reasoning."""
        if not extraction.symptoms:
            return DiseaseReasoning(
                possible_conditions=[],
                risk_level="low",
                recommended_specializations=[],
                explanation="No clear symptoms were detected, so no disease reasoning could be generated."
            )

        mapped_specializations = self._map_specializations(extraction)

        try:
            messages = [
                {"role": "system", "content": DISEASE_REASONING_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "symptoms": [symptom.model_dump() for symptom in extraction.symptoms],
                            "confidence_score": extraction.confidence_score,
                        }
                    ),
                },
            ]

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=600,
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            reasoning_payload = json.loads(response.choices[0].message.content.strip())
        except Exception:
            return DiseaseReasoning(
                possible_conditions=[],
                risk_level="low",
                recommended_specializations=mapped_specializations,
                explanation="Unable to generate reasoning at this time. Please consult a clinician if symptoms persist or worsen.",
            )

        possible_conditions = self._sanitize_string_list(reasoning_payload.get("possible_conditions", []))
        explanation = reasoning_payload.get("explanation") or "No explanation provided."
        risk_level = self._sanitize_risk_level(reasoning_payload.get("risk_level", "low"))
        llm_specializations = self._sanitize_string_list(reasoning_payload.get("recommended_specializations", []))

        combined_specializations = self._merge_specializations(
            mapped_specializations,
            llm_specializations,
        )

        return DiseaseReasoning(
            possible_conditions=possible_conditions,
            risk_level=risk_level,
            recommended_specializations=combined_specializations,
            explanation=explanation.strip(),
        )

    def _map_specializations(self, extraction: SymptomExtraction) -> List[str]:
        """Map extracted symptoms to static specializations ranked by relevance."""
        counter: Counter[str] = Counter()
        display_lookup: dict[str, str] = {}

        for symptom in extraction.symptoms:
            symptom_name = (symptom.name or "").lower()
            if not symptom_name:
                continue
            for keyword, specialties in SPECIALIZATION_MAPPING.items():
                if keyword in symptom_name:
                    for spec in specialties:
                        display_value = spec.strip()
                        normalized = self._normalize_spec(display_value)
                        if normalized:
                            counter[normalized] += 1
                            display_lookup.setdefault(normalized, display_value)

        ranked: List[Tuple[str, int]] = sorted(
            counter.items(),
            key=lambda item: (-item[1], item[0]),
        )
        return [display_lookup[spec] for spec, _ in ranked]

    def _merge_specializations(
        self,
        mapped_specializations: List[str],
        llm_specializations: List[str],
    ) -> List[str]:
        """Merge static and LLM-derived specializations removing duplicates."""
        prioritized: List[str] = []
        seen: Set[str] = set()

        for spec in mapped_specializations + llm_specializations:
            normalized = self._normalize_spec(spec)
            if not normalized or normalized in seen:
                continue
            prioritized.append(spec.strip())
            seen.add(normalized)

        return self._refine_specialization_list(prioritized)

    @staticmethod
    def _sanitize_string_list(values: List[str]) -> List[str]:
        return [value.strip() for value in values if isinstance(value, str) and value.strip()]

    @staticmethod
    def _sanitize_risk_level(level: str) -> str:
        normalized = (level or "").strip().lower()
        if normalized not in {"low", "moderate", "high"}:
            return "low"
        return normalized

    @staticmethod
    def _normalize_spec(spec: Optional[str]) -> str:
        if not spec:
            return ""
        return spec.strip().lower()

    def _refine_specialization_list(self, specializations: List[str], max_items: int = 4) -> List[str]:
        """Keep list concise and realistic, favoring specific specialties."""
        if not specializations:
            return []

        generic_terms = {
            "general physician",
            "general practitioner",
            "primary care physician",
            "physician",
            "doctor",
        }

        specific: List[str] = []
        generic: List[str] = []

        for spec in specializations:
            normalized = self._normalize_spec(spec)
            if normalized in generic_terms:
                generic.append(spec)
            else:
                specific.append(spec)

        refined: List[str] = specific[:max_items]

        if not refined and generic:
            refined = generic[:1]
        elif len(refined) < max_items and generic:
            refined.append(generic[0])

        return refined

