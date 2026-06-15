import type { UpdateProfileDto, User } from "@/types";
import { apiClient } from "./client";

export const usersApi = {
  getProfile: (id: number) => apiClient.get<User>(`/users/${id}`),
  follow: (id: number) => apiClient.post<{ following: boolean }>(`/users/${id}/follow`),
  getFollowInfo: (id: number) =>
    apiClient.get<{ followers: number; following: number; isFollowing: boolean }>(`/users/${id}/follow-info`),
  updateProfile: (data: UpdateProfileDto) => apiClient.patch<User>('/users/me', data),
  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.patch<{ ok: boolean }>('/users/me/password', { oldPassword, newPassword }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return apiClient.post<User>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBanner: (file: File) => {
    const form = new FormData();
    form.append('banner', file);
    return apiClient.post<User>('/users/me/banner', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
