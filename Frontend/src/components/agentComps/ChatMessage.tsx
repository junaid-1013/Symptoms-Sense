"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Copy, Check, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ChatCards, { CardHandlers } from "@/components/agentComps/ChatCards";
import { ChatCard } from "@/types/medicalChat";
// Markdown rendering - using simple text formatting for now
// Install react-markdown if you want full markdown support: npm install react-markdown

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
    isTyping?: boolean;
    typingLabel?: string;
    cards?: ChatCard[];
    cardHandlers?: CardHandlers;
    userName?: string | null;
    userAvatar?: string | null;
    onRetry?: () => void;
}

const ChatMessage = ({ role, content, timestamp, isTyping = false, typingLabel, cards, cardHandlers, userName, userAvatar, onRetry }: ChatMessageProps) => {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const messageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fade in animation
        setIsVisible(true);
    }, []);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            ref={messageRef}
            className={cn(
                "group w-full transition-all duration-300 ease-out",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
        >
            <div className={cn(
                "max-w-4xl mx-auto px-4 sm:px-6 py-4",
                isUser ? "flex justify-end" : "flex justify-start"
            )}>
                <div className={cn(
                    "flex gap-3 min-w-0",
                    cards?.length ? "w-full max-w-[95%] sm:max-w-[85%]" : "max-w-[85%] sm:max-w-[75%]",
                    isUser && "flex-row-reverse"
                )}>
                    {/* Avatar */}
                    <Avatar className={cn(
                        "h-9 w-9 flex-shrink-0 mt-1 transition-transform duration-200 group-hover:scale-110",
                        !isUser && "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20"
                    )}>
                        {isUser ? (
                            <>
                                {userAvatar && <AvatarImage src={userAvatar} alt={userName || "You"} />}
                                <AvatarFallback className="bg-gradient-to-br from-muted to-muted/80 text-foreground border-2 border-border">
                                    {userName ? userName[0]?.toUpperCase() : <User className="h-4 w-4" />}
                                </AvatarFallback>
                            </>
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        )}
                    </Avatar>

                    {/* Message Bubble */}
                    <div className={cn(
                        "flex flex-col gap-1.5 flex-1 min-w-0",
                        isUser && "items-end"
                    )}>
                        <div className={cn(
                            "relative rounded-2xl px-4 py-3 shadow-sm transition-all duration-200",
                            "group-hover:shadow-md",
                            isUser
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted/50 text-foreground rounded-bl-md border border-border/50"
                        )}>
                            {/* Copy Button (for assistant messages) */}
                            {!isUser && !isTyping && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "absolute -top-1 -right-1 h-7 w-7 opacity-70 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100",
                                        "transition-opacity duration-200 bg-background/80 backdrop-blur-sm",
                                        "hover:bg-background border border-border shadow-sm"
                                    )}
                                    onClick={handleCopy}
                                    aria-label={copied ? "Copied" : "Copy message"}
                                >
                                    {copied ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            )}

                            {/* Content */}
                            {isTyping ? (
                                <TypingIndicator label={typingLabel} />
                            ) : (
                                <div className={cn(
                                    "text-sm leading-relaxed whitespace-pre-wrap break-words",
                                    isUser ? "text-primary-foreground" : "text-foreground"
                                )}>
                                    <FormattedText content={content} />
                                </div>
                            )}
                        </div>

                        {!isUser && !isTyping && cards && cardHandlers && (
                            <ChatCards cards={cards} handlers={cardHandlers} />
                        )}

                        {onRetry && (
                            <Button variant="outline" size="sm" className="self-start" onClick={onRetry}>Try again</Button>
                        )}

                        {/* Timestamp */}
                        {timestamp && (
                            <span className={cn(
                                "text-xs text-muted-foreground px-2",
                                isUser ? "text-right" : "text-left"
                            )}>
                                {timestamp}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple text formatter for basic markdown-like formatting
const FormattedText = ({ content }: { content: string }) => {
    // Split by double newlines for paragraphs
    const paragraphs = content.split(/\n\n+/);
    
    return (
        <div className="space-y-2">
            {paragraphs.map((para, idx) => {
                // Check for lists
                if (para.trim().startsWith('- ') || para.trim().startsWith('* ')) {
                    const items = para.split(/\n[-*]\s+/).filter(Boolean);
                    return (
                        <ul key={idx} className="list-disc list-inside space-y-1 ml-2">
                            {items.map((item, i) => (
                                <li key={i} className="ml-2"><Inline text={item.replace(/^[-*]\s+/, '')} /></li>
                            ))}
                        </ul>
                    );
                }
                
                // Check for numbered lists
                if (/^\d+\.\s/.test(para.trim())) {
                    const items = para.split(/\n\d+\.\s+/).filter(Boolean);
                    return (
                        <ol key={idx} className="list-decimal list-inside space-y-1 ml-2">
                            {items.map((item, i) => (
                                <li key={i} className="ml-2"><Inline text={item.replace(/^\d+\.\s+/, '')} /></li>
                            ))}
                        </ol>
                    );
                }
                
                // Regular paragraph with bold support
                const parts = para.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={idx} className="mb-2 last:mb-0">
                        {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
                            }
                            return <span key={i}>{part}</span>;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

// Inline **bold** inside list items
const Inline = ({ text }: { text: string }) => (
    <>
        {text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
                ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                : <span key={i}>{part}</span>
        )}
    </>
);

// Typing Indicator Component
const TypingIndicator = ({ label }: { label?: string }) => {
    return (
        <div className="flex items-center gap-2.5 py-1" role="status" aria-live="polite">
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce"
                        style={{
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: "1.4s"
                        }}
                    />
                ))}
            </div>
            {label && <span className="text-sm text-muted-foreground">{label}</span>}
        </div>
    );
};

export default ChatMessage;
