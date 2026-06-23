import type { Achievement } from '@/types';
import { apiClient } from './client';

export interface Progress {
  xp: number;
  level: number;
  intoLevel: number;
  nextLevelXp: number;
  pct: number;
  streak: number;
  subscriber: boolean;
}

interface AchievementsResponse {
  achievements: Achievement[];
  unlockedCount: number;
  total: number;
  newly?: Achievement[];
  progress?: Progress;
}

export const achievementsApi = {
  mine: () => apiClient.get<AchievementsResponse>('/achievements'),
  ofUser: (userId: number) => apiClient.get<AchievementsResponse>(`/achievements/user/${userId}`),
  ping: () => apiClient.post<{ streak: number }>('/achievements/ping'),
};
