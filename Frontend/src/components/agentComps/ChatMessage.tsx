"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

const ChatMessage = ({ role, content, timestamp }: ChatMessageProps) => {
    const isUser = role === "user";

    return (
        <div
            className={cn(
                "group w-full border-b border-border/40 py-6 px-4 sm:px-6",
                isUser ? "bg-background" : "bg-muted/30"
            )}
        >
            <div className="max-w-4xl mx-auto flex gap-4">
                {/* Avatar */}
                <Avatar className={cn(
                    "h-8 w-8 flex-shrink-0",
                    !isUser && "bg-primary"
                )}>
                    {isUser ? (
                        <>
                            <AvatarImage src="/user-avatar.png" alt="User" />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </>
                    ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-5 w-5" />
                        </AvatarFallback>
                    )}
                </Avatar>

                {/* Content */}
                <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                            {isUser ? "You" : "AI Assistant"}
                        </span>
                        {timestamp && (
                            <span className="text-xs text-muted-foreground">{timestamp}</span>
                        )}
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {content}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;