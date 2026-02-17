import axiosInstance from "@/lib/axiosInstance";
import { GetAllDoctorsApiProps } from "@/types";
import { GetAllDoctorsUrl } from "./URLs";
import { GetAllPatientsUrl } from "./URLs/patient.urls";

export const GetAllDoctorsApi = async ({
    search,
    specialization,
    clinic,
    page,
    page_size
}: GetAllDoctorsApiProps) => {
    const response = await axiosInstance.get(
        `${GetAllDoctorsUrl}`,
        {
            params: {
                search: search ?? undefined,
                specialization: specialization ?? undefined,
                clinic_id: clinic ?? undefined,
                page: page ?? undefined,
                page_size: page_size ?? undefined,
            }
        }
    )
    return response;
}

export const GetAllPatientsApi = async () => {
    const response = await axiosInstance.get(`${GetAllPatientsUrl}`);
    return response;
}