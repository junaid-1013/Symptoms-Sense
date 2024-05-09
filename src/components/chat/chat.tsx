"use client";
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
    <main className="flex h-[calc(100dvh)] flex-col items-center justify-center p-4 md:px-24 pt-12 gap-4 gap-y-12">
      <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Symptoms Sense AI Bot
      </h2>
      <div className="z-10 border rounded-lg max-w-5xl w-full h-full text-sm lg:flex">
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
    </main>
  );
}