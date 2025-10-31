"use client"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocSchema } from "@/types";
import { GraduationCap, MapPin, UserCheck } from "lucide-react";
import Link from "next/link";
import { DoctorBasicInfo } from "@/types/doctors";
import Image from "next/image";
const DoctorCard = ({ doctor }: { doctor: DoctorBasicInfo }) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="relative h-56 overflow-hidden">
        <Image
            src={doctor.img || "/doctor-placeholder.svg"}
            alt={doctor.name || "Doctor"}
            fill
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white text-balance mb-1">{doctor.name}</h3>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {doctor.specialization || "General Physician"}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{doctor.specialization || "Specialization not specified"}</p>
                <p className="text-xs text-muted-foreground">Specialization</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{doctor.clinic_name || "Clinic not specified"}</p>
                <p className="text-xs text-muted-foreground">{doctor.clinic_address || "Address not available"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Experience</span>
              <span className="text-sm font-bold text-primary">{doctor.experience_years || 0} Years</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(((doctor.experience_years || 0) / 20) * 100, 100)}%` }}
              />
            </div>
          </div>

          {doctor.bio && (
            <div className="space-y-2">
              <p className="text-sm font-medium">About</p>
              <p className="text-xs text-muted-foreground line-clamp-3">{doctor.bio}</p>
            </div>
          )}

          <Link href={`/doctorDetail?id=${doctor.id}`} className="block">
            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group-hover:shadow-lg transition-all duration-300 py-2 px-4 rounded-md">
              <UserCheck className="w-4 h-4 mr-2 inline" />
              View Profile
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorCard