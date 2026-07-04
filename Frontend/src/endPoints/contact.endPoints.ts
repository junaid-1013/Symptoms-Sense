import axiosInstance from "@/lib/axiosInstance";
import { ContactFormData } from "@/types";
import { ContactUsApiUrl } from "./URLs";

export const ContactUsApi = async (payload: ContactFormData) => {
    const response = await axiosInstance.post(`${ContactUsApiUrl}`, {
        name: payload.name,
        email: payload.email,
        phone: String(payload.phone),
        subject: payload.subject,
        message: payload.message,
    });
    return response;
};