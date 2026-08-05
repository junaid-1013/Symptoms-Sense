"use client"
import TestimonialCard, { Testimonial } from "@/components/landingPage/TestimonialCard"
import { TestimonialSkeleton } from "@/components/skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { GetFeedbackApi } from "@/endPoints/feedback.endPoints"
import { ArrowRight, Star } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

// Home page shows a taster: 2 on phones, 4 on tablets, 6 on laptops. The rest live on /testimonials.
const VISIBILITY = ["", "", "hidden md:block", "hidden md:block", "hidden lg:block", "hidden lg:block"]

export default function Testimonials({ refreshKey = 0 }: { refreshKey?: number }) {
    const [loading, setLoading] = useState(true)
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [total, setTotal] = useState(0)
    const { toast } = useToast();

    useEffect(() => {
        let cancelled = false;
        const fetchTestimonials = async () => {
            try {
                const response = await GetFeedbackApi(VISIBILITY.length)
                if (cancelled) return
                setTestimonials(response.data.data.feedbacks ?? [])
                setTotal(response.data.data.total ?? 0)
            } catch (error) {
                if (cancelled) return;
                console.error("Failed to fetch testimonials:", error)
                toast({
                    title: "Failed!",
                    description: "Failed to fetch testimonials",
                    variant: "destructive",
                })
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchTestimonials()
        return () => { cancelled = true; }
    }, [refreshKey, toast])

    return (
        <section id="feedback" className="py-14 md:py-20 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10 md:mb-16">
                    <Badge variant="outline" className="mb-4">
                        <Star className="w-4 h-4 mr-2" />
                        Testimonials
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
                        What people say about <span className="text-primary">Symptoms Sense</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                        Read feedback shared by people using the platform.
                    </p>
                </div>

                {!loading && testimonials.length === 0 && (
                    <p className="text-center text-muted-foreground">No feedback yet. Be the first to share your experience.</p>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={VISIBILITY[i]}><TestimonialSkeleton /></div>
                        ))
                        : testimonials.slice(0, VISIBILITY.length).map((testimonial, index) => (
                            <div key={testimonial.id ?? index} className={VISIBILITY[index]}>
                                <TestimonialCard testimonial={testimonial} />
                            </div>
                        ))}
                </div>

                {!loading && total > 2 && (
                    <div className="mt-10 text-center">
                        <Button asChild variant="outline" size="lg">
                            <Link href="/testimonials">
                                See all {total} reviews
                                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    )
}
