"use client"
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorBasicInfo } from "@/types/doctors";
import DoctorPortrait from "@/components/doctor/DoctorPortrait";
import { GraduationCap, MapPin, UserCheck } from "lucide-react";
import Link from "next/link";
const DoctorCard = ({ doctor }: { doctor: DoctorBasicInfo }) => {
  const specialization =
    Array.isArray(doctor.specializations) && doctor.specializations.length > 0
      ? doctor.specializations.join(", ")
      : "General Physician";
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[4/5] overflow-hidden">
        <DoctorPortrait
            src={doctor.avatar_url || doctor.img}
            name={doctor.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white text-balance mb-1">{doctor.name}</h3>
            <Badge variant="secondary" className="bg-black/45 text-white border-white/30 backdrop-blur-sm">
              {specialization}
            </Badge>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{doctor.clinic_name || "Clinic not specified"}</p>
              <p className="text-xs text-muted-foreground">{doctor.clinic_address || "Address not available"}</p>
            </div>
          </div>
          {doctor.experience_years ? (
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" aria-hidden />
              <span><span className="font-semibold text-foreground">{doctor.experience_years} years</span> of experience</span>
            </p>
          ) : null}

          <Link href={`/doctorDetail?id=${doctor.id}`} className="block w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground transition-all duration-300 hover:bg-primary/90 group-hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              <UserCheck className="w-4 h-4 mr-2 inline" aria-hidden />
              View Profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorCard
