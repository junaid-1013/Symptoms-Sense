import { APPOINTMENT_TYPES } from "@/config/constants";

export interface DoctorAppointmentItem {
    patientName: string;
    gender: string;
    age: number;
    date: string;
    time: string | number | Date;
    reason: string;
}
export interface AppointmentSectionProps {
    title: string;
    data: DoctorAppointmentItem[];
    cardClassName: string;
    sectionClassName?: string;
}
export interface CreateAppointmentApiProps {
    patientId: string;
    doctorId: string;
    clinicId?: string;
    startTime: string;
    endTime: string;
    generatedFromSchedule: string;
    appointmentType: (typeof APPOINTMENT_TYPES)[number];
    chiefComplaint?: string;
    token: string;
}
export interface GetAvailableSlotsApiProps {
    doctorId: string;
    date: string;
    token: string;
}