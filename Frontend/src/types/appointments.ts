import { APPOINTMENT_TYPES } from "@/config/constants";
import { Appointment } from "@/types";

export interface DoctorAppointmentItem {
    appointmentId: string;
    patientName: string;
    gender: string;
    age: number;
    date: string;
    time: string | number | Date;
    reason: string;
    status: string;
}
export interface AppointmentSectionProps {
    title: string;
    data: DoctorAppointmentItem[];
    cardClassName: string;
    sectionClassName?: string;
    onApprove?: (appointmentId: string) => void;
    onCancel?: (appointmentId: string) => void;
    setAppointments?: (appointments: Appointment[]) => void;
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
}
export interface GetAvailableSlotsApiProps {
    doctorId: string;
    date: string;
}
export interface CancelAppointmentApiProps{
    appointmentId: string;
}
export interface ApproveAppointmentApiProps{
    appointmentId: string;
}