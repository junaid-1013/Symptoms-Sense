"use client";
import { CalendarCheck, Pill, Sparkles, Stethoscope, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";

interface ChatWelcomeProps {
    onSuggestionClick: (message: string) => void;
}

const actions = [
    {
        icon: HeartPulse,
        title: "Check my symptoms",
        hint: "Describe what you feel and get pointed to the right specialist",
        message: "I'd like to check some symptoms I've been having.",
    },
    {
        icon: Stethoscope,
        title: "Find a doctor",
        hint: "Search by specialty or city and see open times",
        message: "I need help finding a doctor.",
    },
    {
        icon: CalendarCheck,
        title: "My appointments",
        hint: "View, reschedule or cancel what you've booked",
        message: "Show my appointments.",
    },
    {
        icon: Pill,
        title: "Set a medicine reminder",
        hint: "Get an email at the right time, on the days you choose",
        message: "I want to set a medicine reminder.",
    },
];

const ChatWelcome = ({ onSuggestionClick }: ChatWelcomeProps) => (
    <div className="flex min-h-full items-start justify-center px-4 py-8 lg:items-center lg:p-6">
        <div className="w-full max-w-2xl space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3 text-center"
            >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="h-7 w-7" aria-hidden />
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How can I help today?</h1>
                <p className="mx-auto max-w-md text-muted-foreground">
                    Tell me what&apos;s going on, or pick something to start with. I can find doctors, book appointments and set reminders for you.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {actions.map(({ icon: Icon, title, hint, message }, index) => (
                    <motion.button
                        key={title}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.06, duration: 0.3 }}
                        onClick={() => onSuggestionClick(message)}
                        className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                        <span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
                        <span>
                            <span className="block text-sm font-semibold">{title}</span>
                            <span className="block text-sm text-muted-foreground">{hint}</span>
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    </div>
);

export default ChatWelcome;
