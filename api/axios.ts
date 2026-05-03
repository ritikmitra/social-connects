import axios from "axios";
import { getAuthState } from "@/store/";
import { refreshTokenRequest } from "@/api/auth";
import { router } from "expo-router";

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 3000,
  withCredentials: true,
});

// Global Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        await refreshTokenRequest();
        console.log('refreshed token');
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log(refreshError,'refreshError');
        await getAuthState().logout();
        router.replace('/auth/email');
        
        throw refreshError;
      }
    }

    throw error;
  }
);

export default axiosInstance;