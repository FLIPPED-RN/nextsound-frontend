import type { Achievement } from '@/types';
import { apiClient } from './client';

interface AchievementsResponse {
  achievements: Achievement[];
  unlockedCount: number;
  total: number;
  newly?: Achievement[];
}

export const achievementsApi = {
  mine: () => apiClient.get<AchievementsResponse>('/achievements'),
  ofUser: (userId: number) => apiClient.get<AchievementsResponse>(`/achievements/user/${userId}`),
};
