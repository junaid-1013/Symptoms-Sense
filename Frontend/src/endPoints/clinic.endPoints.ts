import axiosInstance from "@/lib/axiosInstance";
import { ClinicDoctorDeleteApiProps, ClinicDoctorRegisterApiProps, RegisterClinicApiProps } from "@/types";
import { ClinicDoctorDeleteApiUrl, ClinicDoctorRegisterApiUrl, RegisterClinicUrl } from "./URLs";

export const RegisterClinicApi = async ({
    address,
    registration_no,
    established_year,
    token
}: RegisterClinicApiProps) => {
    const response = await axiosInstance.post(
        `${RegisterClinicUrl}`,
        {
            address,
            registration_no,
            established_year
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}
export const ClinicDoctorRegisterApi = async ({
    email,
    name,
    phone,
    password,
    token
}: ClinicDoctorRegisterApiProps) => {
    const response = await axiosInstance.post(
        `${ClinicDoctorRegisterApiUrl}`,
        {
            email: email,
            name: name,
            phone: phone,
            password: password,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}
export const clinicDoctorDeleteApi = async ({
    doctorId,
    token
}: ClinicDoctorDeleteApiProps) => {
    const response = await axiosInstance.delete(
        `${ClinicDoctorDeleteApiUrl}/${doctorId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}