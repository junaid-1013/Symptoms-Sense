import axiosInstance from "@/lib/axiosInstance";
import { RegisterClinicApiProps } from "@/types";
import { RegisterClinicUrl } from "./URLs";

export const RegisterClientApi = async({
    address,
    registration_no,
    established_year,
    total_doctors,
    token
}: RegisterClinicApiProps ) => {
    const response = await axiosInstance.post(
        `${RegisterClinicUrl}`,
        {
                address,
                registration_no,
                established_year,
                total_doctors,
        },
        {
             headers: {
               Authorization: `Bearer ${token}`
            },
        }
    )

    return response;
}