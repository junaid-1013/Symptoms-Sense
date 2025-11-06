import axiosInstance from "@/lib/axiosInstance";
import { RegisterDoctorApiProps } from "@/types";
import { GetDoctorDetailUrl, RegisterDoctorUrl } from "./URLs";

export const DoctorOnboardingApi = async ({
  specializations,
  services,
  education,
  experience,
  license_no,
  experience_years,
  bio,
  token
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
export const GetDoctorDetailApi = async ({ doctor_id }: { doctor_id: string }) => {
  const response = await axiosInstance.get(`${GetDoctorDetailUrl}/${doctor_id}`);
  return response;
};