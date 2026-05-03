import axios from "axios";

export async function refreshTokenRequest() {
  await axios.post(
    `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
}

