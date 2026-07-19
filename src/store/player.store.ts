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
  analyser: AnalyserNode | null;

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

let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;

const connectAnalyser = (audio: HTMLAudioElement) => {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 128;
      analyserNode.smoothingTimeConstant = 0.8;
      analyserNode.connect(audioCtx.destination);
    }
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyserNode!);
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return analyserNode;
  } catch {
    return analyserNode;
  }
};

// Визуализатор виден только на десктопе (hidden md:block). Прогонять звук через AudioContext
// на телефоне нельзя: при блокировке/сворачивании ОС усыпляет контекст и музыка глохнет.
const isDesktop = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(min-width: 768px)').matches;

const hasMediaSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

// Экрану блокировки нужен абсолютный URL обложки — относительный путь ОС не подхватит.
const absoluteUrl = (u: string) =>
  !u ? '' : u.startsWith('http') ? u : `${window.location.origin}${u.startsWith('/') ? '' : '/'}${u}`;

const setMediaMetadata = (track: Track) => {
  if (!hasMediaSession()) return;
  const cover = absoluteUrl(resolveAssetUrl(track.cover_path));
  const artwork = cover
    ? ['96x96', '192x192', '256x256', '512x512'].map((sizes) => ({ src: cover, sizes, type: 'image/jpeg' }))
    : [];
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'NextSound',
      artist: track.user?.nickname || track.user?.firstName || 'NextSound',
      album: 'NextSound',
      artwork,
    });
  } catch { /* MediaMetadata недоступен */ }
};

let lastPositionSync = 0;
const updatePositionState = (audio: HTMLAudioElement) => {
  if (!hasMediaSession() || !navigator.mediaSession.setPositionState) return;
  const duration = audio.duration;
  if (!isFinite(duration) || duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      position: Math.min(Math.max(0, audio.currentTime), duration),
      playbackRate: audio.playbackRate || 1,
    });
  } catch { /* браузер может кинуть на кривых значениях */ }
};

let mediaHandlersBound = false;
const bindMediaHandlers = (get: () => PlayerState) => {
  if (mediaHandlersBound || !hasMediaSession()) return;
  mediaHandlersBound = true;
  const ms = navigator.mediaSession;
  const on = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
    try { ms.setActionHandler(action, handler); } catch { /* действие не поддержано */ }
  };
  on('play', () => { if (!get().isPlaying) get().togglePlay(); });
  on('pause', () => { if (get().isPlaying) get().togglePlay(); });
  on('previoustrack', () => get().prevTrack());
  on('nexttrack', () => get().nextTrack());
  on('seekbackward', (d) => get().seekTo(Math.max(0, get().progress - (d.seekOffset || 10))));
  on('seekforward', (d) => get().seekTo(Math.min(get().duration, get().progress + (d.seekOffset || 10))));
  on('seekto', (d) => { if (typeof d.seekTime === 'number') get().seekTo(d.seekTime); });
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],

  isPlaying: false,
  isPlayerExpanded: false,

  volume: 0.8,
  progress: 0,
  duration: 0,

  audio: null,
  analyser: null,

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

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.src = url;

    audio.volume = get().volume;

    // Анализатор (Web Audio) — только на десктопе, иначе ломается фоновое воспроизведение на телефоне.
    const analyser = isDesktop() ? connectAnalyser(audio) : null;

    audio.onloadedmetadata = () => {
      set({ duration: audio.duration });
      updatePositionState(audio);
    };

    audio.ontimeupdate = () => {
      set({ progress: audio.currentTime });
      const now = Date.now();
      if (now - lastPositionSync > 900) { lastPositionSync = now; updatePositionState(audio); }
    };

    // Синхронизируем состояние с реальными событиями элемента (в т.ч. паузу/плей с локскрина и наушников).
    audio.onplay = () => {
      set({ isPlaying: true });
      if (hasMediaSession()) navigator.mediaSession.playbackState = 'playing';
    };
    audio.onpause = () => {
      set({ isPlaying: false });
      if (hasMediaSession()) navigator.mediaSession.playbackState = 'paused';
    };

    audio.onended = () => {
      get().nextTrack();
    };

    audio.play();

    bindMediaHandlers(get);
    setMediaMetadata(track);
    if (hasMediaSession()) navigator.mediaSession.playbackState = 'playing';

    tracksApi.incrementPlay(track.id).catch(() => {});

    set({
      currentTrack: track,
      queue,
      isPlaying: true,
      audio,
      analyser,
      progress: 0,
    });
  },

  togglePlay: () => {
    const { audio, isPlaying } = get();

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (audioCtx?.state === 'suspended') audioCtx.resume();
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
    updatePositionState(audio);

    set({ progress: time });
  },
}));