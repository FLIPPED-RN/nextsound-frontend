import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://172.20.10.5:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config.url?.includes('/auth/') || error.config.url?.includes('/users/me');
      if (!isAuthRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);