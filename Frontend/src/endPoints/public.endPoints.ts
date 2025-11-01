import axiosInstance from "@/lib/axiosInstance";
import { GetAllDoctorsApiProps } from "@/types";
import { GetAllDoctorsUrl } from "./URLs";

export const GetAllDoctorsApi = async ({
    search,
    specialization,
    clinic
}: GetAllDoctorsApiProps) => {
    const response = await axiosInstance.get(
        `${GetAllDoctorsUrl}`,
        {
            params: {
                search: search ?? undefined,
                specialization: specialization ?? undefined,
                clinic_id: clinic ?? undefined,
            }
        }
    )
    return response;
}