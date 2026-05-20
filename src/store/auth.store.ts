import { authApi } from "@/api/auth.api";
import type { User } from "@/types";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Parameters<typeof authApi.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    set({ user: res.data.result.user });
  },
  register: async (data) => {
    await authApi.register(data);
  },
  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },
  fetchMe: async () => {
    try {
      const res = await authApi.getMe();
      set({ user: res.data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));