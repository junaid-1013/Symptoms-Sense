"use client";
import {
    Activity,
    Heart,
    MessageSquarePlus,
    Pill,
    Stethoscope,
    Sparkles
} from "lucide-react";
import SuggestionCard from "./SuggestionCard";
import { motion } from "framer-motion";

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
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <div className="max-w-3xl w-full space-y-8">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-4"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-4 border border-primary/20"
                    >
                        <Sparkles className="h-10 w-10 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Welcome to Symptoms Sense AI
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Your intelligent health assistant. Ask me anything about your health concerns, 
                        find doctors, or get personalized medical advice.
                    </p>
                </motion.div>

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((suggestion, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                        >
                            <SuggestionCard
                                icon={suggestion.icon}
                                title={suggestion.title}
                                description={suggestion.description}
                                onClick={() => onSuggestionClick(suggestion.message)}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Disclaimer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="text-center"
                >
                    <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        <strong className="text-foreground">Disclaimer:</strong> This AI assistant provides general health information
                        and is not a substitute for professional medical advice, diagnosis, or treatment.
                        Always seek the advice of your physician or other qualified health provider.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default ChatWelcome;
