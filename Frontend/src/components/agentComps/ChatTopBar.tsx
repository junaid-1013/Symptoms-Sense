"use client";
import UserMenu from "@/components/common/UserMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contextApis/UserContext";
import { ArrowLeft, Menu, Sparkles } from "lucide-react";

interface ChatTopBarProps {
    onMenuClick: () => void;
    sidebarOpen: boolean;
    onBack?: () => void;
}

const ChatTopBar = ({ onMenuClick, sidebarOpen, onBack }: ChatTopBarProps) => {
    const { user } = useUser();

    return (
        <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
                {/* Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={sidebarOpen ? "lg:hidden" : ""}
                    onClick={onMenuClick}
                    aria-label="Toggle chat history"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to home">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}

                {/* Logo/Brand */}
                <div className="flex items-center gap-2 font-semibold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline-block">Symptoms Sense AI</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right Side - User Menu */}
                <UserMenu
                    trigger={
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user?.avatar_url || ""} alt={user?.name || "User"} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    }
                />
            </div>
        </header>
    );
};

export default ChatTopBar;