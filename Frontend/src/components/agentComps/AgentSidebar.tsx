"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronLeft, PenSquare, Trash2 } from "lucide-react";

export interface SavedConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}
interface AgentSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: SavedConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  signedIn: boolean;
}

export default function AgentSidebar({
  isOpen, onToggle, conversations, activeId, onSelect, onNew, onDelete, signedIn,
}: AgentSidebarProps) {
  return (
    <>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-background transition-transform lg:relative lg:z-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:hidden",
      )}>
        <div className="flex items-center gap-2 border-b p-3">
          <Button variant="outline" className="flex-1 justify-start gap-2" onClick={onNew}>
            <PenSquare className="h-4 w-4" /> New chat
          </Button>
          <Button variant="ghost" size="icon" aria-label="Close chat history" onClick={onToggle}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {conversations.length ? conversations.map((conversation) => (
            <div key={conversation.id} className={cn(
              "group mb-1 flex items-center rounded-lg transition-colors",
              activeId === conversation.id ? "bg-accent" : "hover:bg-accent/60",
            )}>
              <button
                className="min-w-0 flex-1 p-3 text-left"
                onClick={() => onSelect(conversation.id)}
                aria-current={activeId === conversation.id ? "page" : undefined}
              >
                <span className="block truncate text-sm font-medium">{conversation.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </span>
              </button>
              <Button
                variant="ghost" size="icon" className="mr-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${conversation.title}`}
                onClick={() => onDelete(conversation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )) : (
            <p className="p-4 text-sm text-muted-foreground">
              {signedIn ? "Your saved conversations will appear here." : "Sign in to save and revisit conversations."}
            </p>
          )}
        </ScrollArea>
      </aside>
      {isOpen && <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" aria-label="Close chat history" onClick={onToggle} />}
    </>
  );
}
