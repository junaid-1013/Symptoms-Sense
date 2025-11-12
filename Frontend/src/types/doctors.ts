import { APPOINTMENT_TYPES } from "@/config/constants";
import { DoctorAppointmentItem } from "./appointments";
export interface DocSchema {
    id: string,
    name: string,
    img: string,
    specialization: string[],
    education: string[],
    experience: (string | number)[],
    services: string[]
    about: string
    experienceYears: number,
    city: string,
    streetAddress: string
    reservations: (string | any)[]
    feedbacks: (string | any)[]
}
export interface DoctorBasicInfo {
    id: string;
    user_id: string;
    name?: string;
    email?: string;
    specialization?: string;
    experience_years?: number;
    bio?: string;
    clinic_name?: string;
    clinic_address?: string;
    status: string;
    img?: string;
}
export interface DoctorRegistrationFormValues {
    img: any;
    name: string;
    email: string;
    phone: string;
    image: FileList;
    services: string[];
    education: string[];
    specialization: string[];
    experienceYears: number;
    experienceDetails: string[];
    about: string;
    city: string;
    streetAddress: string;
}
export interface RegisterDoctorApiProps {
    specializations: string[];
    services: string[];
    education: string[];
    experience: string[];
    license_no: string;
    experience_years: number;
    bio?: string;
    token: string
}
export interface DoctorAppointmentCardProps {
    item: DoctorAppointmentItem;
    className?: string;
}
export interface DoctorScheduleDialogProps {
    open: boolean;
    onClose: () => void;
    day: string;
    slotDuration: string;
    onSave: (data: any) => void;
    existingData: any | null;
}
export interface BulkUpdateDoctorScheduleApiProps {
    slotDuration: number;
    schedules: any[];
    token: string;
}
export interface DoctorData {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string;
    specializations: string[];
    license_no: string;
    experience_years: number;
    bio: string;
    services: string[];
    education: string[];
    experience: string[];
    clinic_id: string;
    clinic_name: string;
    clinic_address: string;
    status: string;
    created_at: string;
};
export interface AvailableSlot {
    id: string | null;
    doctor_id: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
    generated_from_schedule: string;
};
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];
export interface AppointmentBookingCardProps {
    doctor: DoctorData;
    availableSlots: AvailableSlot[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    selectedTime: Date | null;
    selectedSlot: { startTime: string; endTime: string; generatedFromSchedule: string; } | null;
    onSelectSlot: (slot: AvailableSlot) => void;
    appointmentType?: AppointmentType;
    setAppointmentType: (type: AppointmentType) => void;
    reason: string;
    setReason: (reason: string) => void;
    isDialogOpen: boolean;
    setIsDialogOpen: (open: boolean) => void;
    onSubmit: () => void;
    isMobile: boolean;
};
export interface BookingDialogContentProps {
    doctorName: string;
    availableSlots: AvailableSlot[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    selectedTime: Date | null;
    onSelectSlot: (slot: AvailableSlot) => void;
    hasSelectedSlot: boolean;
    appointmentType?: AppointmentType;
    setAppointmentType: (val: AppointmentType) => void;
    reason: string;
    setReason: (val: string) => void;
    onSubmit: () => void;
    onClose: () => void;
};