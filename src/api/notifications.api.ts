import { apiClient } from './client';
import type { User } from '@/types';

export interface AppNotification {
  id: number;
  type: 'follow' | 'repost' | 'comment' | 'reply' | 'comment_like' | 'track_like' | 'new_track' | 'gift';
  actor: User;
  actorId: number;
  trackId?: number | null;
  commentId?: number | null;
  trackTitle?: string | null;
  trackCover?: string | null;
  isRead: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: () => apiClient.get<AppNotification[]>('/notifications'),
  unreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
  markRead: () => apiClient.patch('/notifications/read'),
};
