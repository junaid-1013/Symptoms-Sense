import axiosInstance from "@/lib/axiosInstance";
import { RegisterPatientApiProps } from "@/types/patients";
import { RegisterPatientUrl } from "./URLs";

export const RegisterPatientApi = async ({
    age,
    gender,
    blood_group,
    emergency_contact,
    address,
    token
}: RegisterPatientApiProps) => {
    const response = await axiosInstance.post(
        `${RegisterPatientUrl}`,
        {
            age,
            gender,
            blood_group,
            emergency_contact,
            address
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    )
    return response;
}