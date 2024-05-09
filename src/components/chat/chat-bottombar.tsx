import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  SendHorizontal,
  Square
} from "lucide-react";
import React, { useRef, useState } from "react";

export default function ChatBottombar({ sendMessage, setMessage, message, loading }: any) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };
  const handleSend = () => {
    sendMessage();
    setMessage("");

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      setMessage((prev: any) => prev + "\n");
    }
  };

  const startListening = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setMessage(text);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="p-2 flex justify-between w-full items-center gap-2">
      <Button onClick={startListening} variant={"ghost"} className="relative">
        {isListening ? (
          <>
            <Square size={12} strokeWidth={"3px"} className="text-red-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-[3px] border-y-transparent border-r-transparent border-red-500 animate-spin"></div>
            </div>
          </>
        ) : (
          <Mic size={20} className="text-muted-foreground" />
        )}
      </Button>
      <Textarea
        autoComplete="off"
        value={message}
        ref={inputRef}
        onKeyDown={handleKeyPress}
        onChange={handleInputChange}
        name="message"
        placeholder="Type a message"
        className="w-full border rounded-full flex items-center !h-9 resize-none overflow-hidden bg-background"
      ></Textarea>
      <Button
        variant={"ghost"}
        size={"icon"}
        className="h-9 w-9 shrink-0"
        onClick={handleSend}
        disabled={isListening || loading}
      >
        <SendHorizontal size={20} className="text-muted-foreground" />
      </Button>
    </div>
  );
}
