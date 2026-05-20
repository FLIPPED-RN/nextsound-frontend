import type { User } from "@/types";
import { apiClient } from "./client";

export const usersApi = {
  getProfile: (id: number) => apiClient.get<User>(`/users/${id}`),
  updateProfile: (data: Partial<User>) => apiClient.patch('/users/me', data),
};