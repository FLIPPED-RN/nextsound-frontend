import type { LoginDto, RegisterDto, User } from '@/types';
import { apiClient } from './client';

export const authApi = {
  login: (data: LoginDto) => apiClient.post<{ messages: string; result: { user: User } }>('/auth/login', data),
  register: (data: RegisterDto) => apiClient.post<{ messages: string; result: User }>('/auth/signup', data),
  logout: () => apiClient.get('/auth/logout'),
  getMe: () => apiClient.get<User>('/users/me'),
};