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

export interface AdminReport {
  id: number;
  trackId: number;
  reason: string;
  created_at: string;
  track: Track | null;
  reporter: User | null;
}

export const adminApi = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats'),
  getTracks: () => apiClient.get<Track[]>('/admin/tracks'),
  deleteTrack: (id: number) => apiClient.delete(`/admin/tracks/${id}`),
  setFeatured: (id: number, featured: boolean) =>
    apiClient.patch(`/admin/tracks/${id}/featured`, { featured }),
  getUsers: () => apiClient.get<AdminUser[]>('/admin/users'),
  setRole: (id: number, role: string) => apiClient.patch<User>(`/admin/users/${id}/role`, { role }),
  setArtistVerified: (id: number, verified: boolean) =>
    apiClient.patch<User>(`/admin/users/${id}/artist-verified`, { verified }),
  setPlan: (id: number, plan: string, days?: number) =>
    apiClient.patch<User>(`/admin/users/${id}/plan`, { plan, days }),
  deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`),
  getComments: () => apiClient.get<Comment[]>('/admin/comments'),
  deleteComment: (id: number) => apiClient.delete(`/admin/comments/${id}`),
  getReports: () => apiClient.get<AdminReport[]>('/admin/reports'),
  dismissReport: (id: number) => apiClient.delete(`/admin/reports/${id}`),
};
