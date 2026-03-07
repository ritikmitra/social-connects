import axios from "axios";
import { getAuthState } from "@/store/";

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  withCredentials: true,
});

// Global Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
    //   await getAuthState().logout();
    }
    throw error;
  }
);

export default axiosInstance;