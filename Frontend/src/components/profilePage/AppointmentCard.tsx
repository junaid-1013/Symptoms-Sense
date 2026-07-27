"use client"
import RatingForm from "@/components/landingPage/RatingForm"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AppointmentCardProps } from "@/types"
import { CheckCircle, Clock, MapPin, User } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export const AppointmentCard = ({
  data,
  type
}: AppointmentCardProps) => {
  const [imageError, setImageError] = useState(false)
  const appointmentDateTime = new Date(`${data.timeslot.date}T${data.timeslot.start_time}`)

  return (
    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className={`h-1 ${type === "upcoming" ? "bg-blue-500" : "bg-green-500"}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="relative">
            {!imageError && data.doctor.profile_image ? (
              <Image
                alt={data.doctor.name}
                src={data.doctor.profile_image}
                fill
                className="rounded-xl object-cover border-2 border-muted"
                onError={() => setImageError(true)}
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-muted border-2 border-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            {type === "completed" && (
              <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{data.doctor.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {data.doctor.specializations.join(", ")}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="truncate">
                {appointmentDateTime.toLocaleString("en-US", {
                  timeZone: "Asia/Karachi",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{data.clinic.name}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium">{data.appointment_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={`font-medium capitalize ${data.status === "pending" ? "text-yellow-600" :
              data.status === "confirmed" ? "text-blue-600" :
                "text-green-600"
              }`}>
              {data.status}
            </span>
          </div>
        </div>

        {type === "completed" && (
          <RatingForm doctorId={data.doctor.id} />
        )}
      </CardContent>
    </Card>
  )
}