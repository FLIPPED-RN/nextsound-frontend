export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nickname?: string;
  email: string;
  role: 'listener' | 'artist' | 'admin';
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
  isArtistVerified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  bio?: string;
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

export interface Playlist {
  id: number;
  name: string;
  userId: number;
  user: User;
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
}

export interface CreateTrackDto {
  title: string;
  description?: string;
  genre?: string;
  featuring?: string;
  bpm?: number;
  visibility?: 'public' | 'private' | 'link';
}