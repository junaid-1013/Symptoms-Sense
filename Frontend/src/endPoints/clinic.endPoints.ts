import axiosInstance from "@/lib/axiosInstance";
import { ClinicDoctorDeleteApiProps, ClinicDoctorRegisterApiProps, RegisterClinicApiProps, AddMedicineApiProps, DeleteMedicineApiProps ,UpdateMedicineApiProps} from "@/types";
import { ClinicDoctorDeleteApiUrl, ClinicDoctorRegisterApiUrl, RegisterClinicUrl, AddMedicineApiUrl, DeleteMedicineApiUrl, UpdateMedicineApiUrl } from "./URLs";

export const RegisterClinicApi = async ({
    address,
    registration_no,
    established_year,
}: RegisterClinicApiProps) => {
    const response = await axiosInstance.post(
        `${RegisterClinicUrl}`,
        {
            address,
            registration_no,
            established_year
        }
    )
    return response;
}
export const ClinicDoctorRegisterApi = async ({
    email,
    name,
    phone,
    password
}: ClinicDoctorRegisterApiProps) => {
    const response = await axiosInstance.post(
        `${ClinicDoctorRegisterApiUrl}`,
        {
            email: email,
            name: name,
            phone: phone,
            password: password,
        }
    )
    return response;
}
export const clinicDoctorDeleteApi = async ({
    doctorId
}: ClinicDoctorDeleteApiProps) => {
    const response = await axiosInstance.delete(
        `${ClinicDoctorDeleteApiUrl}/${doctorId}`
    )
    return response;
}

export const AddMedicineApi = async ({
    name,
    description,
    manufacturer,
    category
}: AddMedicineApiProps) => {
    const response = await axiosInstance.post(
        `${AddMedicineApiUrl}`,
        {
            name,
            description,
            manufacturer,
            category
        }
    )

    return response;
}

export const DeleteMedicineApi = async ({
    medicineId
}: DeleteMedicineApiProps) => {
    const response = await axiosInstance.delete(
        `${DeleteMedicineApiUrl}/${medicineId}`
    )
    return response;
}

export const UpdateMedicineApi = async ({
    medicineId,
    name,
    description,
    manufacturer,
    category
}: UpdateMedicineApiProps) => {
    const response = await axiosInstance.put(
        `${UpdateMedicineApiUrl}/${medicineId}`,
        {
            name,
            description,
            manufacturer,
            category
        }
    )

    return response;
}