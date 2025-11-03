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