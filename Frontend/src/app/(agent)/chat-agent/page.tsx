"use client";
import AgentSidebar from "@/components/agentComps/AgentSidebar";
import ChatInput from "@/components/agentComps/ChatInput";
import ChatMessage from "@/components/agentComps/ChatMessage";
import ChatTopBar from "@/components/agentComps/ChatTopBar";
import ChatWelcome from "@/components/agentComps/ChatWelcome";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatAgentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (content: string) => {
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

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Thank you for your question. I'm here to help you with your health concerns. However, please note that I'm a demonstration UI and not connected to a real AI yet. This is where the AI response would appear.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSuggestionClick = (message: string) => {
    handleSendMessage(message);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
          <ChatWelcome onSuggestionClick={handleSuggestionClick} />
        ) : (
          <ScrollArea className="flex-1">
            <div className="pb-32">
              {messages.map((message) => (
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
                  content="Thinking..."
                  timestamp={new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                />
              )}
            </div>
          </ScrollArea>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0">
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