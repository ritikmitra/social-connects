import axiosInstance from "@/api/axios";
import axios from "axios";

export const checkEmailExistsApi = async (email: string) => {
    const { status } = await axiosInstance.post(`/auth/identify`, {
        email
    });
    return status;
}

export const registerApi = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    is_terms_accepted: boolean,
    is_usage_policy_accepted: boolean
) => {
    const { data } = await axiosInstance.post("/user/sign-up", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        is_terms_accepted,
        is_usage_policy_accepted,
    });
    return data;
}

export const resendEmailVerificationApi = async (email: string) => {
    const { data } = await axiosInstance.post("/user/resend-otp", {
        email
    });
    return data;
}

export const verifyEmailApi = async (email: string, otp: string) => {
    const { data } = await axiosInstance.post("/user/verify", {
        email,
        otp
    });
    return data;
}

export const loginApi = async (email: string, password: string) => {
    const { data } = await axiosInstance.post("/auth/login", {
        username: email,
        password,
    });
    return data;
};

export const refreshTokenApi = async () => {
    await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
    );
};

export const getMeApi = async () => {
    const { data } = await axiosInstance.get("/user/me");
    return data;
};

export const requestOtp = async (email: string) => {
    const { data } = await axiosInstance.post("/auth/request-otp", {
        email
    })
    return data
}
export const verifyOtp = async (email: string, otp: string) => {
    const { data } = await axiosInstance.post("/auth/verify-otp", {
        email,
        otp
    })
    return data
}
export const logoutApi = async () => {
    await axiosInstance.post("/auth/logout");
};
