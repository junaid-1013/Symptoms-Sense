"use client";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { ChatList } from "./chat-list";
import ChatTopbar from "./chat-topbar";
import { MedicalInsightsPanel } from "./medical-insights-panel";
import {
  DiseaseReasoningPayload,
  MedicalChatApiResponse,
  SymptomExtractionPayload,
  DoctorSuggestionResult,
} from "@/types/medicalChat";
import { useUser } from "@/contextApis/UserContext";

export interface Message {
  role: "user" | "assistant";
  content: string;
  links?: string[];
};

export function Chat() {
  const { tokens } = useUser();
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello there! I am your AI medical assistant. Tell me how are you feeling?",
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [conversationState, setConversationState] = useState<any>(null);
  const [insights, setInsights] = useState<{
    extractedSymptoms: SymptomExtractionPayload | null;
    diseaseReasoning: DiseaseReasoningPayload | null;
    doctorSuggestions: DoctorSuggestionResult | null;
    isMedicalQuery: boolean;
  }>({
    extractedSymptoms: null,
    diseaseReasoning: null,
    doctorSuggestions: null,
    isMedicalQuery: true,
  });
  const handleClick = async () => {
    if (message === "") return;

    const userMessage = { role: "user" as const, content: message };
    const updatedHistory = [...history, userMessage];

    setHistory(updatedHistory);

    setMessage("");
    setLoading(true);

    try {
      // Prepare headers with authentication
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add Authorization header if token is available
      if (tokens?.accessToken) {
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;
      }

      // Prepare request body with conversation state
      const requestBody: any = {
        query: message,
        history: updatedHistory,
      };
      
      // Include conversation state if available
      if (conversationState) {
        requestBody.conversation_state = conversationState;
      }

      const response = await fetch("http://127.0.0.1:8000/api/medical-chat", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from server");
      }

      const result = await response.json();
      const payload: MedicalChatApiResponse = result.data;

      setHistory((oldHistory) => [
        ...oldHistory,
        { role: "assistant", content: payload.reply },
      ]);
      
      // Update conversation state if provided
      if (payload.conversation_state) {
        setConversationState(payload.conversation_state);
      }
      
      setInsights({
        extractedSymptoms: payload.extracted_symptoms ?? null,
        diseaseReasoning: payload.disease_reasoning ?? null,
        doctorSuggestions: payload.doctor_suggestions ?? null,
        isMedicalQuery: payload.is_medical_query,
      });
    } catch (error) {
      console.error(error);
      alert("An error occurred while processing the request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="chat" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <MessageCircle className="w-4 h-4 mr-2" />
            AI Health Assistant
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
            Chat with Our <span className="text-primary">AI Assistant</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Get instant health insights and guidance from our AI-powered assistant. Available 24/7 to help with your
            health questions.
          </p>
        </div>
        <div className="z-10 border rounded-lg max-w-5xl w-full h-full text-sm mx-auto p-4 lg:p-6 bg-card/40 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-col justify-between w-full h-full lg:flex-[2]">
              <ChatTopbar />
              <ChatList
                messages={history}
                sendMessage={handleClick}
                setMessage={setMessage}
                message={message}
                loading={loading}
              />
            </div>
            <MedicalInsightsPanel
              extractedSymptoms={insights.extractedSymptoms}
              diseaseReasoning={insights.diseaseReasoning}
              doctorSuggestions={insights.doctorSuggestions}
              isMedicalQuery={insights.isMedicalQuery}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}