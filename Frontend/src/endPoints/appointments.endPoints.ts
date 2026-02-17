import axiosInstance from "@/lib/axiosInstance";
import { ApproveAppointmentApiProps, CancelAppointmentApiProps, CreateAppointmentApiProps, GetAvailableSlotsApiProps, GetMyAppointmentsApiProps } from "@/types";
import { ApproveAppointmentApiUrl, CancelAppointmentApiUrl, CreateAppointmentApiUrl, GetAvailableSlotsApiUrl, GetMyAppointmentsApiUrl } from "./URLs";

export const GetAvailableSlotsApi = async ({
    doctorId,
    date,
    token
}: GetAvailableSlotsApiProps) => {
    const response = await axiosInstance.get(
        `${GetAvailableSlotsApiUrl.replace("{doctorId}", doctorId).replace("{date}", date)}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
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
    chiefComplaint,
    token
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
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}
export const GetMyAppointmentsApi = async ({
    token
}: GetMyAppointmentsApiProps) => {
    const response = await axiosInstance.get(
        `${GetMyAppointmentsApiUrl}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}
export const CancelAppointmentApi = async ({
    appointmentId,
    token
}: CancelAppointmentApiProps) => {
    const response = await axiosInstance.post(
        `${CancelAppointmentApiUrl.replace("{appointmentId}", appointmentId)}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}
export const ApproveAppointmentApi = async ({
    appointmentId,
    token
}: ApproveAppointmentApiProps) => {
    const response = await axiosInstance.post(
        `${ApproveAppointmentApiUrl.replace("{appointmentId}", appointmentId)}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}