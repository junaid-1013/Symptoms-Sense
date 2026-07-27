"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { PostDoctorReviewApi } from "@/endPoints/doctor.endPoints";
import { PostFeedbackApi } from "@/endPoints/feedback.endPoints";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";

interface RatingFormProps {
    doctorId?: string;
    onSubmitted?: () => void;
}

export default function RatingForm({ doctorId, onSubmitted }: RatingFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const messageId = useId();
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(1);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;
        const text = message.trim();
        if (text.length < 10 || text.length > 200) {
            toast({ title: "Check your review", description: "Please write between 10 and 200 characters.", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            if (doctorId) {
                await PostDoctorReviewApi({ doctor_id: doctorId, rating, review: text });
            } else {
                await PostFeedbackApi({ rating, message: text });
            }
            setOpen(false);
            setMessage("");
            setRating(1);
            toast({ title: "Success!", description: "Thank you for sharing your feedback" });
            onSubmitted?.();
            if (doctorId) router.push(`/doctorDetail?id=${encodeURIComponent(doctorId)}`);
        } catch (error: any) {
            toast({
                title: "Failed!",
                description: error?.response?.data?.message || "Could not submit your feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(value) => { if (!submitting) setOpen(value); }}>
            <div className="flex justify-center">
                <DialogTrigger asChild>
                    <Button className="gap-2"><Star className="h-4 w-4" aria-hidden="true" />Rate</Button>
                </DialogTrigger>
            </div>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rate your experience</DialogTitle>
                    <DialogDescription>{doctorId ? "Share your experience with this doctor." : "Tell us about your experience with Symptoms Sense."}</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <fieldset disabled={submitting} className="space-y-2">
                        <legend className="text-sm font-medium">Rating</legend>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button key={value} type="button" aria-label={`${value} ${value === 1 ? "star" : "stars"}`} aria-pressed={rating === value}
                                    onClick={() => setRating(value)} className="rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                                    <Star aria-hidden="true" className={`h-6 w-6 ${value <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    <div className="space-y-2">
                        <label htmlFor={messageId} className="text-sm font-medium">Your review</label>
                        <Textarea id={messageId} required minLength={10} maxLength={200} disabled={submitting}
                            value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write 10–200 characters" />
                    </div>
                    <SpinnerButton state={submitting} disabled={submitting} aria-busy={submitting}
                        aria-label={submitting ? "Submitting review" : "Submit review"} name="Submit" type="submit" />
                </form>
            </DialogContent>
        </Dialog>
    );
}
