import { apiClient } from './client';

export const paymentsApi = {
  createPayment: (plan: string) => apiClient.post<{ url: string }>('/payments/create', { plan }),
};
