import type { Album } from '@/types';
import { apiClient } from './client';

export const albumsApi = {
  getMine: () => apiClient.get<Album[]>('/albums/mine'),
  getByUser: (userId: number) => apiClient.get<Album[]>(`/albums/user/${userId}`),
  getOne: (id: number) => apiClient.get<Album>(`/albums/${id}`),
  create: (data: FormData) =>
    apiClient.post<Album>('/albums', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => apiClient.delete(`/albums/${id}`),
};
