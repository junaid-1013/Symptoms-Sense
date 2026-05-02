"use client"
import { ProfileSkeleton } from "@/components/skeletons"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contextApis/UserContext"
import { GetMyAppointmentsApi } from "@/endPoints/appointments.endPoints"
import { Appointment, ProfileStats, Reminder } from "@/types/profile"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ProfileHeader } from "./ProfileHeader"
import { StatsGrid } from "./StatsGrid"
import { TabsSection } from "./TabsSection"

const Profile = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const { tokens } = useUser()

  const cancelReminder = async (data: Reminder) => {
    try {
      const response = await axios.put("/api/medicineReminder", data)
      router.push("/profile")
      toast({
        title: "Reminder Removed",
        description: "Medicine reminder has been removed successfully",
      })
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to remove reminder",
        variant: "destructive",
      })
    }
  }


  useEffect(() => {
    if (tokens?.accessToken) {
      GetMyAppointmentsApi()
        .then((response) => {
          if (response.data.status === "success") {
            setAppointments(response.data.data.appointments)
          } else {
            toast({
              title: "Error",
              description: response.data.message || "Failed to get appointments",
              variant: "destructive",
            })
          }
        })
        .catch((err) => {
           const message =
                err?.response?.data?.detail || 
                err?.response?.data?.message || "Something went wrong";
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          })
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens])

  // Calculate stats
  const totalAppointments = appointments.length + 0
  const completionRate = totalAppointments > 0
    ? Math.round((0 / totalAppointments) * 100)
    : 0

  const stats: ProfileStats = {
    upcomingAppointments: appointments.length,
    activeReminders: reminders.length,
    completedAppointments: 0,
    completionRate
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <ProfileHeader stats={stats} />
          <StatsGrid stats={stats} />
          <TabsSection
            appointments={appointments}
            reminders={reminders}
            completedAppointments={completedAppointments}
            onCancelReminder={cancelReminder}
          />
        </div>
      )}
    </div>
  )
}
export default Profile