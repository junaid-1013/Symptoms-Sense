"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

const ChatInput = ({ onSendMessage, disabled, isLoading }: ChatInputProps) => {
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled && !isLoading) {
            onSendMessage(message.trim());
            setMessage("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [message]);

    return (
        <div className="border-t border-border bg-background">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
                <form onSubmit={handleSubmit} className="relative">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything about your health..."
                        disabled={disabled || isLoading}
                        className="min-h-[60px] max-h-[200px] pr-12 resize-none focus-visible:ring-1"
                        rows={1}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!message.trim() || disabled || isLoading}
                        className="absolute bottom-2 right-2 h-8 w-8"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-3">
                    AI can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    );
};

export default ChatInput;