"use client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    Edit,
    MoreHorizontal,
    PenSquare,
    Share2,
    Trash2
} from "lucide-react";
import { useState } from "react";

interface ChatHistory {
    id: string;
    title: string;
    timestamp: string;
    date: string;
}

interface AgentSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const AgentSidebar = ({ isOpen, onToggle }: AgentSidebarProps) => {
    const [chatHistory] = useState<ChatHistory[]>([
        {
            id: "1",
            title: "What are the symptoms of high blood pressure?",
            timestamp: "10:30 AM",
            date: "Today",
        },
        {
            id: "2",
            title: "How to manage diabetes effectively?",
            timestamp: "Yesterday",
            date: "Yesterday",
        },
        {
            id: "3",
            title: "Common side effects of antibiotics",
            timestamp: "2 days ago",
            date: "Previous 7 days",
        },
        {
            id: "4",
            title: "Healthy diet for heart disease",
            timestamp: "3 days ago",
            date: "Previous 7 days",
        },
        {
            id: "5",
            title: "Symptoms of seasonal allergies",
            timestamp: "4 days ago",
            date: "Previous 7 days",
        },
        {
            id: "6",
            title: "When to see a cardiologist?",
            timestamp: "5 days ago",
            date: "Previous 7 days",
        },
    ]);

    const [activeChat, setActiveChat] = useState<string>("1");

    // Group chats by date
    const groupedChats = chatHistory.reduce((acc, chat) => {
        if (!acc[chat.date]) {
            acc[chat.date] = [];
        }
        acc[chat.date].push(chat);
        return acc;
    }, {} as Record<string, ChatHistory[]>);

    return (
        <>
            {/* Sidebar */}
            <aside
                className={cn(
                    "inset-y-0 left-0 z-40",
                    "w-64 bg-background border-r border-border",
                    "transition-all duration-200 ease-in-out",
                    // Mobile behavior
                    "fixed",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    // Desktop behavior
                    "lg:relative lg:translate-x-0",
                    !isOpen && "lg:w-0 lg:border-0 lg:overflow-hidden"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-2 border-b border-border">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start gap-2 h-9 px-2"
                            onClick={() => console.log("New chat")}
                        >
                            <PenSquare className="h-4 w-4" />
                            <span className="text-sm font-medium">New Chat</span>
                        </Button>

                        {/* Toggle button for desktop */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hidden lg:flex"
                            onClick={onToggle}
                        >
                            {isOpen ? (
                                <ChevronLeft className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Chat History */}
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-6">
                            {Object.entries(groupedChats).map(([date, chats]) => (
                                <div key={date} className="space-y-0.5">
                                    {/* Date header */}
                                    <div className="px-2 py-2">
                                        <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide truncate">
                                            {date}
                                        </h3>
                                    </div>

                                    {/* Chat items */}
                                    <div className="space-y-0.5">
                                        {chats.map((chat) => (
                                            <div
                                                key={chat.id}
                                                className={cn(
                                                    "group relative flex items-start gap-1",
                                                    "rounded-lg px-2 py-2 cursor-pointer",
                                                    "transition-colors duration-150",
                                                    activeChat === chat.id
                                                        ? "bg-accent text-accent-foreground"
                                                        : "hover:bg-accent/50"
                                                )}
                                                onClick={() => setActiveChat(chat.id)}
                                            >
                                                {/* Chat title */}
                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <p className="text-sm leading-snug line-clamp-2 break-words">
                                                        {chat.title}
                                                    </p>
                                                </div>

                                                {/* Dropdown menu */}
                                                <div className="flex-shrink-0 ml-1">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn(
                                                                    "h-6 w-6",
                                                                    "opacity-0 group-hover:opacity-100",
                                                                    activeChat === chat.id && "opacity-100",
                                                                    "transition-opacity duration-150",
                                                                    "hover:bg-accent-foreground/10"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Rename chat", chat.id);
                                                                }}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Rename
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Share chat", chat.id);
                                                                }}
                                                            >
                                                                <Share2 className="mr-2 h-4 w-4" />
                                                                Share
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    console.log("Delete chat", chat.id);
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={onToggle}
                />
            )}
        </>
    );
};

export default AgentSidebar;