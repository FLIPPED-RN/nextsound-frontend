import type { Comment } from "@/types";
import { apiClient } from "./client";

export const commentsApi = {
  getByTrack: (trackId: number) => apiClient.get<Comment[]>(`/tracks/${trackId}/comments`),
  create: (trackId: number, text: string, parentId?: number, timestamp?: number) =>
    apiClient.post<Comment>(`/tracks/${trackId}/comments`, { text, parentId, timestamp }),
  like: (trackId: number, commentId: number) =>
    apiClient.post<{ liked: boolean }>(`/tracks/${trackId}/comments/${commentId}/like`),
  delete: (trackId: number, commentId: number) =>
    apiClient.delete(`/tracks/${trackId}/comments/${commentId}`),
};
