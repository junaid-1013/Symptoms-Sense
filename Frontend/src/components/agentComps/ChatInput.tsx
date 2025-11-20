"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";
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
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
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

    // Focus textarea when not loading
    useEffect(() => {
        if (!isLoading && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isLoading]);

    return (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
                <form onSubmit={handleSubmit} className="relative">
                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything about your health..."
                            disabled={disabled || isLoading}
                            className={`
                                min-h-[60px] max-h-[200px] pr-14 resize-none 
                                focus-visible:ring-2 focus-visible:ring-primary/20
                                transition-all duration-200
                                border-2
                                ${message.trim() ? 'border-primary/30' : 'border-border'}
                            `}
                            rows={1}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!message.trim() || disabled || isLoading}
                            className={`
                                absolute bottom-2 right-2 h-9 w-9 rounded-lg
                                transition-all duration-200
                                ${message.trim() 
                                    ? 'bg-primary hover:bg-primary/90 shadow-md shadow-primary/20' 
                                    : 'bg-muted hover:bg-muted/80'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    
                    {/* Helper text */}
                    <div className="flex items-center justify-between mt-2 px-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI can make mistakes. Consider checking important information.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-xs">Shift+Enter</kbd> for new line
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatInput;
