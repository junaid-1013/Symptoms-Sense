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
import { useUser } from "@/contextApis/UserContext";
import { ApproveAppointmentApi, CancelAppointmentApi, GetMyAppointmentsApi } from "@/endPoints/appointments.endPoints";
import { Appointment, DoctorAppointmentItem } from "@/types";
import { CheckCircle2, Clock, History, Pill, Stethoscope, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../ui/use-toast";
import AppointmentSection from "./AppointmentSection";
import WeeklyScheduleTable from "./WeeklyScheduleTable";
import AddMedicineHome from "@/components/medicines/AddMedicineHome";

const DoctorProfile = () => {
  const { user, tokens } = useUser();
  const [activeTab, setActiveTab] = useState("schedule");
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Transform API appointment data to DoctorAppointmentItem format
  const transformAppointment = (appointment: Appointment): DoctorAppointmentItem => {
    const appointmentDate = new Date(appointment.timeslot.date);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Combine date and time for proper datetime
    const startTime = new Date(`${appointment.timeslot.date}T${appointment.timeslot.start_time}`);

    return {
      appointmentId: appointment.id,
      patientName: appointment.patient.name,
      gender: appointment.patient.gender || "Unknown",
      age: appointment.patient.age || 0,
      date: formattedDate,
      time: startTime.toISOString(),
      reason: appointment.chief_complaint || appointment.appointment_type || "General Consultation",
      status: appointment.status,
    };
  };

  // Filter appointments by specific status
  const pendingAppointments = appointments
    .filter((apt) => apt.status.toLowerCase() === "pending")
    .map(transformAppointment);

  const approvedAppointments = appointments
    .filter((apt) => apt.status.toLowerCase() === "scheduled")
    .map(transformAppointment);

  const cancelledAppointments = appointments
    .filter((apt) => apt.status.toLowerCase() === "cancelled")
    .map(transformAppointment);

  const completedAppointments = appointments
    .filter((apt) => apt.status.toLowerCase() === "completed")
    .map(transformAppointment);

  // Function to fetch appointments
  const fetchAppointments = () => {
    if (tokens?.accessToken) {
      setLoading(true);
      GetMyAppointmentsApi({ token: tokens?.accessToken || "" })
        .then((response) => {
          if (response.data.status === "success") {
            setAppointments(response.data.data.appointments);
          } else {
            toast({
              title: "Error",
              description: response.data.message || "Failed to get appointments",
              variant: "destructive",
            });
          }
        })
        .catch((err) => {
          toast({
            title: "Error",
            description: err.response?.data?.detail || "Failed to get appointments",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // Handle approve appointment
  const handleApprove = (appointmentId: string) => {
    if (!tokens?.accessToken) return;

    ApproveAppointmentApi({ appointmentId: appointmentId, token: tokens.accessToken })
      .then((response) => {
        if (response.data.status === "success") {
          toast({
            title: "Success",
            description: "Appointment approved successfully",
          });
          setAppointments(response.data.data.appointments);
        } else {
          toast({
            title: "Error",
            description: response.data.message || "Failed to approve appointment",
            variant: "destructive",
          });
        }
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.response?.data?.detail || "Failed to approve appointment",
          variant: "destructive",
        });
      });
  };

  // Handle cancel appointment
  const handleCancel = (appointmentId: string) => {
    if (!tokens?.accessToken) return;

    CancelAppointmentApi({ appointmentId, token: tokens.accessToken })
      .then((response) => {
        if (response.data.status === "success") {
          toast({
            title: "Success",
            description: "Appointment cancelled successfully",
          });
          setAppointments(response.data.data.appointments);
        } else {
          toast({
            title: "Error",
            description: response.data.message || "Failed to cancel appointment",
            variant: "destructive",
          });
        }
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.response?.data?.detail || "Failed to cancel appointment",
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens])

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
            <TabsList className="grid w-full max-w-4xl grid-cols-6 gap-x-2 bg-muted/50 h-12">
              <TabsTrigger
                value="schedule"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm"
              >
                <Stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">Weekly Schedule</span>
                <span className="sm:hidden">Schedule</span>
              </TabsTrigger>

              <TabsTrigger
                value="pending"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm"
              >
                <Clock className="w-4 h-4" />
                Pending
              </TabsTrigger>

              <TabsTrigger
                value="approved"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approved
              </TabsTrigger>

              <TabsTrigger
                value="cancelled"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm"
              >
                <XCircle className="w-4 h-4" />
                Cancelled
              </TabsTrigger>

              <TabsTrigger
                value="completed"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm"
              >
                <History className="w-4 h-4" />
                Completed
              </TabsTrigger>

              <TabsTrigger
                value="medicines"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm"
              >
                <Pill className="w-4 h-4" />
                Medicine
              </TabsTrigger>
              
            </TabsList>

          </div>

          <div className="p-6">
            <TabsContent value="schedule" className="mt-0">
              <WeeklyScheduleTable />
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
              {loading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading appointments...</p>
                </div>
              ) : pendingAppointments.length > 0 ? (
                <AppointmentSection
                  title="Pending Appointments"
                  data={pendingAppointments}
                  cardClassName="bg-gradient-to-br from-yellow-50 via-white to-amber-50 border border-yellow-200 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  onApprove={handleApprove}
                  onCancel={handleCancel}
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No pending appointments</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-0">
              {loading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading appointments...</p>
                </div>
              ) : approvedAppointments.length > 0 ? (
                <AppointmentSection
                  title="Approved Appointments"
                  data={approvedAppointments}
                  cardClassName="bg-gradient-to-br from-green-50 via-white to-emerald-50 border border-green-200 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  onCancel={handleCancel}
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No approved appointments</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-0">
              {loading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading appointments...</p>
                </div>
              ) : cancelledAppointments.length > 0 ? (
                <AppointmentSection
                  title="Cancelled Appointments"
                  data={cancelledAppointments}
                  cardClassName="bg-gradient-to-br from-red-50 via-white to-rose-50 border border-red-200 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No cancelled appointments</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              {loading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading appointments...</p>
                </div>
              ) : completedAppointments.length > 0 ? (
                <AppointmentSection
                  title="Completed Appointments"
                  data={completedAppointments}
                  cardClassName="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No completed appointments</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="medicines" className="mt-0">
              <AddMedicineHome />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default DoctorProfile;