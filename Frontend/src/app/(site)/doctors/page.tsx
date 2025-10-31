"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { DoctorBasicInfo } from "@/types/doctors";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, MapPin, UserCheck, Search, Filter } from "lucide-react";
import Link from "next/link";
import { DoctorCardSkeleton } from "@/components/skeletons";
import { DOCTOR_SPECIALIZATIONS } from "@/config/constants";
import DoctorCard from "@/components/landingPage/DoctorCard";
export default function DoctorsPage() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorBasicInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [clinicId, setClinicId] = useState("");

  const fetchDoctors = async (search = "", specialization = "", clinic = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (specialization && specialization !== "all") params.append("specialization", specialization);
      if (clinic) params.append("clinic_id", clinic);

      const response = await axiosInstance.get(`/doctors/search?${params.toString()}`);
      setDoctors(response.data.doctors);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = () => {
    fetchDoctors(searchTerm, selectedSpecialization, clinicId);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialization("all");
    setClinicId("");
    fetchDoctors();
  };

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

        {/* Search and Filter Section */}
        <div className="mb-12 bg-card p-6 rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Search Doctors</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Specialization</label>
              <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                <SelectTrigger>
                  <SelectValue placeholder="All Specializations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {DOCTOR_SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Search
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
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
            <p className="text-muted-foreground">No doctors found matching your criteria.</p>
            <Button variant="outline" onClick={handleClearFilters} className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

