import axiosInstance from "@/api/axios";

export const getConversationsApi = async () => {
    const { data } = await axiosInstance.get("/chat/conversations");
    return data;
}

export const getConversationMessagesApi = async (conversationId: string) => {
    const { data } = await axiosInstance.get(`/chat/conversations/${conversationId}/messages`);
    return data;
}

export const sendFirstMessageApi = async (receiverId: string, message: string) => {
    const { data } = await axiosInstance.post(`/chat/send-first-message`, {
        receiverId,
        content: message
    });
    return data;
}

export const registerForNotificationsApi = async (device_id: string, device_type: string, device_model: string, os_version: string, app_version: string, fcm_token: string) => {
    const { data } = await axiosInstance.post(`/user/register-device`, {
        device_id,
        device_type,
        device_model,
        os_version,
        app_version,
        fcm_token
    });
    return data;
}