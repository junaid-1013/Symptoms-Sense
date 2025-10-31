"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { DoctorBasicInfo } from "@/types/doctors";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, MapPin, UserCheck } from "lucide-react";
import Link from "next/link";
import { DoctorCardSkeleton } from "@/components/skeletons";
import  DoctorCard from "@/components/landingPage/DoctorCard";
export default function DoctorsPage() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorBasicInfo[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axiosInstance.get("/doctors");
        setDoctors(response.data.doctors);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <section className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <UserCheck className="w-4 h-4 mr-2" />
            All Doctors
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-balance mb-4">
            Meet Our Expert <span className="text-primary">Healthcare Professionals</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Browse through our comprehensive directory of certified doctors and specialists ready to provide personalized care.
          </p>
        </div>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <DoctorCardSkeleton key={i} />)
            : doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
        </div>

        {doctors.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No doctors found.</p>
          </div>
        )}
      </div>
    </section>
  );
}

