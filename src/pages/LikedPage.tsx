import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause } from 'lucide-react';
import { tracksApi } from '../api/tracks.api';
import { usePlayerStore } from '../store/player.store';
import { resolveAssetUrl, formatCount } from '@/lib/utils';

export const LikedPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['liked'],
    queryFn: () => tracksApi.getLiked().then((r) => r.data),
  });
  const { setTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  const tracks = (data || []).map((d) => d.track).filter(Boolean);

  return (
    <div className="px-4 md:px-8 py-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-8">
        <div className="w-44 h-44 rounded-2xl bg-gradient-to-br from-red-500 via-pink-600 to-violet-700 flex items-center justify-center shadow-2xl shrink-0">
          <Heart size={56} className="fill-white text-white" />
        </div>
        <div>
          <p className="text-xs tracking-widest text-[#666] uppercase mb-2">Плейлист</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Понравившиеся</h1>
          <p className="text-sm text-[#888] mt-3">{tracks.length} треков</p>
          {tracks.length > 0 && (
            <button onClick={() => setTrack(tracks[0], tracks)} className="mt-4 px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition">
              <Play size={16} /> Play All
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-14 bg-[#151515] rounded-lg animate-pulse" />)}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20 text-[#666]">
          <Heart size={40} className="mx-auto" />
          <p className="text-lg mt-4">Здесь пока пусто</p>
          <p className="text-sm mt-1">Лайкайте треки, и они появятся тут</p>
        </div>
      ) : (
        <div>
          {tracks.map((t, i) => {
            const isCurrent = currentTrack?.id === t.id;
            return (
              <div key={t.id} className={`group grid grid-cols-[24px_1fr_auto] gap-3 items-center px-3 py-2 rounded-lg transition ${isCurrent ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                <button onClick={() => (isCurrent ? togglePlay() : setTrack(t, tracks))} className="w-6 flex items-center justify-center text-[#888]">
                  {isCurrent && isPlaying
                    ? <Pause size={14} className="text-white" />
                    : <><span className="group-hover:hidden text-sm">{i + 1}</span><Play size={14} className="hidden group-hover:block text-white" /></>}
                </button>
                <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => navigate(`/track/${t.id}`)}>
                  <img src={resolveAssetUrl(t.cover_path)} alt="" onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-10 h-10 rounded object-cover bg-[#151515] shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : ''}`}>{t.title}</p>
                    <p className="text-xs text-[#666] truncate">{t.user?.nickname || t.user?.firstName}</p>
                  </div>
                </div>
                <span className="text-xs text-[#666] pr-2">{formatCount(t.plays_count)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
