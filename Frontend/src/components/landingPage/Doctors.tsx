"use client"
import { DoctorCardSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { DocSchema } from "@/types";
import axios from "axios";
import { UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import DoctorCard from "./DoctorCard";

export default function Doctors() {
    const [loading, setLoading] = useState(true)
    const [DocData, setDocData] = useState<DocSchema[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("/api/regDoctor");
                setDocData(response.data.map((doctor: any) => ({
                    ...doctor,
                    id: doctor._id,
                    img: doctor.image?.url,
                    experience: doctor.experienceDetails
                })));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <section id="doctors" className="py-20 bg-background">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Our Doctors
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
                        Connect with Expert <span className="text-primary">Healthcare Professionals</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                        Our network of certified doctors and specialists are here to provide personalized care and expert medical
                        guidance.
                    </p>
                </div>

                {/* Doctors Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <DoctorCardSkeleton key={i} />)
                        : DocData.map((doctor) => (
                            <DoctorCard key={doctor.id} doctor={doctor} />
                        ))}
                </div>
            </div>
        </section>
    )
}