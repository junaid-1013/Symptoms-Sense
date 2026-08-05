"use client"
import TestimonialCard, { Testimonial } from "@/components/landingPage/TestimonialCard"
import { TestimonialSkeleton } from "@/components/skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { GetFeedbackApi } from "@/endPoints/feedback.endPoints"
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

const PAGE_SIZE = 12

export default function TestimonialsPage() {
    const [items, setItems] = useState<Testimonial[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const { toast } = useToast()

    const load = useCallback(async (offset: number) => {
        try {
            const response = await GetFeedbackApi(PAGE_SIZE, offset)
            const data = response.data.data
            setItems((prev) => (offset === 0 ? data.feedbacks : [...prev, ...data.feedbacks]))
            setTotal(data.total ?? 0)
        } catch (error) {
            console.error("Failed to fetch testimonials:", error)
            toast({ title: "Could not load reviews", description: "Please try again.", variant: "destructive" })
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [toast])

    useEffect(() => { load(0) }, [load])

    return (
        <section className="py-14 md:py-20 bg-background min-h-screen">
            <div className="container mx-auto px-4">
                <Link href="/#feedback" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" aria-hidden /> Back to home
                </Link>
                <div className="text-center mb-10 md:mb-14">
                    <Badge variant="outline" className="mb-4"><Star className="w-4 h-4 mr-2" />Reviews</Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-balance mb-4">
                        What people say about <span className="text-primary">Symptoms Sense</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                        {total > 0 ? `${total} reviews from people using the platform.` : "Feedback shared by people using the platform."}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <TestimonialSkeleton key={i} />)
                        : items.map((testimonial, index) => <TestimonialCard key={testimonial.id ?? index} testimonial={testimonial} />)}
                </div>

                {!loading && items.length === 0 && (
                    <p className="text-center text-muted-foreground">No feedback yet.</p>
                )}

                {!loading && items.length < total && (
                    <div className="mt-10 text-center">
                        <Button
                            variant="outline" size="lg" disabled={loadingMore}
                            onClick={() => { setLoadingMore(true); load(items.length) }}
                        >
                            {loadingMore ? "Loading…" : `Show more (${total - items.length} left)`}
                        </Button>
                    </div>
                )}
            </div>
        </section>
    )
}
