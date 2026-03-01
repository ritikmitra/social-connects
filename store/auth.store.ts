import { create } from "zustand";
import { storage } from "@/services/storage.service";

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  logout: () => Promise<void>;
  hydrateUser: (user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => {
    storage.setUser(user);
    set({
      user,
      isAuthenticated: true,
    });
  },

  hydrateUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  logout: async () => {
    await storage.removeUser();
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));