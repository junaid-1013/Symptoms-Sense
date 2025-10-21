import RatingForm from "@/components/landingPage/RatingForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AppointmentCardProps } from "@/types"
import { CheckCircle, Clock, X } from "lucide-react"

export const AppointmentCard = ({
  data,
  type,
  onCancel
}: AppointmentCardProps) => {
  const appointmentDate = new Date(data.time)

  return (
    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className={`h-1 ${type === "upcoming" ? "bg-blue-500" : "bg-green-500"}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Doctor"
              src={data.image || "/placeholder.svg"}
              className="w-14 h-14 rounded-xl object-cover border-2 border-muted"
            />
            {type === "completed" && (
              <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{data.doctor}</h4>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="truncate">
                {appointmentDate.toLocaleString("en-US", {
                  timeZone: "Asia/Karachi",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {type === "upcoming" ? (
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel Appointment
          </Button>
        ) : (
          <RatingForm doctorData={data} />
        )}
      </CardContent>
    </Card>
  )
}
