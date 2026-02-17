"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Filter, UserCheck } from "lucide-react";
import DoctorCard from "@/components/landingPage/DoctorCard";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useUser } from "@/contextApis/UserContext";
import { DOCTOR_SPECIALIZATIONS } from "@/config/constants";

export default function ClinicAppointmentSection() {
  const { clinicDoctors } = useUser();
  const safeDoctors = clinicDoctors ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");

  const filteredDoctors = useMemo(() => {
    return safeDoctors.filter((doctor) => {
      const nameMatch = doctor.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const specialization = doctor.specializations?.[0] || "General Physician";

      const specMatch =
        selectedSpecialization === "all" ||
        specialization === selectedSpecialization;

      return nameMatch && specMatch;
    });
  }, [safeDoctors, searchTerm, selectedSpecialization]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialization("all");
  };

  return (
    <section className="py-10">
      {/* Search & Filters */}
      <div className="bg-card p-6 rounded-lg border mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Search Doctor</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Specialization */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Specialization</label>
            <Select
              value={selectedSpecialization}
              onValueChange={setSelectedSpecialization}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {DOCTOR_SPECIALIZATIONS.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button className="flex gap-2 items-center">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <ScrollArea className="h-[70vh] pr-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">
                No doctors found matching your search.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </section>
  );
}
