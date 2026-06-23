import { apiClient } from './client';

export interface ArtistStats {
  subscriber: boolean;
  summary: {
    totalPlays: number;
    trackCount: number;
    uniqueListeners: number;
    followers: number;
    likes: number;
    comments: number;
    reposts: number;
  };
  topTracks: { id: number; title: string; cover_path?: string; plays_count: number }[];
  playsByDay: { date: string; count: number }[] | null;
  recentListeners: { id: number; nickname?: string; firstName?: string; avatar?: string }[] | null;
}

export const statsApi = {
  getMine: () => apiClient.get<ArtistStats>('/stats'),
};
