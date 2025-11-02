"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Clock4,
  CalendarDays,
  Stethoscope,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { useUser } from "@/contextApis/UserContext";

const DoctorProfile = () => {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const currentDate = new Date();

  const appointment = [
  {
    patientName: "Ahmed Khan",
    age: 45,
    gender: "Male",
    reason: "Routine Heart Checkup",
    time: "2025-11-05T14:30:00Z",
    date: "5 Nov 2025",
  },
  {
    patientName: "Ayesha Malik",
    age: 38,
    gender: "Female",
    reason: "Chest Pain Follow-up",
    time: "2025-11-07T09:00:00Z",
    date: "7 Nov 2025",
  },
  {
    patientName: "Ali Raza",
    age: 52,
    gender: "Male",
    reason: "Post-Surgery Review",
    time: "2025-11-10T15:00:00Z",
    date: "10 Nov 2025",
  },
  {
    patientName: "Fatima Noor",
    age: 29,
    gender: "Female",
    reason: "Blood Pressure Monitoring",
    time: "2025-11-12T11:00:00Z",
    date: "12 Nov 2025",
  },
];

const prevAppointment = [
  {
    patientName: "Hassan Ali",
    age: 60,
    gender: "Male",
    reason: "ECG and Test Report Discussion",
    time: "2025-10-25T11:30:00Z",
    date: "25 Oct 2025",
  },
  {
    patientName: "Maryam Zahra",
    age: 47,
    gender: "Female",
    reason: "Follow-up After Medication",
    time: "2025-10-15T14:00:00Z",
    date: "15 Oct 2025",
  },
];


  const handleReservationSubmit = async () => {
    
  };

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
        <span className="text-gray-700">{user?.specialization || "N/A"}</span>
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
      {/* Upcoming Appointments */}
<section className="text-center space-y-6">
  <h2 className="text-3xl font-bold text-gray-900">
    Upcoming Appointments
  </h2>
  <Separator className="w-24 mx-auto bg-indigo-200" />

  <Carousel className="w-full max-w-5xl mx-auto">
    <CarouselContent>
      {appointment.map((a, i) => (
        <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
          <Card className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="flex flex-col items-center space-y-3 text-center p-5">
              <div className="relative flex justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-200 to-blue-300 opacity-30 blur-md" />
                </div>
                <Avatar className="h-16 w-16 ring-2 ring-indigo-300 shadow-md relative z-10 bg-white">
                  <AvatarImage
                    src={
                      a.gender === "Male"
                        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(a.patientName)}`
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(a.patientName)}`
                    }
                    alt={a.patientName}
                    className="rounded-full object-cover transition-all duration-500 hover:scale-105"
                  />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                    {a.patientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <CardTitle className="text-lg font-semibold text-gray-900">
                {a.patientName}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {a.gender}, {a.age} years
              </p>
            </CardHeader>

            <CardContent className="text-sm text-gray-700 space-y-3 pb-5">
              <p className="text-center italic text-gray-600 bg-white/70 p-2 rounded-xl border border-indigo-100 shadow-sm">
                “{a.reason}”
              </p>
              <div className="flex justify-around items-center pt-3 border-t border-indigo-100">
                <div className="flex flex-col items-center text-indigo-700">
                  <CalendarCheck className="h-4 w-4 mb-1" />
                  <span>{a.date}</span>
                </div>
                <div className="flex flex-col items-center text-indigo-700">
                  <Clock4 className="h-4 w-4 mb-1" />
                  <span>
                    {new Date(a.time).toLocaleTimeString("en-US", {
                      timeZone: "Asia/Karachi",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</section>

{/* Completed Appointments */}
<section className="text-center space-y-6 mt-16">
  <h2 className="text-3xl font-bold text-gray-900">
    Completed Appointments
  </h2>
  <Separator className="w-24 mx-auto bg-indigo-200" />

  <Carousel className="w-full max-w-5xl mx-auto">
    <CarouselContent>
      {prevAppointment.map((a, i) => (
        <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
          <Card className="bg-gradient-to-br from-gray-50 via-white to-indigo-50 border border-indigo-100 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="flex flex-col items-center space-y-3 text-center p-5">
              <div className="relative flex justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-200 to-blue-300 opacity-30 blur-md" />
                </div>
                <Avatar className="h-16 w-16 ring-2 ring-indigo-300 shadow-md relative z-10 bg-white">
                  <AvatarImage
                    src={
                      a.gender === "Male"
                        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(a.patientName)}`
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(a.patientName)}`
                    }
                    alt={a.patientName}
                    className="rounded-full object-cover transition-all duration-500 hover:scale-105"
                  />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                    {a.patientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <CardTitle className="text-lg font-semibold text-gray-900">
                {a.patientName}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {a.gender}, {a.age} years
              </p>
            </CardHeader>

            <CardContent className="text-sm text-gray-700 space-y-3 pb-5">
              <p className="text-center italic text-gray-600 bg-white/70 p-2 rounded-xl border border-indigo-100 shadow-sm">
                “{a.reason}”
              </p>
              <div className="flex justify-around items-center pt-3 border-t border-indigo-100">
                <div className="flex flex-col items-center text-indigo-700">
                  <CalendarCheck className="h-4 w-4 mb-1" />
                  <span>{a.date}</span>
                </div>
                <div className="flex flex-col items-center text-indigo-700">
                  <Clock4 className="h-4 w-4 mb-1" />
                  <span>
                    {new Date(a.time).toLocaleTimeString("en-US", {
                      timeZone: "Asia/Karachi",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</section>
<Card className="max-w-lg mx-auto shadow-lg border border-indigo-100 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100 hover:from-indigo-100 hover:to-indigo-50 transition-all duration-500 ease-in-out">
  <CardHeader className="text-center space-y-2">
    <CardTitle className="text-2xl font-semibold text-gray-900 flex justify-center items-center gap-x-2">
      <CalendarDays className="w-5 h-5 text-indigo-600" />
      Reserve a Schedule
    </CardTitle>
    <CardDescription className="text-gray-500">
      Select your preferred date/time for the next slot.
    </CardDescription>
  </CardHeader>

  <Separator className="my-2" />

  <CardContent className="flex flex-col items-center space-y-5">
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={setSelectedDate}
      fromDate={currentDate}
      className="rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-300"
    />
    <Button
      className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
      onClick={handleReservationSubmit}
    >
      Confirm Reservation
    </Button>
  </CardContent>
</Card>

    </div>
  );
};

export default DoctorProfile;
