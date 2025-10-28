import axiosInstance from "@/lib/axiosInstance";
import { RegisterDoctorApiProps } from "@/types";
import { RegisterDoctorUrl } from "./URLs";

export const DoctorOnboardingApi = async ({
  specialization,
  license_no,
  experience_years,
  bio,
  clinic_id,
  token
}: RegisterDoctorApiProps) => {
  const response = await axiosInstance.post(
    `${RegisterDoctorUrl}`,
    {
      specialization,
      license_no,
      experience_years,
      bio,
      clinic_id,
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
