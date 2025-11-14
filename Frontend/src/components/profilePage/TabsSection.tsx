import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TabsSectionProps } from "@/types"
import { Calendar, CalendarDays, History, Pill, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { AppointmentCard } from "./AppointmentCard"
import { EmptyState } from "./EmptyState"
import { ReminderCard } from "./ReminderCard"

export const TabsSection = ({
  appointments,
  reminders,
  completedAppointments,
  onCancelReminder
}: TabsSectionProps) => {
  const [activeTab, setActiveTab] = useState("appointments")

  return (
    <Card className="border-0 shadow-xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b px-6 pt-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3 bg-muted/50 h-12">
            <TabsTrigger
              value="appointments"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CalendarDays className="w-4 h-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger
              value="reminders"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Pill className="w-4 h-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <TabsContent value="appointments" className="mt-0">
            {appointments.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-12 h-12" />}
                title="No upcoming appointments"
                description="Schedule your next appointment with our healthcare professionals"
                actionLabel="Book Appointment"
                actionHref="/doctors"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {appointments.map((data, index) => (
                  <AppointmentCard
                    key={index}
                    data={data}
                    type="upcoming"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reminders" className="mt-0">
            {reminders.length === 0 ? (
              <EmptyState
                icon={<Pill className="w-12 h-12" />}
                title="No active reminders"
                description="Set up medicine reminders to stay on track with your treatment"
                actionLabel="Add Reminder"
                actionHref="/medicineReminder"
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {reminders.map((data, index) => (
                    <ReminderCard
                      key={index}
                      data={data}
                      onCancel={() => onCancelReminder(data)}
                    />
                  ))}
                </div>
                <div className="flex justify-center pt-4">
                  <Link href="/medicineReminder">
                    <Button size="lg" className="gap-2">
                      <Plus className="w-5 h-5" />
                      Add New Reminder
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {completedAppointments.length === 0 ? (
              <EmptyState
                icon={<History className="w-12 h-12" />}
                title="No appointment history"
                description="Your completed appointments will appear here"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {completedAppointments.map((data, index) => (
                  <AppointmentCard
                    key={index}
                    data={data}
                    type="completed"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  )
}