import axiosInstance from "@/lib/axiosInstance";
import { BulkUpdateDoctorScheduleApiProps, CompleteAppointmentApiProps, RegisterDoctorApiProps } from "@/types";
import { DoctorReviewList } from "@/types/doctors";
import { BlockDoctorSlotUrl, BulkUpdateDoctorScheduleUrl, CompleteAppointmentUrl, DoctorReviewsUrl, GetDoctorDetailUrl, GetDoctorWeeklyScheduleUrl, RegisterDoctorUrl } from "./URLs";

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

export const GetDoctorReviewsApi = async ({
  doctor_id,
  page = 1,
  page_size = 10,
}: {
  doctor_id: string;
  page?: number;
  page_size?: number;
}) => {
  const response = await axiosInstance.get<{ data: DoctorReviewList }>(DoctorReviewsUrl(doctor_id), {
    params: { page, page_size },
  });
  return response;
};

export const PostDoctorReviewApi = async ({
  doctor_id,
  rating,
  review,
}: {
  doctor_id: string;
  rating: number;
  review: string;
}) => {
  const response = await axiosInstance.post(DoctorReviewsUrl(doctor_id), {
    rating,
    review,
  });
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
