import GetPatientDropdown from "@/components/doctorDetailPageComps/GetPatientDropdown";
import DoctorPortrait from "@/components/doctor/DoctorPortrait";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APPOINTMENT_TYPES } from "@/config/constants";
import { useUser } from "@/contextApis/UserContext";
import { cn } from '@/lib/utils';
import { AppointmentType, AvailableSlot, BookingDialogContentProps } from '@/types';
import { addDays, format, isSameDay, isSameMinute, parseISO, startOfDay } from 'date-fns';
import { CalendarDays, Check, ChevronLeft, Clock, MapPin } from "lucide-react";
import { memo, useEffect, useMemo, useState } from 'react';

const STEPS = ["Time", "Details", "Confirm"] as const;
const DAYS_SHOWN = 14;

const groupSlots = (slots: AvailableSlot[]) => {
    const groups: Array<{ label: string; slots: AvailableSlot[] }> = [
        { label: "Morning", slots: [] },
        { label: "Afternoon", slots: [] },
        { label: "Evening", slots: [] },
    ];
    for (const slot of slots) {
        const hour = parseISO(slot.start_time).getHours();
        groups[hour < 12 ? 0 : hour < 17 ? 1 : 2].slots.push(slot);
    }
    return groups.filter((g) => g.slots.length > 0);
};

const BookingDialogContent = memo(({
    doctorName,
    slotsLoading,
    doctorAvatar,
    doctorSpecialization,
    clinicName,
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
    const { user } = useUser();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const isClinic = user?.user_type === "clinic";

    const today = useMemo(() => startOfDay(new Date()), []);
    const days = useMemo(() => Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i)), [today]);
    const openSlots = useMemo(() => availableSlots.filter((s) => s.is_available), [availableSlots]);
    const groups = useMemo(() => groupSlots(openSlots), [openSlots]);

    // Sensible default so most people never have to touch the type field.
    useEffect(() => {
        if (hasSelectedSlot && !appointmentType) setAppointmentType(APPOINTMENT_TYPES[0] as AppointmentType);
    }, [hasSelectedSlot, appointmentType, setAppointmentType]);

    const needsPatient = isClinic && !selectedPatientId;
    const slotOnThisDay = Boolean(selectedTime && isSameDay(selectedTime, selectedDate));
    const canContinue = step === 0 ? hasSelectedSlot && slotOnThisDay : step === 1 ? Boolean(appointmentType) && !needsPatient : true;

    const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
    const goBack = () => setStep((s) => Math.max(s - 1, 0));
    const submit = async () => {
        setSubmitting(true);
        try { await onSubmit(); } finally { setSubmitting(false); }
    };

    return (
        <DialogContent
            className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0"
            // Only guard against accidental dismissal once the user has picked something.
            onInteractOutside={(e) => { if (hasSelectedSlot) e.preventDefault(); }}
        >
            <DialogHeader className="space-y-3 border-b px-6 pb-4 pt-6 text-left">
                <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
                        <DoctorPortrait src={doctorAvatar} name={doctorName} className="object-cover object-top" sizes="44px" />
                    </div>
                    <div className="min-w-0">
                        <DialogTitle className="truncate text-lg">Book with {doctorName}</DialogTitle>
                        <DialogDescription className="truncate">
                            {[doctorSpecialization, clinicName].filter(Boolean).join(" · ") || "Choose a time that suits you"}
                        </DialogDescription>
                    </div>
                </div>
                <ol className="flex items-center gap-2 text-xs" aria-label="Booking steps">
                    {STEPS.map((label, i) => (
                        <li key={label} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
                            <span className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                                i < step && "border-primary bg-primary text-primary-foreground",
                                i === step && "border-primary text-primary",
                                i > step && "border-border text-muted-foreground",
                            )}>
                                {i < step ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                            </span>
                            <span className={cn("font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
                        </li>
                    ))}
                </ol>
            </DialogHeader>

            <div className="min-h-[18rem] flex-1 overflow-y-auto px-6 py-5">
                {step === 0 && (
                    <div className="space-y-5">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <Label className="text-sm font-medium">Pick a day</Label>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-primary">
                                            <CalendarDays className="h-3.5 w-3.5" aria-hidden /> More dates
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => { if (date) { onSelectDate(date); setCalendarOpen(false); } }}
                                            disabled={(date) => date < today}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2" role="listbox" aria-label="Days">
                                {days.map((day) => {
                                    const selected = isSameDay(day, selectedDate);
                                    return (
                                        <button
                                            key={day.toISOString()} type="button" role="option" aria-selected={selected}
                                            onClick={() => onSelectDate(day)}
                                            className={cn(
                                                "flex w-14 shrink-0 snap-start flex-col items-center rounded-xl border px-2 py-2 text-center transition-colors",
                                                selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
                                            )}
                                        >
                                            <span className="text-[11px] uppercase opacity-80">{isSameDay(day, today) ? "Today" : format(day, "EEE")}</span>
                                            <span className="text-lg font-semibold leading-tight">{format(day, "d")}</span>
                                            <span className="text-[11px] opacity-80">{format(day, "MMM")}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {!days.some((d) => isSameDay(d, selectedDate)) && (
                                <p className="mt-1 text-xs text-muted-foreground">Showing {format(selectedDate, "EEEE, d MMMM")}</p>
                            )}
                        </div>

                        <div>
                            <Label className="mb-2 block text-sm font-medium">Available times</Label>
                            {slotsLoading ? (
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy="true" aria-label="Loading times">
                                    {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />))}
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="rounded-xl border border-dashed py-8 text-center">
                                    <p className="text-sm text-muted-foreground">No open times on {format(selectedDate, "EEEE, d MMM")}.</p>
                                    <Button variant="link" size="sm" onClick={() => onSelectDate(addDays(selectedDate, 1))}>
                                        Try the next day
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {groups.map((group) => (
                                        <div key={group.label}>
                                            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
                                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                                {group.slots.map((slot) => {
                                                    const start = parseISO(slot.start_time);
                                                    const selected = Boolean(selectedTime && isSameMinute(selectedTime, start));
                                                    return (
                                                        <button
                                                            key={`${slot.start_time}_${slot.end_time}`} type="button" aria-pressed={selected}
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectSlot(slot); }}
                                                            className={cn(
                                                                "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                                                                selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50 hover:bg-primary/5",
                                                            )}
                                                        >
                                                            {format(start, "h:mm a")}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-5">
                        {isClinic && (
                            <div className="space-y-2">
                                <Label htmlFor="patient">Patient *</Label>
                                <GetPatientDropdown value={selectedPatientId} onChange={(id) => setSelectedPatientId(id)} />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="appointment-type">Type of visit</Label>
                            <Select value={appointmentType ?? ""} onValueChange={(value) => setAppointmentType(value as AppointmentType)}>
                                <SelectTrigger id="appointment-type" className="w-full">
                                    <SelectValue placeholder="Select type of visit" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]" position="popper" sideOffset={5}>
                                    {APPOINTMENT_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">What is the visit for? <span className="font-normal text-muted-foreground">(optional)</span></Label>
                            <Input
                                id="reason" placeholder="e.g. Recurring headaches for two weeks" maxLength={200}
                                value={reason} onChange={(e) => setReason(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Helps the doctor prepare. Don&apos;t include sensitive details.</p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Check the details, then confirm your booking.</p>
                        <dl className="divide-y rounded-xl border text-sm">
                            <div className="flex items-start gap-3 p-3">
                                <CalendarDays className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                                <div>
                                    <dt className="text-xs text-muted-foreground">Date</dt>
                                    <dd className="font-medium">{format(selectedDate, "EEEE, d MMMM yyyy")}</dd>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3">
                                <Clock className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                                <div>
                                    <dt className="text-xs text-muted-foreground">Time</dt>
                                    <dd className="font-medium">{selectedTime ? format(selectedTime, "h:mm a") : "-"}</dd>
                                </div>
                            </div>
                            {clinicName && (
                                <div className="flex items-start gap-3 p-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Clinic</dt>
                                        <dd className="font-medium">{clinicName}</dd>
                                    </div>
                                </div>
                            )}
                            <div className="p-3">
                                <dt className="text-xs text-muted-foreground">Visit</dt>
                                <dd className="font-medium">{appointmentType}{reason ? ` · ${reason}` : ""}</dd>
                            </div>
                        </dl>
                        <p className="text-xs text-muted-foreground">You can cancel or reschedule up to 24 hours before the appointment.</p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
                {step === 0 ? (
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                ) : (
                    <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
                        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden /> Back
                    </Button>
                )}
                {step < STEPS.length - 1 ? (
                    <Button type="button" onClick={goNext} disabled={!canContinue}>
                        {step === 0 ? "Continue" : "Review"}
                    </Button>
                ) : (
                    <Button type="button" onClick={submit} disabled={submitting || !hasSelectedSlot || !appointmentType}>
                        {submitting ? "Booking…" : "Confirm booking"}
                    </Button>
                )}
            </div>
        </DialogContent>
    );
});

BookingDialogContent.displayName = "BookingDialogContent";

export default BookingDialogContent;
