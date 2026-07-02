import { apiClient } from './client';

export interface CopyrightClaim {
  id: number;
  trackId?: number | null;
  trackUrl: string;
  claimantName: string;
  claimantEmail: string;
  claimantOrg?: string | null;
  description: string;
  status: string;
  adminNote?: string | null;
  created_at: string;
}

export interface ClaimInput {
  trackUrl: string;
  claimantName: string;
  claimantEmail: string;
  claimantOrg?: string;
  description: string;
  statement: boolean;
}

export const copyrightApi = {
  submit: (data: ClaimInput) => apiClient.post<{ ok: boolean }>('/copyright/claim', data),
  list: () => apiClient.get<CopyrightClaim[]>('/copyright/claims'),
  setStatus: (id: number, status: string, adminNote?: string) =>
    apiClient.patch<{ ok: boolean }>(`/copyright/claims/${id}`, { status, adminNote }),
};
