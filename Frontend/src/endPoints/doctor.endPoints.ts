import axiosInstance from "@/lib/axiosInstance";
import { BulkUpdateDoctorScheduleApiProps, CompleteAppointmentApiProps, RegisterDoctorApiProps } from "@/types";
import { BlockDoctorSlotUrl, BulkUpdateDoctorScheduleUrl, CompleteAppointmentUrl, GetDoctorDetailUrl, GetDoctorWeeklyScheduleUrl, RegisterDoctorUrl } from "./URLs";

export const DoctorOnboardingApi = async ({
  specializations,
  services,
  education,
  experience,
  license_no,
  experience_years,
  bio
}: RegisterDoctorApiProps) => {
  const response = await axiosInstance.post(
    `${RegisterDoctorUrl}`,
    {
      specializations,
      services,
      education,
      experience,
      license_no,
      experience_years,
      bio
    }
  );

  return response;
};
export const GetDoctorDetailApi = async ({ doctor_id }: { doctor_id: string }) => {
  const response = await axiosInstance.get(`${GetDoctorDetailUrl}/${doctor_id}`);
  return response;
};
export const GetDoctorWeeklyScheduleApi = async () => {
  const response = await axiosInstance.get(
    `${GetDoctorWeeklyScheduleUrl}`
  );
  return response;
};
export const BulkUpdateDoctorScheduleApi = async ({
  slotDuration, schedules
}: BulkUpdateDoctorScheduleApiProps) => {
  const response = await axiosInstance.put(
    `${BulkUpdateDoctorScheduleUrl}`,
    {
      slotDuration, schedules
    }
  );

  return response;
};

export const BlockDoctorSlotApi = async (payload: {
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  day_of_week: string;
  date?: string;
  reason?: string;
}) => {
  const { ...requestBody } = payload;
  
  const response = await axiosInstance.post(
    `${BlockDoctorSlotUrl}`,
    requestBody
  );
  return response;
};

export const UnblockDoctorSlotApi = async ({
  blocked_slot_id,
}: {
  blocked_slot_id: string;
}) => {
  const response = await axiosInstance.delete(
    `/schedules/blocked-slots/${blocked_slot_id}`
  );
  return response;
};

export const CompleteAppointmentApi = async ({
  appointment_id,
  symptoms,
  diagnosis,
  diagnosis_details,
  prescription_notes,
  prescription_instructions,
  medicines
}: CompleteAppointmentApiProps) => {
  const response = await axiosInstance.post(
    `${CompleteAppointmentUrl}`, 
    {
      appointment_id,
      symptoms,
      diagnosis,
      diagnosis_details,
      prescription_notes,
      prescription_instructions,
      medicines,
    }
  );

  return response;
};