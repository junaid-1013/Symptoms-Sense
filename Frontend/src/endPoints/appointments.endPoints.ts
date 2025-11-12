import axiosInstance from "@/lib/axiosInstance";
import { CreateAppointmentApiProps, GetAvailableSlotsApiProps } from "@/types";
import { CreateAppointmentApiUrl, GetAvailableSlotsApiUrl } from "./URLs";

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