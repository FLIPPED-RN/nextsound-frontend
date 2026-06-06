import type { Track } from '@/types';
import { create } from 'zustand';
import { resolveAssetUrl } from '@/lib/utils';
import { tracksApi } from '@/api/tracks.api';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];

  isPlaying: boolean;
  isPlayerExpanded: boolean;

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

  seekTo: (time: number) => void;

  setPlayerExpanded: (value: boolean) => void;
}

const getAudioUrl = (path?: string) => resolveAssetUrl(path);

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],

  isPlaying: false,
  isPlayerExpanded: false,

  volume: 0.8,
  progress: 0,
  duration: 0,

  audio: null,

  setPlayerExpanded: (value) =>
    set({ isPlayerExpanded: value }),

  setTrack: (track, queue = []) => {
    const currentAudio = get().audio;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }

    const url = getAudioUrl(track.file_path);

    if (!url) return;

    const audio = new Audio(url);

    audio.volume = get().volume;

    audio.onloadedmetadata = () => {
      set({ duration: audio.duration });
    };

    audio.ontimeupdate = () => {
      set({ progress: audio.currentTime });
    };

    audio.onended = () => {
      get().nextTrack();
    };

    audio.play();

    tracksApi.incrementPlay(track.id).catch(() => {});

    set({
      currentTrack: track,
      queue,
      isPlaying: true,
      audio,
      progress: 0,
    });
  },

  togglePlay: () => {
    const { audio, isPlaying } = get();

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    set({ isPlaying: !isPlaying });
  },

  nextTrack: () => {
    const { queue, currentTrack } = get();

    if (!currentTrack || !queue.length) return;

    const idx = queue.findIndex(
      (t) => t.id === currentTrack.id
    );

    const next = queue[idx + 1] || queue[0];

    get().setTrack(next, queue);
  },

  prevTrack: () => {
    const { queue, currentTrack } = get();

    if (!currentTrack || !queue.length) return;

    const idx = queue.findIndex(
      (t) => t.id === currentTrack.id
    );

    const prev =
      queue[idx - 1] || queue[queue.length - 1];

    get().setTrack(prev, queue);
  },

  setVolume: (vol) => {
    const { audio } = get();

    if (audio) {
      audio.volume = vol;
    }

    set({ volume: vol });
  },

  setProgress: (prog) => {
    set({ progress: prog });
  },

  setDuration: (dur) => {
    set({ duration: dur });
  },

  seekTo: (time) => {
    const { audio } = get();

    if (!audio) return;

    audio.currentTime = time;

    set({ progress: time });
  },
}));