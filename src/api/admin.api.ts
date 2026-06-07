import { apiClient } from './client';
import type { Track, User, Comment } from '@/types';

export interface AdminStats {
  users: { total: number; listeners: number; artists: number; admins: number; new7d: number };
  tracks: { total: number; public: number; private: number; link: number; new7d: number };
  engagement: { playlists: number; comments: number; likes: number; uniquePlays: number; totalPlays: number };
  storage: { totalBytes: number; audioBytes: number; coverBytes: number; avatarBytes: number };
  topTracks: Track[];
  recentTracks: Track[];
  recentUsers: User[];
}

export type AdminUser = User & { trackCount: number };

export const adminApi = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats'),
  getTracks: () => apiClient.get<Track[]>('/admin/tracks'),
  deleteTrack: (id: number) => apiClient.delete(`/admin/tracks/${id}`),
  getUsers: () => apiClient.get<AdminUser[]>('/admin/users'),
  setRole: (id: number, role: string) => apiClient.patch<User>(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`),
  getComments: () => apiClient.get<Comment[]>('/admin/comments'),
  deleteComment: (id: number) => apiClient.delete(`/admin/comments/${id}`),
};
