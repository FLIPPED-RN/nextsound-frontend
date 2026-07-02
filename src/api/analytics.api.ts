import { apiClient } from './client';

export interface Funnel {
  days: number;
  counts: { views: number; clicks: number; created: number; paid: number };
  rates: { viewToClick: number; clickToPaid: number; viewToPaid: number; checkoutToPaid: number };
  paidByPlan: { plan: string; count: number }[];
}

export const analyticsApi = {
  event: (type: string, plan?: string) =>
    apiClient.post('/analytics/event', { type, plan }).catch(() => undefined),
  funnel: (days = 30) => apiClient.get<Funnel>(`/analytics/funnel?days=${days}`),
};
