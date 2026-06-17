import type { Playlist } from '@/types';
import { apiClient } from './client';

export const playlistsApi = {
  getMy: () => apiClient.get<Playlist[]>('/playlists'),
  getOne: (id: number) => apiClient.get<Playlist>(`/playlists/${id}`),
  getTracks: (id: number) => apiClient.get<Playlist>(`/playlists/${id}/tracks`),
  create: (name: string) => apiClient.post<Playlist>('/playlists', { name }),
  getExclusive: () => apiClient.get<Playlist[]>('/playlists/exclusive'),
  createExclusive: (name: string) => apiClient.post<Playlist>('/playlists/exclusive', { name }),
  setExclusive: (id: number, isExclusive: boolean) =>
    apiClient.patch<Playlist>(`/playlists/${id}/exclusive`, { isExclusive }),
  addTrack: (playlistId: number, trackId: number) =>
    apiClient.post(`/playlists/${playlistId}/tracks`, { trackId }),
  removeTrack: (playlistId: number, trackId: number) =>
    apiClient.delete(`/playlists/${playlistId}/tracks/${trackId}`),
  delete: (id: number) => apiClient.delete(`/playlists/${id}`),
};