"use client";
import DoctorCard from "@/components/landingPage/DoctorCard";
import { DoctorCardSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DOCTOR_SPECIALIZATIONS } from "@/config/constants";
import { GetAllDoctorsApi } from "@/endPoints/public.endPoints";
import { DoctorBasicInfo } from "@/types/doctors";
import { Filter, Search, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

export default function DoctorsPage() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorBasicInfo[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [clinicId, setClinicId] = useState("");
  const { toast } = useToast();

  const fetchDoctors = (search = "", specialization = "", clinic = "", nextPage = 1) => {
    setLoading(true);
    GetAllDoctorsApi({ search, specialization: specialization === "all" ? "" : specialization, clinic, page: nextPage, page_size: pageSize })
      .then((response) => {
        setDoctors(response?.data?.data?.doctors ?? []);
        setTotal(response?.data?.data?.total ?? 0);
        setPage(nextPage);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
        toast({
          title: "Error",
          description: error?.response?.data?.detail || "An unknown error occurred. Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      });
  };

  // Search as you type (debounced); also runs once on load.
  useEffect(() => {
    const timer = setTimeout(
      () => fetchDoctors(searchTerm.trim(), selectedSpecialization, clinicId),
      searchTerm ? 350 : 0,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedSpecialization]);

  const handleSearch = () => {
    fetchDoctors(searchTerm, selectedSpecialization, clinicId);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialization("all");
    setClinicId("");
  };

  return (
    <section className="py-14 md:py-20 bg-background min-h-screen">
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
            Explore provider profiles by name, specialty, and clinic.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-12 bg-card p-6 rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full flex-1">
              <label htmlFor="doctor-search" className="block text-sm font-medium mb-2">Search Doctors</label>
              <div className="relative">
                <Search aria-hidden className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="doctor-search"
                  placeholder="Search by name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="w-full flex-1">
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

            <div className="flex w-full gap-2 md:w-auto">
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
        {!loading && total > pageSize && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button variant="outline" disabled={page === 1} onClick={() => fetchDoctors(searchTerm, selectedSpecialization, clinicId, page - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / pageSize)} · {total} doctors</span>
            <Button variant="outline" disabled={page >= Math.ceil(total / pageSize)} onClick={() => fetchDoctors(searchTerm, selectedSpecialization, clinicId, page + 1)}>Next</Button>
          </div>
        )}
      </div>
    </section>
  );
}
