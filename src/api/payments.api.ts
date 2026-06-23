import { apiClient } from './client';

export const paymentsApi = {
  createPayment: (plan: string) => apiClient.post<{ url: string }>('/payments/create', { plan }),
  createGift: (plan: string, recipient: string) =>
    apiClient.post<{ url: string }>('/payments/gift', { plan, recipient }),
};
