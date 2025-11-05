import axiosInstance from "@/lib/axiosInstance";
import { RegisterDoctorApiProps, BulkUpdateDoctorScheduleApiProps } from "@/types";
import { RegisterDoctorUrl, BulkUpdateDoctorScheduleUrl } from "./URLs";

export const DoctorOnboardingApi = async ({
  specialization,
  license_no,
  experience_years,
  bio,
  token
}: RegisterDoctorApiProps) => {
  const response = await axiosInstance.post(
    `${RegisterDoctorUrl}`,
    {
      specialization,
      license_no,
      experience_years,
      bio,
      token
    },
    {
      headers: {
       Authorization: `Bearer ${token}`,
      },
    }
  );

  return response;
};

export const BulkUpdateDoctorScheduleApi = async ({
  slotDuration, schedules, token
}: BulkUpdateDoctorScheduleApiProps) => {
  const response = await axiosInstance.put(
    `${BulkUpdateDoctorScheduleUrl}`,
    {
      slotDuration, schedules, token
    },
    {
      headers: {
       Authorization: `Bearer ${token}`,
      },
    }
  );

  return response;
};