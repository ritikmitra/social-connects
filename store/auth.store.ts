import { create } from "zustand";
import { storage } from "@/services/storage.service";
import { User } from "@/types/auth";
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  hydrateUser: (user: User) => void;
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