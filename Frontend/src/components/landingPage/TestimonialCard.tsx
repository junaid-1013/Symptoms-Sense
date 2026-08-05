import { Card, CardContent } from "@/components/ui/card"
import { Quote, Star } from "lucide-react"

export interface Testimonial {
    id?: string
    name: string
    message: string
    image?: string | null
    rating?: number | null
}

export default function TestimonialCard({ testimonial, className }: { testimonial: Testimonial; className?: string }) {
    const rating = testimonial.rating ?? 5
    return (
        <Card className={`bg-card border-border hover:shadow-md transition-shadow h-full ${className ?? ""}`}>
            <CardContent className="p-6 flex h-full flex-col gap-4">
                <Quote className="w-8 h-8 text-primary/20" aria-hidden />
                <div className="flex gap-1" role="img" aria-label={`${rating} out of 5 stars`}>
                    {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden />
                    ))}
                </div>
                <p className="text-muted-foreground text-pretty flex-1">&quot;{testimonial.message}&quot;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={testimonial.image || "/user.png"}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover object-top"
                    />
                    <div>
                        <div className="font-semibold text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">Patient</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
