"use client";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { ChatList } from "./chat-list";
import ChatTopbar from "./chat-topbar";

export interface Message {
  role: "user" | "assistant";
  content: string;
  links?: string[];
};

export function Chat() {
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello there! I am your AI medical assistant. Tell me how are you feeling?",
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const handleClick = async () => {
    if (message === "") return;

    setHistory((oldHistory) => [
      ...oldHistory,
      { role: "user", content: message },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/chatapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: message, history: history }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from server");
      }

      const result = await response.json();
      console.log("result", result.data);

      setHistory((oldHistory: any) => [
        ...oldHistory,
        { role: "assistant", content: result.data },
      ]);
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("An error occurred while processing the request");
    }
  };
  console.log("this is the history", history);

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
        <div className="z-10 border rounded-lg max-w-5xl w-full h-full text-sm lg:flex mx-auto">
          <div className="flex flex-col justify-between w-full h-full">
            <ChatTopbar />
            <ChatList
              messages={history}
              sendMessage={handleClick}
              setMessage={setMessage}
              message={message}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}