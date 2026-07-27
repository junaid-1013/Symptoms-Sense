"use client"
import { ProfileSkeleton } from "@/components/skeletons"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contextApis/UserContext"
import { GetMyAppointmentsApi } from "@/endPoints/appointments.endPoints"
import { DeleteReminderApi, GetMyRemindersApi } from "@/endPoints/reminders.endPoints"
import { Appointment, ProfileStats, Reminder } from "@/types/profile"
import { useEffect, useState } from "react"
import { ProfileHeader } from "./ProfileHeader"
import { StatsGrid } from "./StatsGrid"
import { TabsSection } from "./TabsSection"

const Profile = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const { tokens } = useUser()

  const cancelReminder = async (data: Reminder) => {
    try {
      await DeleteReminderApi(data.id)
      setReminders((prev) => prev.filter((r) => r.id !== data.id))
      toast({
        title: "Reminder Removed",
        description: "Medicine reminder has been removed successfully",
      })
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to remove reminder"
      toast({
        title: "Error",
        description: detail,
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
            err?.response?.data?.message || "Something went wrong"
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          })
        })

      GetMyRemindersApi()
        .then((response) => {
          if (response.data.status === "success") {
            setReminders(response.data.data.reminders)
          }
        })
        .catch((err) => {
          const message =
            err?.response?.data?.detail ||
            err?.response?.data?.message || "Failed to load reminders"
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          })
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens])

  const upcomingAppointments = appointments.filter((appointment) =>
    ["pending", "scheduled"].includes(appointment.status)
  )
  const completedAppointments = appointments.filter((appointment) => appointment.status === "completed")
  // Completion rate includes cancelled appointments in the denominator.
  const totalAppointments = appointments.length
  const completionRate = totalAppointments > 0
    ? Math.round((completedAppointments.length / totalAppointments) * 100)
    : 0

  const stats: ProfileStats = {
    upcomingAppointments: upcomingAppointments.length,
    activeReminders: reminders.length,
    completedAppointments: completedAppointments.length,
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
            appointments={upcomingAppointments}
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