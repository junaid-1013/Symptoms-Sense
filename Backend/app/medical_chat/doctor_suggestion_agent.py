"""
LangGraph-based agent to orchestrate doctor suggestion generation.

This agent takes Phase 1 + 2 outputs (symptom extraction and disease reasoning)
and returns a DoctorSuggestionResult.
"""

from typing import TypedDict

from langgraph.graph import StateGraph, END

from app.medical_chat.schema import (
    SymptomExtraction,
    DiseaseReasoning,
    DoctorSuggestionResult,
)
from app.services import DoctorSuggestionService


class DoctorSuggestionState(TypedDict, total=False):
    extraction: SymptomExtraction
    reasoning: DiseaseReasoning
    suggestions: DoctorSuggestionResult


def build_doctor_suggestion_graph(
    suggestion_service: DoctorSuggestionService,
):
    """
    Build a simple LangGraph state machine:
    extraction + reasoning -> doctor_suggestion_node -> END
    """
    graph = StateGraph(DoctorSuggestionState)

    def doctor_suggestion_node(state: DoctorSuggestionState) -> DoctorSuggestionState:
        extraction = state["extraction"]
        reasoning = state["reasoning"]
        suggestions = suggestion_service.suggest_doctors(extraction, reasoning)
        return {**state, "suggestions": suggestions}

    graph.add_node("doctor_suggestion", doctor_suggestion_node)
    graph.set_entry_point("doctor_suggestion")
    graph.add_edge("doctor_suggestion", END)

    return graph.compile()


def run_doctor_suggestion_agent(
    suggestion_service: DoctorSuggestionService,
    extraction: SymptomExtraction,
    reasoning: DiseaseReasoning,
) -> DoctorSuggestionResult:
    """
    Convenience helper to execute the doctor suggestion agent.
    """
    graph = build_doctor_suggestion_graph(suggestion_service)
    final_state = graph.invoke({"extraction": extraction, "reasoning": reasoning})
    return final_state["suggestions"]


