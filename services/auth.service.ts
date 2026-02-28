import axios from "@/api/axios";


export const checkEmailExists = async (email: string) => {
    const { status } = await axios.post(`/auth/identify`, {
        email
    });
    return status;
}

export const loginApi = async (email: string, password: string) => {
    const { data } = await axios.post("/auth/login", {
        username: email,
        password,
    });
    return data;
};

export const getMeApi = async () => {
    const { data } = await axios.get("/user/me");
    return data;
};

export const requestOtp = async (email: string) => {
    const { data } = await axios.post("/auth/request-otp", {
        email
    })
    return data
}
export const verifyOtp = async (email: string, otp : string) => {
    const { data } = await axios.post("/auth/verify-otp", {
        email,
        otp
    })
    return data
}
export const logoutApi = async () => {
    await axios.post("/auth/logout");
};