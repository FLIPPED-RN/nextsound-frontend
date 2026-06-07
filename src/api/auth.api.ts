import type { LoginDto, RegisterDto, User } from '@/types';
import { apiClient } from './client';

export const authApi = {
  login: (data: LoginDto) => apiClient.post<{ messages: string; result: { user: User } }>('/auth/login', data),
  register: (data: RegisterDto) => apiClient.post<{ needVerification: boolean; email: string }>('/auth/signup', data),
  verify: (email: string, code: string) =>
    apiClient.post<{ messages: string; result: { user: User } }>('/auth/verify', { email, code }),
  resend: (email: string) => apiClient.post<{ sent?: boolean; alreadyVerified?: boolean }>('/auth/resend', { email }),
  logout: () => apiClient.get('/auth/logout'),
  getMe: () => apiClient.get<User>('/users/me'),
};
