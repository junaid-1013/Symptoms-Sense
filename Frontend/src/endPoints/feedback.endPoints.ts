import axiosInstance from "@/lib/axiosInstance";
import { FeedbackUrl } from "./URLs";

export const GetFeedbackApi = async (limit: number = 6) => {
    const response = await axiosInstance.get(`${FeedbackUrl}`, {
        params: { limit },
    });
    return response;
};

export const PostFeedbackApi = async (payload: { rating?: number; message: string }) => {
    const response = await axiosInstance.post(`${FeedbackUrl}`, {
        rating: payload.rating,
        message: payload.message,
    });
    return response;
};