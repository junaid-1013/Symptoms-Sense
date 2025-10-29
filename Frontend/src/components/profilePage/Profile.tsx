"use client"
import { ProfileSkeleton } from "@/components/skeletons"
import { useToast } from "@/components/ui/use-toast"
import { Appointment, CompletedAppointment, ProfileStats, Reminder } from "@/types/profile"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ProfileHeader } from "./ProfileHeader"
import { StatsGrid } from "./StatsGrid"
import { TabsSection } from "./TabsSection"

const Profile = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [completedAppointments, setCompletedAppointments] = useState<CompletedAppointment[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  const cancelAppointment = async (data: Appointment) => {
    try {
      const response = await axios.post("/api/cancelAppointment", data)
      router.push("/profile")
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully",
      })
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      })
    }
  }

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

  const completeAppointment = useCallback(async (data: Appointment) => {
    try {
      const response = await axios.post("/api/completedAppointment", data)
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      })
    }
  }, [toast])

  const checkAppointments = useCallback(() => {
    const currentTime = new Date()
    appointments.forEach((app) => {
      const appointmentTime = new Date(app.time)
      if (appointmentTime < currentTime) {
        completeAppointment(app)
      }
    })
  }, [appointments, completeAppointment])

  useEffect(() => {
    checkAppointments()
  }, [checkAppointments])

  // Calculate stats
  const totalAppointments = appointments.length + completedAppointments.length
  const completionRate = totalAppointments > 0
    ? Math.round((completedAppointments.length / totalAppointments) * 100)
    : 0

  const stats: ProfileStats = {
    upcomingAppointments: appointments.length,
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
            appointments={appointments}
            reminders={reminders}
            completedAppointments={completedAppointments}
            onCancelAppointment={cancelAppointment}
            onCancelReminder={cancelReminder}
          />
        </div>
      )}
    </div>
  )
}
export default Profile