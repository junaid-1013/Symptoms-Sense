import axiosInstance from "@/lib/axiosInstance";
import { ClinicDoctorDeleteApiProps, ClinicDoctorRegisterApiProps, RegisterClinicApiProps, AddMedicineApiProps, DeleteMedicineApiProps ,UpdateMedicineApiProps} from "@/types";
import { ClinicDoctorDeleteApiUrl, ClinicDoctorRegisterApiUrl, RegisterClinicUrl, AddMedicineApiUrl, DeleteMedicineApiUrl, UpdateMedicineApiUrl } from "./URLs";

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

export const AddMedicineApi = async ({
    name,
    description,
    manufacturer,
    category,
    token
}: AddMedicineApiProps) => {
    const response = await axiosInstance.post(
        `${AddMedicineApiUrl}`,
        {
            name,
            description,
            manufacturer,
            category
        },
        {
         headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )

    return response;
}

export const DeleteMedicineApi = async ({
    medicineId,
    token
}: DeleteMedicineApiProps) => {
    const response = await axiosInstance.delete(
        `${DeleteMedicineApiUrl}/${medicineId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}

export const UpdateMedicineApi = async ({
    medicineId,
    name,
    description,
    manufacturer,
    category,
    token
}: UpdateMedicineApiProps) => {
    const response = await axiosInstance.put(
        `${UpdateMedicineApiUrl}/${medicineId}`,
        {
            name,
            description,
            manufacturer,
            category
        },
        {
         headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )

    return response;
}