import axiosInstance from "@/lib/axiosInstance";
import { FeedbackUrl } from "./URLs";

export const GetFeedbackApi = async (limit: number = 6, offset: number = 0) => {
    const response = await axiosInstance.get(`${FeedbackUrl}`, {
        params: { limit, offset },
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