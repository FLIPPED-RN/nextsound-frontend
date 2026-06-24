export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nickname?: string;
  email: string;
  role: 'listener' | 'artist' | 'admin';
  avatar?: string;
  banner?: string;
  links?: string;
  bio?: string;
  themeColor?: string | null;
  plan?: string;
  planExpires?: string | null;
  isVerified?: boolean;
  isArtistVerified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  telegram?: string;
  instagram?: string;
  vk?: string;
  youtube?: string;
  website?: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  bio?: string;
  links?: string;
  themeColor?: string | null;
}

export interface Track {
  id: number;
  title: string;
  description?: string;
  genre?: string;
  featuring?: string;
  bpm?: number;
  file_path: string;
  cover_path?: string;
  visibility: 'public' | 'private' | 'link';
  release_date: string;
  userId: number;
  albumId?: number | null;
  user: User;
  plays_count: number;
  size?: number;
  isFeatured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  text: string;
  userId: number;
  user: User;
  trackId: number;
  parentId?: number | null;
  timestamp?: number | null;
  likesCount?: number;
  likedByMe?: boolean;
  created_at: string;
}

export interface Album {
  id: number;
  title: string;
  cover_path?: string | null;
  userId: number;
  user?: User;
  created_at: string;
  trackCount?: number;
  tracks?: Track[];
  plays?: number;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  category: 'listener' | 'artist' | 'social' | 'special';
  premium: boolean;
  target: number;
  current: number;
  unlocked: boolean;
  unlockedNow?: boolean;
}

export interface Playlist {
  id: number;
  name: string;
  userId: number;
  user: User;
  isExclusive?: boolean;
  cover_path?: string | null;
  trackCount?: number;
  created_at: string;
  updated_at: string;
  tracks?: Track[];
}

export interface Like {
  id: number;
  userId: number;
  trackId: number;
  created_at: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  nickname?: string;
  email: string;
  password: string;
  consentPrivacy?: boolean;
  consentTerms?: boolean;
  consentMarketing?: boolean;
  ref?: string;
}

export interface CreateTrackDto {
  title: string;
  description?: string;
  genre?: string;
  featuring?: string;
  bpm?: number;
  visibility?: 'public' | 'private' | 'link';
}