import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AppointmentBookingCardProps } from "@/types";
import { CalendarDays } from "lucide-react";
import BookingDialogContent from './BookingDialogContent';

const AppointmentBookingCard = ({
    doctor,
    availableSlots,
    selectedDate,
    onSelectDate,
    selectedTime,
    selectedSlot,
    onSelectSlot,
    appointmentType,
    setAppointmentType,
    reason,
    setReason,
    isDialogOpen,
    setIsDialogOpen,
    onSubmit,
    isMobile,
    selectedPatientId,     
    setSelectedPatientId 
}: AppointmentBookingCardProps) => {
    return (
        <>
            <div className={`${isMobile ? 'block md:hidden' : 'hidden md:block'} overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg`}>
                <div className="flex flex-col gap-y-8">
                    <div className="flex w-full items-center justify-between">
                        <div className="w-[60%] flex items-center">
                            <h3 className="text-lg font-bold text-gray-900 sm:text-xl w-full">
                                Appointment Booking
                            </h3>
                        </div>
                        <span className="box w-[30%] p-2 text-[10px] font-semibold text-[#232426] text-center rounded bg-[#000066]/10">
                            Receive Expert Care In-Person
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <p className="text-sm">Address:</p>
                        <p className="text-sm font-semibold">{doctor.clinic_address}</p>
                    </div>
                    <hr className="-mt-6" />

                    <div className="flex justify-between gap-4">
                        <p className="flex gap-x-2 text-sm text-[#2a872e] font-semibold">
                            <CalendarDays className="w-5 h-5" />Availability
                        </p>
                        <p className="text-right text-sm font-semibold">Select a date to view appointment times</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <button
                                onClick={() => setIsDialogOpen(true)}
                                className="flex gap-x-2 py-4 bg-[#192a56] text-white font-semibold justify-center rounded items-center hover:bg-[#192a56]/90"
                            >
                                Book Appointment
                            </button>
                        </DialogTrigger>
                        <BookingDialogContent
                            doctorName={doctor.name}
                            availableSlots={availableSlots}
                            selectedDate={selectedDate}
                            onSelectDate={onSelectDate}
                            selectedTime={selectedTime}
                            onSelectSlot={onSelectSlot}
                            hasSelectedSlot={!!selectedSlot}
                            appointmentType={appointmentType}
                            setAppointmentType={setAppointmentType}
                            reason={reason}
                            setReason={setReason}
                            onSubmit={onSubmit}
                            onClose={() => setIsDialogOpen(false)}
                            selectedPatientId={selectedPatientId}
                            setSelectedPatientId={setSelectedPatientId}
                        />
                    </Dialog>
                </div>
            </div>

            {/* {!isMobile && <ClinicBookingCard doctor={doctor} />} */}
        </>
    );
};
export default AppointmentBookingCard
