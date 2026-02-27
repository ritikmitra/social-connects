import { useAuthStore } from "./auth.store";

export const getAuthState = () => useAuthStore.getState();