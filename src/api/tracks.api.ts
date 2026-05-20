import type { CreateTrackDto, Track } from "@/types";
import { apiClient } from "./client";

export const tracksApi = {
  getAll: (params?: { search?: string; genre?: string }) =>
    apiClient.get<Track[]>('/tracks', { params }),
  getOne: (id: number) => apiClient.get<Track>(`/tracks/${id}`),
  getMy: () => apiClient.get<Track[]>('/tracks/my'),
  create: (data: FormData) =>
    apiClient.post<Track>('/tracks', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: Partial<CreateTrackDto>) =>
    apiClient.patch<Track>(`/tracks/${id}`, data),
  delete: (id: number) => apiClient.delete(`/tracks/${id}`),
  incrementPlay: (id: number) => apiClient.post(`/tracks/${id}/play`),
  toggleLike: (id: number) => apiClient.post<{ liked: boolean }>(`/tracks/${id}/like`),
  getLikes: (id: number) => apiClient.get<{ count: number }>(`/tracks/${id}/likes`),
  getLiked: () => apiClient.get<{ track: Track }[]>('/tracks/liked'),
};