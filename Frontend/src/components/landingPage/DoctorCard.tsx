"use client"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocSchema } from "@/types";
import { GraduationCap, MapPin, UserCheck } from "lucide-react";
import Link from "next/link";
import queryString from "query-string";

const DoctorCard = ({ doctor }: { doctor: DocSchema }) => {

    const createDoctorLink = (doctor: DocSchema) => {
        const reserveTime = doctor.reservations.map((obj) => obj.time)
        const feedback = doctor.feedbacks.map((obj) => obj.review)
        const user = doctor.feedbacks.map((obj) => obj.username)

        const details = {
            id: doctor.id,
            name: doctor.name,
            img: doctor.img,
            specialization: doctor.specialization,
            education: doctor.education,
            experience: doctor.experience,
            services: doctor.services,
            about: doctor.about,
            experienceYears: doctor.experienceYears,
            city: doctor.city,
            streetAddress: doctor.streetAddress,
            reserveTime,
            feedback,
            user,
        }

        return queryString.stringify(details, { arrayFormat: "separator", arrayFormatSeparator: "*" })
    }
    return (
        <Card
            className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card border-border overflow-hidden"
        >
            <CardContent className="p-0">
                <div className="relative h-56 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={doctor.img || "/placeholder.svg?height=200&width=400&query=professional doctor portrait"}
                        alt={doctor.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white text-balance mb-1">{doctor.name}</h3>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {doctor.specialization[0]}
                        </Badge>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <GraduationCap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground">{doctor.education[0]}</p>
                                <p className="text-xs text-muted-foreground">Education</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground">{doctor.city}</p>
                                <p className="text-xs text-muted-foreground">{doctor.streetAddress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Experience</span>
                            <span className="text-sm font-bold text-primary">{doctor.experienceYears} Years</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min((doctor.experienceYears / 20) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {doctor.services.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Services</p>
                            <div className="flex flex-wrap gap-1">
                                {doctor.services.slice(0, 2).map((service, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {service}
                                    </Badge>
                                ))}
                                {doctor.services.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{doctor.services.length - 2} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    <Link href={{ pathname: "/doctorDetail", query: createDoctorLink(doctor) }} className="block">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group-hover:shadow-lg transition-all duration-300">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Book Consultation
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export default DoctorCard