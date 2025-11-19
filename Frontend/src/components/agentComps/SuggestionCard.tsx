"use client";
import { Card } from "@/components/ui/card";

interface SuggestionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

const SuggestionCard = ({ icon, title, description, onClick }: SuggestionCardProps) => {
    return (
        <Card
            className="p-4 cursor-pointer hover:bg-accent transition-colors duration-200 group"
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{title}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
        </Card>
    );
};

export default SuggestionCard;