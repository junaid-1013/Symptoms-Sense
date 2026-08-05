import { APPOINTMENT_TYPES } from "@/config/constants";
import { Appointment } from "@/types";
import { DoctorAppointmentItem } from "./appointments";
export interface DoctorReview {
    id: string;
    doctor_id: string;
    user_id: string;
    reviewer_name: string | null;
    reviewer_avatar: string | null;
    rating: number;
    review: string;
    created_at: string;
}
export interface DoctorReviewList {
    reviews: DoctorReview[];
    total: number;
    page: number;
    page_size: number;
}
export interface DoctorBasicInfo {
    id: string;
    user_id: string;
    name?: string;
    email?: string;
    specializations?: string[];
    experience_years?: number;
    bio?: string;
    clinic_name?: string;
    clinic_address?: string;
    status: string;
    img?: string;
    avatar_url?: string | null;
}
export interface RegisterDoctorApiProps {
    specializations: string[];
    services: string[];
    education: string[];
    experience: string[];
    license_no: string;
    experience_years: number;
    bio?: string;
}
export interface DoctorAppointmentCardProps {
    item: DoctorAppointmentItem;
    appointmentId: string;
    status: string;
    className?: string;
    onApprove?: (appointmentId: string) => void;
    onCancel?: (appointmentId: string) => void;
    setAppointments?: (appointments: Appointment[]) => void;
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
}
export interface DoctorData {
    id: string;
    user_id: string;
    name: string;
    avatar_url?: string | null;
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
    slotsLoading?: boolean;
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
    selectedPatientId: string | null;
    setSelectedPatientId: (id: string) => void;
};
export interface BookingDialogContentProps {
    doctorName: string;
    slotsLoading?: boolean;
    doctorAvatar?: string | null;
    doctorSpecialization?: string;
    clinicName?: string;
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
    onSubmit: () => void | Promise<void>;
    onClose: () => void;
    selectedPatientId: string | null;
    setSelectedPatientId: (id: string) => void;

};

export interface Medicine {
    name: string;
    description: string;
    manufacturer: string;
    category: string;
    dosage: string;
    frequency: string;
    duration_days: number;
}

export interface CompleteAppointmentApiProps {
    appointment_id: string;
    symptoms: string;
    diagnosis: string;
    diagnosis_details: string;
    prescription_notes: string;
    prescription_instructions: string;
    medicines: Medicine[];
}

export interface CompleteAppointmentProps {
    appointmentId: string;
    onComplete?: (updatedAppointment: { id: string; status: string }) => void;
    setAppointments?: (appointments: Appointment[]) => void;
}

export interface FormValues {
    symptoms: string;
    diagnosis: string;
    diagnosis_details: string;
    prescription_notes: string;
    prescription_instructions: string;
    medicines: {
        name: string;
        description: string;
        manufacturer: string;
        category: string;
        dosage: string;
        frequency: string;
        duration_days: number;
    }[];
}
