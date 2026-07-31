"use client";
import AgentSidebar, { SavedConversationSummary } from "@/components/agentComps/AgentSidebar";
import ChatInput from "@/components/agentComps/ChatInput";
import ChatMessage from "@/components/agentComps/ChatMessage";
import ChatTopBar from "@/components/agentComps/ChatTopBar";
import ChatWelcome from "@/components/agentComps/ChatWelcome";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/contextApis/UserContext";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MedicalInsightsPanel } from "@/components/agentComps/medical-insights-panel";
import {
  MedicalChatApiResponse,
  ConversationState,
  SymptomExtractionPayload,
  DiseaseReasoningPayload,
  DoctorSuggestionResult,
} from "@/types/medicalChat";



interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SavedConversation extends SavedConversationSummary {
  messages: Array<{ id: string; role: "user" | "assistant"; content: string; created_at: string }>;
  conversation_state: ConversationState | null;
  insights: {
    extracted_symptoms?: SymptomExtractionPayload;
    disease_reasoning?: DiseaseReasoningPayload;
    doctor_suggestions?: DoctorSuggestionResult;
    is_medical_query?: boolean;
  } | null;
}

const emptyInsights = {
  extractedSymptoms: null,
  diseaseReasoning: null,
  doctorSuggestions: null,
  isMedicalQuery: true,
};

export default function ChatAgentPage() {
  const { tokens } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileInsights, setShowMobileInsights] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<SavedConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [insights, setInsights] = useState<{
  extractedSymptoms: SymptomExtractionPayload | null;
  diseaseReasoning: DiseaseReasoningPayload | null;
  doctorSuggestions: DoctorSuggestionResult | null;
  isMedicalQuery: boolean;
}>(emptyInsights);


  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const accessToken = tokens?.accessToken;

  const refreshConversations = useCallback(async () => {
    if (!accessToken) return [];
    const response = await fetch(`${backendUrl}medical-chat/conversations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error("Could not load saved conversations");
    const payload = await response.json();
    const items: SavedConversationSummary[] = payload.data ?? [];
    setConversations(items);
    return items;
  }, [accessToken, backendUrl]);

  const openConversation = useCallback(async (id: string) => {
    if (!accessToken || isLoading) return;
    const response = await fetch(`${backendUrl}medical-chat/conversations/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error("Could not open saved conversation");
    const payload = await response.json();
    const item: SavedConversation = payload.data;
    setActiveId(item.id);
    setMessages(item.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })));
    setConversationState(item.conversation_state);
    setInsights({
      extractedSymptoms: item.insights?.extracted_symptoms ?? null,
      diseaseReasoning: item.insights?.disease_reasoning ?? null,
      doctorSuggestions: item.insights?.doctor_suggestions ?? null,
      isMedicalQuery: item.insights?.is_medical_query ?? true,
    });
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [accessToken, backendUrl, isLoading]);

  useEffect(() => {
    if (!accessToken) {
      setConversations([]);
      return;
    }
    let cancelled = false;
    fetch(`${backendUrl}medical-chat/conversations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((response) => response.ok ? response.json() : Promise.reject(new Error("History unavailable")))
      .then((payload) => {
        if (!cancelled) {
          setConversations(payload.data ?? []);
          if (window.innerWidth >= 1024) setSidebarOpen(true);
        }
      }).catch((error) => console.error(error));
    return () => { cancelled = true; };
  }, [accessToken, backendUrl]);

  const handleNewChat = () => {
    if (isLoading) return;
    setActiveId(null);
    setMessages([]);
    setConversationState(null);
    setInsights(emptyInsights);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    if (!accessToken || isLoading) return;
    if (!window.confirm("Delete this conversation and its messages?")) return;
    const response = await fetch(`${backendUrl}medical-chat/conversations/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return;
    setConversations((prev) => prev.filter((item) => item.id !== id));
    if (activeId === id) handleNewChat();
  };
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare headers with authentication
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add Authorization header if token is available
      if (tokens?.accessToken) {
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;
      }

      // Convert messages to history format (exclude id and timestamp)
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Prepare request body with conversation state
      const requestBody: {
        query: string;
        history: Array<{ role: "user" | "assistant"; content: string }>;
        conversation_state?: ConversationState;
        conversation_id?: string;
      } = {
        query: content,
        history: history,
      };
      if (activeId) requestBody.conversation_id = activeId;
      
      // Include conversation state if available
      if (conversationState) {
        requestBody.conversation_state = conversationState;
      }

      const response = await fetch(`${backendUrl}medical-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from server");
      }

      const result = await response.json();
      const payload: MedicalChatApiResponse = result.data;
      if (payload.conversation_id) {
        setActiveId(payload.conversation_id);
        refreshConversations().catch(console.error);
      }

      // Add assistant response to messages
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: payload.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      
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
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm experiencing technical difficulties. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (message: string) => {
    handleSendMessage(message);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <AgentSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => { openConversation(id).catch(console.error); }}
        onNew={handleNewChat}
        onDelete={(id) => { handleDeleteConversation(id).catch(console.error); }}
        signedIn={Boolean(accessToken)}
      />

      {/* Main Chat Area */}
     <main className="flex flex-1 overflow-hidden relative">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background lg:flex-[2] lg:border-r">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        {/* Top Bar */}
        <ChatTopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <button
          type="button"
          className="border-b px-4 py-2 text-left text-sm font-medium text-primary lg:hidden"
          aria-expanded={showMobileInsights}
          onClick={() => setShowMobileInsights((open) => !open)}
        >
          {showMobileInsights ? "Hide health insights" : "Show health insights"}
        </button>
        {showMobileInsights && (
          <div className="max-h-[40vh] overflow-y-auto border-b bg-card/40 lg:hidden">
            <MedicalInsightsPanel
              extractedSymptoms={insights.extractedSymptoms}
              diseaseReasoning={insights.diseaseReasoning}
              doctorSuggestions={insights.doctorSuggestions}
              isMedicalQuery={insights.isMedicalQuery}
              loading={isLoading}
            />
          </div>
        )}

        {/* Chat Content */}
        {messages.length === 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ChatWelcome onSuggestionClick={handleSuggestionClick} />
          </div>
        ) : (
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="min-h-full pb-4">
              <div className="max-w-4xl mx-auto space-y-1">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                ))}
                {isLoading && (
                  <ChatMessage
                    role="assistant"
                    content=""
                    isTyping={true}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0 z-10">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={false}
            isLoading={isLoading}
          />
        </div>
        </div>
        <div className="hidden min-w-0 flex-[1] overflow-y-auto border-l bg-card/40 backdrop-blur lg:block">
          <MedicalInsightsPanel
            extractedSymptoms={insights.extractedSymptoms}
            diseaseReasoning={insights.diseaseReasoning}
            doctorSuggestions={insights.doctorSuggestions}
            isMedicalQuery={insights.isMedicalQuery}
            loading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
