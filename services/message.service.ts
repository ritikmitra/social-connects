import axiosInstance from "@/api/axios";

export const getConversationsApi = async () => {
    const { data } = await axiosInstance.get("/chat/conversations");
    return data;
}

export const getConversationMessagesApi = async (conversationId: string) => {
    const { data } = await axiosInstance.get(`/chat/conversations/${conversationId}/messages`);
    return data;
}