"use client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";

type DropdownItem =
    | { type: "item"; key: string; children: ReactNode; onClick?: () => void; asChild?: boolean; href?: string }
    | { type: "separator"; key: string }
    | { type: "label"; key: string; children: ReactNode };

interface AppDropdownProps {
    trigger: ReactNode;
    items: DropdownItem[];
    align?: "start" | "center" | "end";
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function AppDropdown({ trigger, items, align = "end", className = "", open, onOpenChange }: AppDropdownProps) {
    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align={align} className={className || "w-56 bg-white"}>
                {items.map((item) => {
                    if (item.type === "separator") return <DropdownMenuSeparator key={item.key} />;
                    if (item.type === "label") return (
                        <DropdownMenuLabel key={item.key}>{item.children}</DropdownMenuLabel>
                    );
                    const content = item.href ? (
                        <a href={item.href} onClick={item.onClick} className="cursor-pointer">
                            {item.children}
                        </a>
                    ) : (
                        <span onClick={item.onClick} className="cursor-pointer">
                            {item.children}
                        </span>
                    );
                    return (
                        <DropdownMenuItem key={item.key} asChild={Boolean(item.asChild)}>
                            {content}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}