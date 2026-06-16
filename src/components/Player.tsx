import { usePlayerStore } from '../store/player.store';
import { tracksApi } from '../api/tracks.api';
import { resolveAssetUrl } from '../lib/utils';
import { ScrollingText } from './ScrollingText';
import { VerifiedBadge } from './VerifiedBadge';

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Volume2,
  ChevronDown,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '../store/auth.store';

const Visualizer = ({ analyser, isPlaying, color = '#a855f7' }: { analyser: AnalyserNode | null; isPlaying: boolean; color?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (!isPlaying) return;
      analyser.getByteFrequencyData(data);
      const bars = 28;
      const step = Math.floor(data.length / bars);
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255;
        const bh = Math.max(2, v * h);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35 + v * 0.65;
        ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
      }
      ctx.globalAlpha = 1;
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser, isPlaying, color]);
  if (!analyser) return null;
  return <canvas ref={canvasRef} width={120} height={32} className="hidden md:block h-8 w-[120px] opacity-90" />;
};

const SeekBar = ({ value, max, onSeek, heightClass = 'h-1' }: { value: number; max: number; onSeek: (t: number) => void; heightClass?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const dragging = useRef(false);

  const pctAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const down = (e: React.PointerEvent) => {
    if (!max) return;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setScrub(pctAt(e.clientX));
  };
  const move = (e: React.PointerEvent) => { if (dragging.current) setScrub(pctAt(e.clientX)); };
  const up = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const p = pctAt(e.clientX);
    setScrub(null);
    if (max) onSeek(p * max);
  };

  const width = scrub != null ? scrub * 100 : (max ? (value / max) * 100 : 0);
  return (
    <div
      ref={ref}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className={`relative w-full ${heightClass} bg-[#2a2a2a] rounded-full cursor-pointer touch-none select-none group`}
    >
      <div className="h-full bg-white rounded-full" style={{ width: `${width}%` }} />
      <span
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow transition-opacity ${scrub != null ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        style={{ left: `${width}%` }}
      />
    </div>
  );
};

export const Player = () => {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,

    togglePlay,
    nextTrack,
    prevTrack,

    seekTo,
    setVolume,

    isPlayerExpanded,
    setPlayerExpanded,
    analyser,
  } = usePlayerStore();

  const { user } = useAuthStore();

  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (currentTrack && user) {
      tracksApi
        .getLikes(currentTrack.id)
        .then((res) => {
          setLiked(res.data.liked);
        })
        .catch(() => {});
    }
  }, [currentTrack, user]);

  const handleLike = async () => {
    if (!currentTrack || !user) return;

    await tracksApi.toggleLike(currentTrack.id);

    setLiked(!liked);
  };

  const getCoverUrl = (path?: string) => resolveAssetUrl(path) || '/default-cover.png';

  if (!currentTrack) return null;

  return (
    <>
      <div
        className={`
          md:hidden fixed inset-0 z-[100]
          bg-[#0b0b0b]
          transition-all duration-300
          ${
            isPlayerExpanded
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'
          }
        `}
      >
        <div className="flex flex-col h-full px-6 pt-6 pb-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                setPlayerExpanded(false)
              }
            >
              <ChevronDown size={28} />
            </button>

            <div className="text-xs text-[#888] uppercase tracking-widest">
              Сейчас играет
            </div>

            <div className="w-7" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <img
              src={getCoverUrl(
                currentTrack.cover_path
              )}
              alt=""
              className="
                w-full max-w-[340px]
                aspect-square
                rounded-3xl
                object-cover
              "
            />

            <div className="w-full mt-8 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <ScrollingText text={currentTrack.title} className="text-2xl font-bold" />
                <p className="text-[#888] mt-1 truncate flex items-center gap-1">
                  <span className="truncate">{currentTrack.user?.nickname || currentTrack.user?.firstName}</span>
                  <VerifiedBadge verified={currentTrack.user?.isArtistVerified} size={14} />
                </p>
              </div>

              <button onClick={handleLike} className="shrink-0">
                <Heart
                  size={24}
                  className={
                    liked
                      ? 'fill-red-500 text-red-500'
                      : 'text-[#888]'
                  }
                />
              </button>
            </div>

            <div className="w-full mt-8">
              <SeekBar value={progress} max={duration} onSeek={seekTo} heightClass="h-1.5" />

              <div className="flex justify-between mt-2 text-xs text-[#888]">
                <span>{formatTime(progress)}</span>

                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-8 mt-10">
              <button onClick={prevTrack}>
                <SkipBack size={34} />
              </button>

              <button
                onClick={togglePlay}
                className="
                  w-20 h-20 rounded-full
                  bg-white text-black
                  flex items-center justify-center
                "
              >
                {isPlaying ? (
                  <Pause size={34} />
                ) : (
                  <Play
                    size={34}
                    className="ml-1"
                  />
                )}
              </button>

              <button onClick={nextTrack}>
                <SkipForward size={34} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center h-full px-3 md:px-6 gap-3">
        <div
          className="
            md:hidden
            flex items-center gap-3
            flex-1 min-w-0
            cursor-pointer
          "
          onClick={() =>
            setPlayerExpanded(true)
          }
        >
          <img
            src={getCoverUrl(
              currentTrack.cover_path
            )}
            alt=""
            className="
              w-12 h-12 rounded-lg
              object-cover shrink-0
            "
          />

          <div className="min-w-0 flex-1">
            <ScrollingText text={currentTrack.title} className="text-sm font-medium" />
            <p className="text-xs text-[#888888] truncate flex items-center gap-1">
              <span className="truncate">{currentTrack.user?.nickname || currentTrack.user?.firstName}</span>
              <VerifiedBadge verified={currentTrack.user?.isArtistVerified} size={12} />
            </p>
          </div>
        </div>

        <button
          className="md:hidden"
          onClick={(e) => {
            e.stopPropagation();

            togglePlay();
          }}
        >
          {isPlaying ? (
            <Pause size={22} />
          ) : (
            <Play size={22} />
          )}
        </button>

        <div className="hidden md:flex items-center gap-3 w-1/4 min-w-0">
          <img
            src={getCoverUrl(
              currentTrack.cover_path
            )}
            alt=""
            className="w-16 h-16 rounded-lg object-cover"
          />

          <div className="min-w-0">
            <ScrollingText text={currentTrack.title} className="text-sm font-medium" />
            <p className="text-xs text-[#888888] truncate flex items-center gap-1">
              <span className="truncate">{currentTrack.user?.nickname || currentTrack.user?.firstName}</span>
              <VerifiedBadge verified={currentTrack.user?.isArtistVerified} size={12} />
            </p>
          </div>

          <button onClick={handleLike}>
            <Heart
              size={18}
              className={
                liked
                  ? 'fill-red-500 text-red-500'
                  : 'text-[#888888]'
              }
            />
          </button>
        </div>

        <div className="hidden md:flex flex-1 flex-col items-center">
          <div className="flex items-center gap-4">
            <button onClick={prevTrack}>
              <SkipBack size={20} />
            </button>

            <button
              onClick={togglePlay}
              className="
                w-9 h-9 rounded-full
                bg-white text-black
                flex items-center justify-center
              "
            >
              {isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play
                  size={18}
                  className="ml-0.5"
                />
              )}
            </button>

            <button onClick={nextTrack}>
              <SkipForward size={20} />
            </button>
          </div>

          <div className="w-full max-w-xl mt-2">
            <SeekBar value={progress} max={duration} onSeek={seekTo} heightClass="h-1" />

            <div className="flex justify-between text-[10px] text-[#888888] mt-1">
              <span>{formatTime(progress)}</span>

              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 w-1/4 justify-end">
          <Visualizer analyser={analyser} isPlaying={isPlaying} />
          <Volume2 size={18} />

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) =>
              setVolume(+e.target.value)
            }
            className="w-24 h-1 accent-white"
          />
        </div>
      </div>
    </>
  );
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);

  const sec = Math.floor(s % 60);

  return `${m}:${sec
    .toString()
    .padStart(2, '0')}`;
};