"use client"
import { TeamMemberSkeleton } from "@/components/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TEAM_MEMBERS } from "@/config/constants"
import { Users } from "lucide-react"
import { useEffect, useState } from "react"

export default function OurTeam() {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1200)
        return () => clearTimeout(timer)
    }, [])

    return (
        <section id="team" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">
                        <Users className="w-4 h-4 mr-2" />
                        Our Team
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
                        Meet the Experts Behind <span className="text-primary">Symptoms Sense</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                        Our dedicated team of healthcare professionals and technology experts working together to revolutionize
                        medical care.
                    </p>
                </div>

                {/* Team Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <TeamMemberSkeleton key={i} />)
                        : TEAM_MEMBERS.map((member) => (
                            <Card
                                key={member.id}
                                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border"
                            >
                                <CardContent className="p-6 text-center">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={member.imageSrc || "/placeholder.svg"}
                                                alt={member.name}
                                                className="w-32 h-32 rounded-2xl mx-auto object-cover shadow-md group-hover:shadow-lg transition-shadow"
                                            />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-balance mb-1">{member.name}</h3>
                                            <p className="text-sm text-muted-foreground">{member.title}</p>
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
