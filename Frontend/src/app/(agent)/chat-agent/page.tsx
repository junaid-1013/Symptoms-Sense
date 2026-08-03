"use client";
import AgentSidebar, { SavedConversationSummary } from "@/components/agentComps/AgentSidebar";
import ChatInput from "@/components/agentComps/ChatInput";
import ChatMessage from "@/components/agentComps/ChatMessage";
import ChatTopBar from "@/components/agentComps/ChatTopBar";
import ChatWelcome from "@/components/agentComps/ChatWelcome";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contextApis/UserContext";
import { useRouter } from "next/navigation";
import { MedicalInsightsPanel } from "@/components/agentComps/medical-insights-panel";
import {
  MedicalChatApiResponse,
  ConversationState,
  SymptomExtractionPayload,
  DiseaseReasoningPayload,
  DoctorSuggestionResult,
  ChatCard,
} from "@/types/medicalChat";
import { CardHandlers } from "@/components/agentComps/ChatCards";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  ChatActionApi, DeleteConversationApi, GetConversationApi, ListConversationsApi, SendChatMessageApi,
} from "@/endPoints/medicalChat.endPoints";



interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  cards?: ChatCard[];
  /** Set on error replies: the text of the user message that can be retried. */
  retryOf?: string;
}

interface SavedConversation extends SavedConversationSummary {
  messages: Array<{ id: string; role: "user" | "assistant"; content: string; created_at: string; cards?: ChatCard[] }>;
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
  const { tokens, user } = useUser();
  const { toast } = useToast();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(true);
  // Phones start with insights collapsed so the conversation keeps the screen.
  useEffect(() => { if (window.innerWidth < 1024) setInsightsOpen(false); }, []);
  const [loadingLabel, setLoadingLabel] = useState("Thinking…");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const accessToken = tokens?.accessToken;

  const refreshConversations = useCallback(async () => {
    if (!accessToken) return [];
    const response = await ListConversationsApi();
    const items: SavedConversationSummary[] = response.data.data ?? [];
    setConversations(items);
    return items;
  }, [accessToken]);

  const openConversation = useCallback(async (id: string) => {
    if (!accessToken || isLoading) return;
    const response = await GetConversationApi(id);
    const item: SavedConversation = response.data.data;
    setActiveId(item.id);
    setMessages(item.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      cards: message.cards ?? [],
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
  }, [accessToken, isLoading]);

  useEffect(() => {
    if (!accessToken) {
      setConversations([]);
      return;
    }
    let cancelled = false;
    ListConversationsApi()
      .then((response) => {
        if (!cancelled) {
          setConversations(response.data.data ?? []);
          if (window.innerWidth >= 1024) setSidebarOpen(true);
        }
      }).catch((error) => console.error(error));
    return () => { cancelled = true; };
  }, [accessToken]);

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
    try {
      await DeleteConversationApi(id);
    } catch {
      toast({ title: "Could not delete the conversation", variant: "destructive" });
      return;
    }
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

  // Long answers (symptom checks) can take 10-20s; say what is happening instead of bare dots.
  useEffect(() => {
    if (!isLoading) { setLoadingLabel("Thinking…"); return; }
    const timers = [
      setTimeout(() => setLoadingLabel("Looking up doctors and availability…"), 4000),
      setTimeout(() => setLoadingLabel("Almost there…"), 12000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  const hasInsights = Boolean(insights.diseaseReasoning || insights.extractedSymptoms?.symptoms?.length);
  const riskLevel = insights.diseaseReasoning?.risk_level;
  const urgency = insights.doctorSuggestions?.urgency_level;

  const lastMessage = messages[messages.length - 1];
  const quickReplies: string[] = (() => {
    if (isLoading || !lastMessage || lastMessage.role !== "assistant" || lastMessage.retryOf) return [];
    const types = new Set((lastMessage.cards ?? []).map((c) => c.type));
    if (types.has("appointment_created")) return ["Remind me before it", "Show my appointments"];
    if (types.has("reminder_created")) return ["Show my reminders", "Add another reminder"];
    if (types.has("appointment_cancelled")) return ["Book a new appointment"];
    if (types.has("urgent_notice")) return [];
    if (types.has("doctor_list")) return ["Which of them has the earliest opening?"];
    return [];
  })();

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

      const response = await SendChatMessageApi(requestBody);
      const result = response.data;
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
        cards: payload.cards ?? [],
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
      // Keep the last assessment on screen unless this turn produced a new one.
      if (payload.disease_reasoning || payload.extracted_symptoms?.symptoms?.length) {
        setInsights({
          extractedSymptoms: payload.extracted_symptoms ?? null,
          diseaseReasoning: payload.disease_reasoning ?? null,
          doctorSuggestions: payload.doctor_suggestions ?? null,
          isMedicalQuery: payload.is_medical_query,
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong on my side. Please try again.",
        retryOf: content,
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

  const updateCardStatus = (actionId: string, status: "pending" | "confirmed" | "dismissed" | "failed") =>
    setMessages((prev) => prev.map((m) => m.cards?.some((c) => "action_id" in c && c.action_id === actionId)
      ? { ...m, cards: m.cards.map((c) => ("action_id" in c && c.action_id === actionId ? { ...c, status } : c)) }
      : m));

  const callAction = async (actionId: string, verb: "confirm" | "dismiss") => {
    if (!accessToken || !activeId) return null;
    try {
      const response = await ChatActionApi(activeId, actionId, verb);
      return response.data.data;
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      throw new Error(detail?.detail || detail?.message || "Request failed");
    }
  };

  const handleConfirm = async (actionId: string) => {
    setBusyActionId(actionId);
    try {
      const data = await callAction(actionId, "confirm");
      if (!data) return;
      updateCardStatus(actionId, "confirmed");
      setMessages((prev) => [...prev, {
        id: data.id, role: "assistant", content: data.reply, cards: data.cards ?? [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      if (data.conversation_state) setConversationState(data.conversation_state);
    } catch (error) {
      updateCardStatus(actionId, "failed");
      toast({ title: "Could not complete that", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDismiss = async (actionId: string) => {
    setBusyActionId(actionId);
    try {
      const data = await callAction(actionId, "dismiss");
      updateCardStatus(actionId, "dismissed");
      if (data?.conversation_state) setConversationState(data.conversation_state);
    } catch (error) {
      toast({ title: "Could not dismiss", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setBusyActionId(null);
    }
  };

  const cardHandlers: CardHandlers = {
    onSend: (text) => { handleSendMessage(text); },
    onConfirm: handleConfirm,
    onDismiss: handleDismiss,
    busyActionId,
    disabled: isLoading,
  };

  const handleRetry = (errorMessageId: string, text: string) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === errorMessageId);
      return index > 0 ? prev.slice(0, index - 1) : prev;
    });
    handleSendMessage(text);
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
        onDelete={(id) => setPendingDelete(id)}
        signedIn={Boolean(accessToken)}
      />

      {/* Main Chat Area */}
     <main className="flex flex-1 overflow-hidden relative">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background lg:flex-[2] lg:border-r">
        {/* Top Bar */}
        <ChatTopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onBack={() => router.push("/")}
        />
        {hasInsights && (
          <div className="flex items-center justify-between gap-3 border-b bg-card/40 px-4 py-2">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="font-medium">Health insights</span>
              {(urgency || riskLevel) && (
                <span className="truncate rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                  {urgency ?? riskLevel} {urgency ? "urgency" : "risk"}
                </span>
              )}
            </div>
            <Button
              variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs"
              aria-expanded={insightsOpen}
              onClick={() => setInsightsOpen((open) => !open)}
            >
              {insightsOpen ? "Hide" : "Show"}
              {insightsOpen ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
            </Button>
          </div>
        )}
        {hasInsights && insightsOpen && (
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
          <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 [&>[data-radix-scroll-area-viewport]>div]:!block">
            <div className="min-h-full pb-4">
              <div className="max-w-4xl mx-auto space-y-1" role="log" aria-live="polite" aria-label="Conversation">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    cards={message.cards}
                    cardHandlers={cardHandlers}
                    userName={user?.name}
                    userAvatar={user?.avatar_url}
                    onRetry={message.retryOf && index === messages.length - 1 && !isLoading
                      ? () => handleRetry(message.id, message.retryOf as string) : undefined}
                  />
                ))}
                {isLoading && (
                  <ChatMessage
                    role="assistant"
                    content=""
                    isTyping={true}
                    typingLabel={loadingLabel}
                  />
                )}
                {quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pb-2 sm:px-6 sm:pl-[4.75rem]">
                    {quickReplies.map((reply) => (
                      <Button key={reply} size="sm" variant="outline" className="rounded-full" onClick={() => handleSendMessage(reply)}>
                        {reply}
                      </Button>
                    ))}
                  </div>
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
        {hasInsights && insightsOpen && (
        <div className="hidden min-w-0 flex-[1] overflow-y-auto border-l bg-card/40 backdrop-blur lg:block">
          <MedicalInsightsPanel
            extractedSymptoms={insights.extractedSymptoms}
            diseaseReasoning={insights.diseaseReasoning}
            doctorSuggestions={insights.doctorSuggestions}
            isMedicalQuery={insights.isMedicalQuery}
            loading={isLoading}
          />
        </div>
        )}
      </main>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              The conversation and its messages will be removed. Appointments and reminders you made stay as they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingDelete) handleDeleteConversation(pendingDelete).catch(console.error);
              setPendingDelete(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
