import axiosInstance from "@/lib/axiosInstance";
import { ApproveAppointmentApiProps, CancelAppointmentApiProps, CreateAppointmentApiProps, GetAvailableSlotsApiProps } from "@/types";
import { ApproveAppointmentApiUrl, CancelAppointmentApiUrl, CreateAppointmentApiUrl, GetAvailableSlotsApiUrl, GetMyAppointmentsApiUrl } from "./URLs";

export const GetAvailableSlotsApi = async ({
    doctorId,
    date
}: GetAvailableSlotsApiProps) => {
    const response = await axiosInstance.get(
        `${GetAvailableSlotsApiUrl.replace("{doctorId}", doctorId).replace("{date}", date)}`
    )
    return response;
}
export const CreateAppointmentApi = async ({
    patientId,
    doctorId,
    clinicId,
    startTime,
    endTime,
    generatedFromSchedule,
    appointmentType,
    chiefComplaint
}: CreateAppointmentApiProps) => {
    const response = await axiosInstance.post(
        `${CreateAppointmentApiUrl}`,
        {
            patient_id: patientId,
            doctor_id: doctorId,
            clinic_id: clinicId,
            start_time: startTime,
            end_time: endTime,
            generated_from_schedule: generatedFromSchedule,
            appointment_type: appointmentType,
            chief_complaint: chiefComplaint
        }
    )
    return response;
}
export const GetMyAppointmentsApi = async () => {
    const response = await axiosInstance.get(
        `${GetMyAppointmentsApiUrl}`
    )
    return response;
}
export const CancelAppointmentApi = async ({
    appointmentId,
}: CancelAppointmentApiProps) => {
    const response = await axiosInstance.post(
        `${CancelAppointmentApiUrl.replace("{appointmentId}", appointmentId)}`,
        {}
    )
    return response;
}
export const ApproveAppointmentApi = async ({
    appointmentId,
}: ApproveAppointmentApiProps) => {
    const response = await axiosInstance.post(
        `${ApproveAppointmentApiUrl.replace("{appointmentId}", appointmentId)}`,
        {}
    )
    return response;
}