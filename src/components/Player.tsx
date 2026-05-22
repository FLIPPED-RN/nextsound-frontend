import { usePlayerStore } from '../store/player.store';
import { tracksApi } from '../api/tracks.api';
import { Play, Pause, SkipBack, SkipForward, Heart, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

export const Player = () => {
  const {
    currentTrack, isPlaying, progress, duration, volume,
    togglePlay, nextTrack, prevTrack, setProgress, setVolume,
  } = usePlayerStore();
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTrack && user) {
      tracksApi.getLikes(currentTrack.id).then((res) => {
        setLiked(res.data.count > 0);
      }).catch(() => { });
    }
  }, [currentTrack, user]);

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setProgress(pct * duration);
  };

  const handleLike = async () => {
    if (!currentTrack || !user) return;
    await tracksApi.toggleLike(currentTrack.id);
    setLiked(!liked);
  };

  const getCoverUrl = (path?: string) => {
    if (!path) return '/default-cover.png';
    const cleanPath = path.replace(/\\/g, '/');
    if (cleanPath.startsWith('http')) return cleanPath;
    return `/${cleanPath}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="flex items-center h-full px-3 md:px-6 gap-3">
      {/* Track Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-0">
        <img
          src={getCoverUrl(currentTrack.cover_path)}
          alt=""
          className="w-16 h-16 rounded-lg object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-xs text-[#888888] truncate">
            {currentTrack.user?.nickname || currentTrack.user?.firstName}
          </p>
        </div>
        <button onClick={handleLike} className="ml-2 shrink-0">
          <Heart size={18} className={liked ? 'fill-red-500 text-red-500' : 'text-[#888888]'} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button onClick={prevTrack}><SkipBack size={20} /></button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-black"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button onClick={nextTrack}><SkipForward size={20} /></button>
        </div>
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="w-full max-w-xl h-1 bg-[#242424] rounded-full cursor-pointer group"
        >
          <div
            className="h-full bg-white rounded-full group-hover:bg-green-500 transition"
            style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between w-full max-w-xl text-[10px] text-[#888888]">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="hidden md:flex items-center gap-2 w-1/4 justify-end">
        <Volume2 size={18} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(+e.target.value)}
          className="w-24 h-1 accent-white"
        />
      </div>
    </div>
  );
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};