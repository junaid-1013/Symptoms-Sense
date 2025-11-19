"use client";
import {
    Activity,
    Heart,
    MessageSquarePlus,
    Pill,
    Stethoscope
} from "lucide-react";
import SuggestionCard from "./SuggestionCard";

interface ChatWelcomeProps {
    onSuggestionClick: (message: string) => void;
}

const ChatWelcome = ({ onSuggestionClick }: ChatWelcomeProps) => {
    const suggestions = [
        {
            icon: <Heart className="h-5 w-5" />,
            title: "Symptom Check",
            description: "Tell me about your symptoms and I'll help you understand them",
            message: "I'm experiencing some symptoms and would like to understand what they might mean."
        },
        {
            icon: <Activity className="h-5 w-5" />,
            title: "Health Advice",
            description: "Get personalized health and wellness recommendations",
            message: "Can you give me some general health and wellness advice?"
        },
        {
            icon: <Stethoscope className="h-5 w-5" />,
            title: "Find a Doctor",
            description: "Help me find the right specialist for my condition",
            message: "I need help finding the right doctor for my condition."
        },
        {
            icon: <Pill className="h-5 w-5" />,
            title: "Medication Info",
            description: "Learn about medications, dosages, and side effects",
            message: "I have questions about my medication and how to take it."
        },
    ];

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-3xl w-full space-y-8">
                {/* Welcome Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <MessageSquarePlus className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome to Symptoms Sense AI
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Your intelligent health assistant. Ask me anything about your health concerns.
                    </p>
                </div>

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((suggestion, index) => (
                        <SuggestionCard
                            key={index}
                            icon={suggestion.icon}
                            title={suggestion.title}
                            description={suggestion.description}
                            onClick={() => onSuggestionClick(suggestion.message)}
                        />
                    ))}
                </div>

                {/* Disclaimer */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                        <strong>Disclaimer:</strong> This AI assistant provides general health information
                        and is not a substitute for professional medical advice, diagnosis, or treatment.
                        Always seek the advice of your physician or other qualified health provider.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatWelcome;