"use client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SuggestionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

const SuggestionCard = ({ icon, title, description, onClick }: SuggestionCardProps) => {
    return (
        <Card
            className={cn(
                "p-5 cursor-pointer transition-all duration-300 group",
                "hover:bg-accent hover:shadow-lg hover:shadow-primary/10",
                "border-2 hover:border-primary/20",
                "hover:scale-[1.02] active:scale-[0.98]"
            )}
            onClick={onClick}
        >
            <div className="flex items-start gap-4">
                <div className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    "bg-primary/10 text-primary",
                    "group-hover:bg-primary group-hover:text-primary-foreground",
                    "group-hover:scale-110 group-hover:rotate-3",
                    "shadow-sm group-hover:shadow-md"
                )}>
                    {icon}
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default SuggestionCard;
