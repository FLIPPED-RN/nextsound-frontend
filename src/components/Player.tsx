import { usePlayerStore } from '../store/player.store';
import { tracksApi } from '../api/tracks.api';

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
  } = usePlayerStore();

  const { user } = useAuthStore();

  const [liked, setLiked] = useState(false);

  const mobileProgressRef =
    useRef<HTMLDivElement>(null);

  const desktopProgressRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTrack && user) {
      tracksApi
        .getLikes(currentTrack.id)
        .then((res) => {
          setLiked(res.data.count > 0);
        })
        .catch(() => {});
    }
  }, [currentTrack, user]);

  const handleProgressClick = (
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
    if (!ref.current || !duration) return;

    const rect =
      ref.current.getBoundingClientRect();

    const pct =
      (e.clientX - rect.left) / rect.width;

    seekTo(pct * duration);
  };

  const handleLike = async () => {
    if (!currentTrack || !user) return;

    await tracksApi.toggleLike(currentTrack.id);

    setLiked(!liked);
  };

  const getCoverUrl = (path?: string) => {
    if (!path) return '/default-cover.png';

    const cleanPath = path.replace(/\\/g, '/');

    if (cleanPath.startsWith('http')) {
      return cleanPath;
    }

    return `/${cleanPath}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* FULLSCREEN MOBILE */}
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

            <div className="w-full mt-8 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold truncate">
                  {currentTrack.title}
                </h2>

                <p className="text-[#888] mt-1 truncate">
                  {currentTrack.user?.nickname ||
                    currentTrack.user?.firstName}
                </p>
              </div>

              <button onClick={handleLike}>
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

            {/* MOBILE PROGRESS */}
            <div className="w-full mt-8">
              <div
                ref={mobileProgressRef}
                onClick={(e) =>
                  handleProgressClick(
                    e,
                    mobileProgressRef
                  )
                }
                className="
                  w-full h-1.5
                  bg-[#2a2a2a]
                  rounded-full
                  cursor-pointer
                "
              >
                <div
                  className="
                    h-full bg-white rounded-full
                  "
                  style={{
                    width: `${
                      duration
                        ? (progress / duration) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex justify-between mt-2 text-xs text-[#888]">
                <span>{formatTime(progress)}</span>

                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* CONTROLS */}
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

            {/* VOLUME */}
            <div className="w-full flex items-center gap-3 mt-10">
              <Volume2 size={20} />

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) =>
                  setVolume(+e.target.value)
                }
                className="flex-1 accent-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MINI PLAYER */}
      <div className="flex items-center h-full px-3 md:px-6 gap-3">
        {/* MOBILE */}
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
            <p className="text-sm font-medium truncate">
              {currentTrack.title}
            </p>

            <p className="text-xs text-[#888888] truncate">
              {currentTrack.user?.nickname ||
                currentTrack.user?.firstName}
            </p>
          </div>
        </div>

        {/* MOBILE PLAY */}
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

        {/* DESKTOP */}
        <div className="hidden md:flex items-center gap-3 w-1/4 min-w-0">
          <img
            src={getCoverUrl(
              currentTrack.cover_path
            )}
            alt=""
            className="w-16 h-16 rounded-lg object-cover"
          />

          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {currentTrack.title}
            </p>

            <p className="text-xs text-[#888888] truncate">
              {currentTrack.user?.nickname ||
                currentTrack.user?.firstName}
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

        {/* DESKTOP CONTROLS */}
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
            <div
              ref={desktopProgressRef}
              onClick={(e) =>
                handleProgressClick(
                  e,
                  desktopProgressRef
                )
              }
              className="
                w-full h-1
                bg-[#242424]
                rounded-full
                cursor-pointer
              "
            >
              <div
                className="
                  h-full bg-white rounded-full
                "
                style={{
                  width: `${
                    duration
                      ? (progress / duration) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-[#888888] mt-1">
              <span>{formatTime(progress)}</span>

              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* DESKTOP VOLUME */}
        <div className="hidden md:flex items-center gap-2 w-1/4 justify-end">
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