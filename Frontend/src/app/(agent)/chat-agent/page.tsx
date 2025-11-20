"use client";
import AgentSidebar from "@/components/agentComps/AgentSidebar";
import ChatInput from "@/components/agentComps/ChatInput";
import ChatMessage from "@/components/agentComps/ChatMessage";
import ChatTopBar from "@/components/agentComps/ChatTopBar";
import ChatWelcome from "@/components/agentComps/ChatWelcome";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/contextApis/UserContext";
import { MedicalChatApiResponse, ConversationState } from "@/types/medicalChat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatAgentPage() {
  const { tokens } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

      // Add current user message to history
      history.push({
        role: "user",
        content: content
      });

      // Prepare request body with conversation state
      const requestBody: any = {
        query: content,
        history: history,
      };
      
      // Include conversation state if available
      if (conversationState) {
        requestBody.conversation_state = conversationState;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
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
      {/* Sidebar */}
      <AgentSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <ChatTopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Chat Content */}
        {messages.length === 0 ? (
          <div className="flex-1 overflow-hidden">
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
      </main>
    </div>
  );
}
