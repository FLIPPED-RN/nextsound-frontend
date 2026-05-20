import type { Track } from "@/types";
import { create } from "zustand";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  audio: HTMLAudioElement | null;
  setTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  setProgress: (prog: number) => void;
  setDuration: (dur: number) => void;
  seekTo: (time: number) => void;  // новый метод
}

const getAudioUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `/${path.replace(/\\/g, '/')}`;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  audio: null,
  setTrack: (track, queue = []) => {
    const currentAudio = get().audio;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }
    const audio = new Audio(getAudioUrl(track.file_path));
    audio.volume = get().volume;
    audio.onloadedmetadata = () => set({ duration: audio.duration });
    audio.ontimeupdate = () => set({ progress: audio.currentTime });
    audio.onended = () => get().nextTrack();
    audio.onerror = (e) => console.error('Audio error:', e);
    audio.play().catch(err => console.error('Play error:', err));
    set({ currentTrack: track, queue, isPlaying: true, audio });
  },
  togglePlay: () => {
    const { audio, isPlaying } = get();
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
    set({ isPlaying: !isPlaying });
  },
  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const next = queue[idx + 1] || queue[0];
    if (next) get().setTrack(next, queue);
  },
  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[idx - 1] || queue[queue.length - 1];
    if (prev) get().setTrack(prev, queue);
  },
  setVolume: (vol) => {
    const { audio } = get();
    if (audio) audio.volume = vol;
    set({ volume: vol });
  },
  setProgress: (prog) => {
    const { audio } = get();
    if (audio) audio.currentTime = prog;
    set({ progress: prog });
  },
  setDuration: (dur) => set({ duration: dur }),
  seekTo: (time) => {
    const { audio } = get();
    if (audio) {
      audio.currentTime = time;
      set({ progress: time });
    }
  },
}));