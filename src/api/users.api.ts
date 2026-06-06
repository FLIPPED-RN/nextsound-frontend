import type { UpdateProfileDto, User } from "@/types";
import { apiClient } from "./client";

export const usersApi = {
  getProfile: (id: number) => apiClient.get<User>(`/users/${id}`),
  updateProfile: (data: UpdateProfileDto) => apiClient.patch<User>('/users/me', data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return apiClient.post<User>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
