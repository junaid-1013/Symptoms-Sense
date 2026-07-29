import axiosInstance from "@/lib/axiosInstance";
import { DeleteReminderUrl, RemindersUrl } from "./URLs";

export interface AddReminderPayload {
  medicine_name: string;
  dosage: number;
  medicine_type: string;
  days_of_week: string[];
  reminder_time: string;
}

export const GetMyRemindersApi = async () => {
  const response = await axiosInstance.get(RemindersUrl);
  return response;
};

export const GetReminderConfigApi = () =>
  axiosInstance.get<{ data: { timezone: string } }>(`${RemindersUrl}/config`);

export const AddReminderApi = async (payload: AddReminderPayload) => {
  const response = await axiosInstance.post(RemindersUrl, payload);
  return response;
};

export const DeleteReminderApi = async (id: string) => {
  const response = await axiosInstance.delete(DeleteReminderUrl(id));
  return response;
};
