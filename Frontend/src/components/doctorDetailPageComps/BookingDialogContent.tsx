import { Calendar } from "@/components/ui/calendar";
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import GetPatientDropdown from "@/components/doctorDetailPageComps/GetPatientDropdown";
import { useUser } from "@/contextApis/UserContext"
import { APPOINTMENT_TYPES } from "@/config/constants";
import { cn } from '@/lib/utils';
import { AppointmentType, BookingDialogContentProps } from '@/types';
import { addDays, format, isSameMinute, parseISO } from 'date-fns';
import { memo } from 'react';

const BookingDialogContent = memo(({
    doctorName,
    availableSlots,
    selectedDate,
    onSelectDate,
    selectedTime,
    onSelectSlot,
    hasSelectedSlot,
    appointmentType,
    setAppointmentType,
    reason,
    setReason,
    onSubmit,
    onClose,
    selectedPatientId,
    setSelectedPatientId
}: BookingDialogContentProps) => {
    const minSelectableDate = addDays(new Date(), 0);

    const { user } = useUser();

    return (
        <DialogContent
            className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            onInteractOutside={(e) => e.preventDefault()}
        >
            <DialogHeader className="flex-shrink-0">
                <DialogTitle>Book Appointment</DialogTitle>
                <DialogDescription>with {doctorName}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-1">

                <div className="w-full overflow-x-auto flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && onSelectDate(date)}
                        disabled={(date) => date < minSelectableDate}
                        className="rounded-md border max-w-full"
                    />
                    </div>


                <div className="mb-4 mt-4">
                    <Label className="text-sm font-medium mb-2 block">Available Time Slots</Label>
                    {availableSlots.filter(s => s.is_available).length === 0 ? (
                        <p className="text-gray-500 text-sm py-8 text-center bg-gray-50 rounded-lg">
                            No available slots for this date
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableSlots.filter(s => s.is_available).map((slot) => {
                                const hour = parseISO(slot.start_time);
                                const endHour = parseISO(slot.end_time);
                                const isSelected = selectedTime && isSameMinute(selectedTime, hour);
                                const slotKey = `${slot.start_time}_${slot.end_time}`;

                                return (
                                    <button
                                        key={slotKey}
                                        type="button"
                                        className={cn(
                                            'relative bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 text-foreground',
                                            'hover:bg-primary/10 hover:border-primary/40 transition-all duration-200',
                                            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                                            isSelected && 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onSelectSlot(slot);
                                        }}
                                    >
                                        <div className="text-xs font-medium">
                                            {format(hour, 'HH:mm')} - {format(endHour, 'HH:mm')}
                                        </div>
                                        {isSelected && (
                                            <div className="absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-2 pointer-events-none" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={cn(
                    "space-y-4 border-t pt-4 transition-opacity duration-150",
                    !hasSelectedSlot && "opacity-0 pointer-events-none h-0 overflow-hidden"
                )}>
                    <div className="space-y-2">
                        <Label htmlFor="appointment-type">Appointment Type *</Label>
                        <Select
                            value={appointmentType ?? ""}
                            onValueChange={(value) => setAppointmentType(value as AppointmentType)}
                        >
                            <SelectTrigger id="appointment-type" className="w-full">
                                <SelectValue placeholder="Select appointment type" />
                            </SelectTrigger>
                            <SelectContent
                                className="max-h-[200px]"
                                position="popper"
                                sideOffset={5}
                            >
                                {APPOINTMENT_TYPES.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {user?.user_type === "clinic" && (
                        <div className="space-y-2">
                            <Label htmlFor="patient">Select Patient *</Label>
                            <GetPatientDropdown
                                value={selectedPatientId}
                                onChange={(id) => setSelectedPatientId(id)}
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Chief Complaint (optional)</Label>
                        <Input
                            id="reason"
                            placeholder="Brief reason for visit"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-6 text-sm font-medium border border-[#273c75] text-[#273c75] rounded-lg hover:text-white hover:bg-[#273c75] transition-colors"
                >
                    Close
                </button>
                <button
                    type="submit"
                    className="py-2.5 px-6 text-sm font-medium text-white rounded-lg bg-[#273c75] hover:bg-[#273c75]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onSubmit}
                    disabled={!hasSelectedSlot || !appointmentType}
                >
                    Book Appointment
                </button>
            </DialogFooter>
        </DialogContent>
    );
});

BookingDialogContent.displayName = "BookingDialogContent";

export default BookingDialogContent;