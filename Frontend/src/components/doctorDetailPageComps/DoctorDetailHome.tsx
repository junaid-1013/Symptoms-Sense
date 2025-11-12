'use client';
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contextApis/UserContext";
import { GetAvailableSlotsApi } from "@/endPoints/appointments.endPoints";
import { GetDoctorDetailApi } from "@/endPoints/doctor.endPoints";
import { AvailableSlot, DoctorData } from '@/types';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from 'react';
import AppointmentBookingCard from './AppointmentBookingCard';
import DoctorAppointmentHandler from './DoctorAppointmentHandler';
import DoctorDetailHeader from './DoctorDetailHeader';
import DoctorSections from './DoctorSections';

const DoctorDetailHome = () => {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const { tokens } = useUser();

    const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

    const {
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
    } = DoctorAppointmentHandler(doctorData, router, toast);

    // Fetch doctor details
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        GetDoctorDetailApi({ doctor_id: id })
            .then((res) => {
                if (res.data.status === 'success' && res.data.data) {
                    setDoctorData(res.data.data);
                }
            })
            .catch((error) => {
                console.error('Error fetching doctor details:', error);
                toast({
                    title: "Error",
                    description: "Failed to load doctor details",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id, toast]);

    // Fetch available slots when date changes
    useEffect(() => {
        if (!id || !tokens?.accessToken) return;

        const fetchSlots = async () => {
            try {
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                const res = await GetAvailableSlotsApi({
                    doctorId: id,
                    date: dateStr,
                    token: tokens.accessToken || "",
                });
                const timeslots: AvailableSlot[] = res?.data?.data?.timeslots || [];
                setAvailableSlots(timeslots);
            } catch (e) {
                setAvailableSlots([]);
            }
        };

        fetchSlots();
    }, [id, selectedDate, tokens?.accessToken]);

    if (loading) {
        return (
            <div className="max-w-[1170px] px-5 mx-auto py-20 text-center">
                <p className="text-xl text-gray-600">Loading doctor details...</p>
            </div>
        );
    }

    if (!doctorData) {
        return (
            <div className="max-w-[1170px] px-5 mx-auto py-20 text-center">
                <p className="text-xl text-red-600">Doctor not found</p>
            </div>
        );
    }

    return (
        <section>
            <div className="max-w-[1170px] px-5 mx-auto grid grid-cols-5 gap-8 py-8">
                <div className="relative block md:col-span-3 md:space-y-0 col-span-5 space-y-4">
                    <DoctorDetailHeader doctor={doctorData} />
                    {/* Mobile Appointment Booking */}
                    <div className="md:hidden">
                        <AppointmentBookingCard
                            doctor={doctorData}
                            availableSlots={availableSlots}
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            selectedTime={selectedTime}
                            selectedSlot={selectedSlot}
                            onSelectSlot={handleTimeClick}
                            appointmentType={appointmentType}
                            setAppointmentType={setAppointmentType}
                            reason={reason}
                            setReason={setReason}
                            isDialogOpen={isDialogOpen}
                            setIsDialogOpen={setIsDialogOpen}
                            onSubmit={handleSubmit}
                            isMobile={true}
                        />
                    </div>
                    <DoctorSections doctor={doctorData} />
                </div>

                {/* Desktop Appointment Booking */}
                <div className="relative md:col-span-2 col-span-5 space-y-6 hidden md:block">
                    <AppointmentBookingCard
                        doctor={doctorData}
                        availableSlots={availableSlots}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        selectedTime={selectedTime}
                        selectedSlot={selectedSlot}
                        onSelectSlot={handleTimeClick}
                        appointmentType={appointmentType}
                        setAppointmentType={setAppointmentType}
                        reason={reason}
                        setReason={setReason}
                        isDialogOpen={isDialogOpen}
                        setIsDialogOpen={setIsDialogOpen}
                        onSubmit={handleSubmit}
                        isMobile={false}
                    />
                </div>
            </div>
        </section>
    );
};

export default DoctorDetailHome