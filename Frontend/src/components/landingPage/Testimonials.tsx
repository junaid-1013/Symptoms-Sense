"use client"
import { TestimonialSkeleton } from "@/components/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { GetFeedbackApi } from "@/endPoints/feedback.endPoints"
import { Quote, Star } from "lucide-react"
import { useEffect, useState } from "react"

interface Testimonial {
    name: string
    message: string
    image?: string
    rating?: number
}

export default function Testimonials({ refreshKey = 0 }: { refreshKey?: number }) {
    const [loading, setLoading] = useState(true)
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const { toast } = useToast();

    useEffect(() => {
        let cancelled = false;
        const fetchTestimonials = async () => {
            try {
                const response = await GetFeedbackApi(6)
                if (!cancelled) setTestimonials(response.data.data.feedbacks ?? [])
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
        <section id="feedback" className="py-20 bg-background">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">
                        <Star className="w-4 h-4 mr-2" />
                        Testimonials
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
                        Trusted by Healthcare <span className="text-primary">Professionals</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                        Read what healthcare providers and patients say about our AI-powered platform
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <TestimonialSkeleton key={i} />)
                        : testimonials.map((testimonial, index) => (
                            <Card key={index} className="bg-card border-border hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {/* Quote Icon */}
                                        <Quote className="w-8 h-8 text-primary/20" />

                                        {/* Rating */}
                                        <div className="flex gap-1">
                                            {Array.from({ length: testimonial.rating ?? 5 }).map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>

                                        {/* Message */}
                                        <p className="text-muted-foreground text-pretty">&quot;{testimonial.message}&quot;</p>

                                        {/* Author */}
                                        <div className="flex items-center gap-3 pt-4 border-t border-border">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={testimonial.image || "/user.png"}
                                                alt={testimonial.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <div className="font-semibold text-sm">{testimonial.name}</div>
                                                <div className="text-xs text-muted-foreground">Verified User</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </div>
        </section>
    )
}
