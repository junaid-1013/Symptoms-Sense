"use client";
import { AppSidebar } from "@/components/dashComps/AppSidebar";
import { DashHeader } from "@/components/dashComps/DashHeader";
import { ChartAreaInteractive } from "@/components/dashComps/chart-area-interactive";
import { SectionCards } from "@/components/dashComps/section-cards";
import AddDoctorHome from "@/components/doctor/AddDoctorHome";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ClinicAppointmentSection from "@/components/dashComps/ClinicAppointementSection";
import AddMedicineHome from "@/components/medicines/AddMedicineHome";
import { useState } from "react";

export default function Page() {
  const [selectedSection, setSelectedSection] = useState("Dashboard")

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
      />
      <SidebarInset>
        <DashHeader title={selectedSection} />
        <ScrollArea className="h-[90vh]">
          <div className="flex flex-1 flex-col">
            <div className="container flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {selectedSection === "Doctors" ?
                  <AddDoctorHome />
                  : selectedSection === "Appointments" ?
                    <ClinicAppointmentSection />
                    : selectedSection === "Medicines" ?  
                    <AddMedicineHome />
                    : 
                    <>
                      <SectionCards />
                      <div className="px-4 lg:px-6"><ChartAreaInteractive /></div>
                    </>
                }
              </div>
            </div>
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}