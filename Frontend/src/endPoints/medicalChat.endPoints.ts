import axiosInstance from "@/lib/axiosInstance";

// All calls go through axiosInstance so an expired access token is refreshed instead of silently
// turning a signed-in user into an anonymous one.
const base = "medical-chat";

export const SendChatMessageApi = (body: {
    query: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    conversation_state?: unknown;
    conversation_id?: string;
}) => axiosInstance.post(base, body);

export const ListConversationsApi = () => axiosInstance.get(`${base}/conversations`);
export const GetConversationApi = (id: string) => axiosInstance.get(`${base}/conversations/${id}`);
export const DeleteConversationApi = (id: string) => axiosInstance.delete(`${base}/conversations/${id}`);
export const ChatActionApi = (conversationId: string, actionId: string, verb: "confirm" | "dismiss") =>
    axiosInstance.post(`${base}/conversations/${conversationId}/actions/${actionId}/${verb}`);
