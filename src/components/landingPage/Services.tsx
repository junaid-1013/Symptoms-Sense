"use client"
import { ServiceCardSkeleton } from "@/components/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SERVICES } from "@/config/constants"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function ModernServices() {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <section id="services" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">
                        Our Services
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
                        Transforming Healthcare with <span className="text-primary">AI Innovation</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                        Comprehensive healthcare solutions powered by cutting-edge artificial intelligence to deliver personalized
                        care and expert medical guidance.
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading
                        ? Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                        : SERVICES.map((service, index) => (
                            <Card
                                key={index}
                                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card"
                            >
                                <CardContent className="p-8">
                                    <div className="text-center space-y-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <service.icon className={`w-8 h-8 ${service.color}`} />
                                            </div>
                                            <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                                                {service.badge}
                                            </Badge>
                                        </div>

                                        <h3 className="text-xl font-semibold text-balance">{service.title}</h3>

                                        <p className="text-muted-foreground text-pretty">{service.description}</p>

                                        <div className="flex items-center justify-center text-primary group-hover:text-primary/80 transition-colors">
                                            <span className="text-sm font-medium">Learn More</span>
                                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
