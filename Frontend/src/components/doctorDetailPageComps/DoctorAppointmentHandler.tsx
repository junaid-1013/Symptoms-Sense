import { useUser } from "@/contextApis/UserContext";
import { CreateAppointmentApi } from "@/endPoints/appointments.endPoints";
import { AppointmentType, AvailableSlot, DoctorData } from '@/types';
import { parseISO } from 'date-fns';
import { useState } from 'react';

const DoctorAppointmentHandler = (
    doctorData: DoctorData | null,
    router: any,
    toast: any
) => {
    const { tokens, user} = useUser();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [appointmentType, setAppointmentType] = useState<AppointmentType | undefined>(undefined);
    const [reason, setReason] = useState<string>("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{
        startTime: string;
        endTime: string;
        generatedFromSchedule: string;
    } | null>(null);

    const handleTimeClick = (slot: AvailableSlot) => {
        setSelectedTime(parseISO(slot.start_time));
        setSelectedSlot({
            startTime: slot.start_time,
            endTime: slot.end_time,
            generatedFromSchedule: slot.generated_from_schedule,
        });
    };

    const handleSubmit = () => {
        if (!doctorData) {
            toast({
                title: "Error",
                description: "Doctor data not loaded",
                variant: "destructive",
            });
            return;
        }

        if (!selectedSlot) {
            toast({
                title: "Error",
                description: "Please select the time for the appointment",
                variant: "destructive",
            });
            return;
        }

        if (!tokens?.accessToken || !user?.id) {
            toast({
                title: "Error",
                description: "You must be logged in to book an appointment",
                variant: "destructive",
            });
            return;
        }

        if (!appointmentType) {
            toast({
                title: "Error",
                description: "Please select an appointment type",
                variant: "destructive",
            });
            return;
        }

        CreateAppointmentApi({
            patientId: selectedPatientId ?? user.id,
            doctorId: doctorData.id,
            clinicId: doctorData.clinic_id,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            generatedFromSchedule: selectedSlot.generatedFromSchedule,
            appointmentType,
            chiefComplaint: reason || undefined,
            token: tokens.accessToken,
        })
            .then((res) => {
                if (res.data.status === 'success') {
                    toast({
                        title: "Success!",
                        description: "Appointment booked successfully!",
                    });
                    setIsDialogOpen(false);
                    if(user?.user_type === "patient"){
                        router.push("/profile");
                    }
                }else {
                    toast({
                        title: "Failed!",
                        description: res.data.message,
                        variant: "destructive",
                    });
                }
            })
            .catch((error) => {
               let message = error?.response?.data?.detail 
                  ?? error?.response?.data?.message 
                  ?? "Something went wrong";
                    if (typeof message === "object") {
                        if (Array.isArray(message)) {
                            message = message.join(", ");
                        } else {
                            message = JSON.stringify(message);
                        }
                    }
                    toast({
                        title: "Failed!",
                        description: message,
                        variant: "destructive",
                    });
            });
    };



    return {
        selectedDate,
        setSelectedDate,
        selectedTime,
        selectedSlot,
        appointmentType,
        setAppointmentType,
        reason,
        setReason,
        isDialogOpen,
        setIsDialogOpen,
        handleTimeClick,
        handleSubmit,
        selectedPatientId,
        setSelectedPatientId,
        user
    };
};

export default DoctorAppointmentHandler