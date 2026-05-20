import type { Comment } from "@/types";
import { apiClient } from "./client";

export const commentsApi = {
  getByTrack: (trackId: number) => apiClient.get<Comment[]>(`/tracks/${trackId}/comments`),
  create: (trackId: number, text: string) =>
    apiClient.post<Comment>(`/tracks/${trackId}/comments`, { text }),
  delete: (trackId: number, commentId: number) =>
    apiClient.delete(`/tracks/${trackId}/comments/${commentId}`),
};