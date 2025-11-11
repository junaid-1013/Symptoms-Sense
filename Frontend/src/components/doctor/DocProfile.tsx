"use client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APPOINTMENT, PREV_APPOINTMENT } from "@/config/DummyData";
import { useUser } from "@/contextApis/UserContext";
import { CalendarCheck, History, Stethoscope } from "lucide-react";
import { useState } from "react";
import AppointmentSection from "./AppointmentSection";
import WeeklyScheduleTable from "./WeeklyScheduleTable";

const DoctorProfile = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div className="py-10 px-6 space-y-14 bg-gradient-to-b from-gray-50 to-white">

      <Card className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-indigo-100 transition-all duration-500 bg-white/90 backdrop-blur-md hover:-translate-y-1">
        <div className="relative h-36 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white,transparent_70%)]" />
          <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg bg-white relative z-10">
            <AvatarImage
              src={user?.avatar_url || "/doctor-placeholder2.svg"}
              alt={user?.name || "Doctor"}
              className="object-cover rounded-full transition-transform duration-500 hover:scale-105"
            />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-semibold">
              {user?.name?.charAt(0) || "D"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info Section */}
        <CardContent className="p-5 space-y-3 text-center">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 flex justify-center items-center gap-x-2">
              <Stethoscope className="w-6 h-6 text-indigo-600" />
              {user?.name || "Doctor Name"}
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm">
              {user?.email || "doctor@email.com"}
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mt-4">
            <div className="flex flex-col items-center bg-indigo-50/60 rounded-xl p-3 hover:bg-indigo-100 transition-colors">
              <span className="text-indigo-600 font-semibold">📞</span>
              <span className="text-gray-700">{user?.phone || "N/A"}</span>
            </div>
            <div className="flex flex-col items-center bg-indigo-50/60 rounded-xl p-3 hover:bg-indigo-100 transition-colors">
              <span className="text-indigo-600 font-semibold">🎓</span>
              <span className="text-gray-700">{user?.experience_years ?? 0} Years</span>
            </div>
            <div className="flex flex-col items-center bg-indigo-50/60 rounded-xl p-3 hover:bg-indigo-100 transition-colors">
              <span className="text-indigo-600 font-semibold">🩺</span>
              <span className="text-gray-700">{user?.specializations?.[0] ?? "N/A"}</span>
            </div>
          </div>

          {user?.clinic_name && (
            <div className="mt-4 text-sm bg-white border border-indigo-100 rounded-xl shadow-sm p-3 hover:shadow-md transition-all">
              <p className="font-semibold text-indigo-700">{user.clinic_name}</p>
              <p className="text-gray-600">{user.clinic_address}</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Appointments Tabs */}
      <Card className="border-0 shadow-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-6 pt-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3 gap-x-4 bg-muted/50 h-12">
            <TabsTrigger
              value="schedule"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
            >
              <Stethoscope className="w-4 h-4" />
              Weekly Schedule
            </TabsTrigger>

            <TabsTrigger
              value="upcoming"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
            >
              <CalendarCheck className="w-4 h-4" />
              Upcoming
            </TabsTrigger>

            <TabsTrigger
              value="completed"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
            >
              <History className="w-4 h-4" />
              Completed
            </TabsTrigger>
          </TabsList>

          </div>

          <div className="p-6">
            <TabsContent value="schedule" className="mt-0">
              <WeeklyScheduleTable />
            </TabsContent>
            <TabsContent value="upcoming" className="mt-0">
              <AppointmentSection
                title="Upcoming Appointments"
                data={APPOINTMENT}
                cardClassName="bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <AppointmentSection
                title="Completed Appointments"
                data={PREV_APPOINTMENT}
                cardClassName="bg-gradient-to-br from-gray-50 via-white to-indigo-50 border border-indigo-100 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default DoctorProfile;