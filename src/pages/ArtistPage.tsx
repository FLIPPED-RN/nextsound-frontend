import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Play, Pause, Heart, BadgeCheck, MoreHorizontal, UserPlus, Check, BarChart3, AtSign, Send, Globe } from 'lucide-react';
import { usersApi } from '../api/users.api';
import { tracksApi } from '../api/tracks.api';
import { usePlayerStore } from '../store/player.store';
import { resolveAssetUrl, formatCount, formatNumber, formatDate, derivedStat } from '@/lib/utils';
import type { Track } from '@/types';

type Sort = 'popular' | 'latest' | 'oldest';

export const ArtistPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  const { data: artist } = useQuery({
    queryKey: ['artist', userId],
    queryFn: () => usersApi.getProfile(userId).then((r) => r.data),
  });
  const { data: tracks } = useQuery({
    queryKey: ['artistTracks', userId],
    queryFn: () => tracksApi.getByUser(userId).then((r) => r.data),
  });

  const { setTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const [sort, setSort] = useState<Sort>('popular');
  const [following, setFollowing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const list = [...(tracks || [])];
    if (sort === 'popular') list.sort((a, b) => b.plays_count - a.plays_count);
    if (sort === 'latest') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'oldest') list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return list;
  }, [tracks, sort]);

  if (!artist) {
    return (
      <div className="animate-pulse">
        <div className="h-64 md:h-80 bg-[#151515]" />
        <div className="p-8 space-y-4"><div className="h-8 w-48 bg-[#151515] rounded" /></div>
      </div>
    );
  }

  const name = artist.nickname || `${artist.firstName} ${artist.lastName}`;
  const totalPlays = (tracks || []).reduce((s, t) => s + (t.plays_count || 0), 0);
  const trackCount = tracks?.length || 0;
  const isVerified = artist.role === 'artist' || artist.role === 'admin';
  const banner = tracks?.[0]?.cover_path ? resolveAssetUrl(tracks[0].cover_path) : '';
  const followers = derivedStat(artist.id + 1, 1000, 200000);
  const monthlyListeners = derivedStat(artist.id + 2, 5000, 120000);
  const followingCount = derivedStat(artist.id + 3, 20, 500);
  const memberSince = new Date(artist.created_at).getFullYear() || 2024;

  const handlePlayAll = () => { if (sorted.length) setTrack(sorted[0], sorted); };

  const visible = showAll ? sorted : sorted.slice(0, 8);

  return (
    <div className="pb-8">
      {/* Banner */}
      <div className="relative h-64 md:h-80">
        {banner ? (
          <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700/40 via-blue-700/30 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-5">
          {isVerified && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full mb-3">
              <BadgeCheck size={14} className="text-blue-400" /> Verified Artist
            </span>
          )}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">{name}</h1>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-4 md:px-8 mt-5 flex flex-wrap items-center gap-4">
        <div className="flex -space-x-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-7 h-7 rounded-full border-2 border-black bg-gradient-to-br from-violet-500 to-blue-500" />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8a8a8a]">
          <span><span className="text-white font-semibold">{formatNumber(followers)}</span> followers</span>
          <span><span className="text-white font-semibold">{trackCount}</span> tracks</span>
          <span><span className="text-white font-semibold">{formatCount(totalPlays)}</span> plays</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setFollowing((f) => !f)}
            className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition ${following ? 'bg-[#222] text-white border border-[#333]' : 'bg-white text-black hover:opacity-90'}`}
          >
            {following ? <><Check size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
          </button>
          <button onClick={handlePlayAll} className="px-5 py-2 rounded-full text-sm font-semibold border border-[#242424] flex items-center gap-2 hover:border-white/50 transition">
            <Play size={16} /> Play All
          </button>
          <button className="w-9 h-9 rounded-full border border-[#242424] flex items-center justify-center hover:border-white/50 transition">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Tracks */}
      <div className="px-4 md:px-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Tracks</h2>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-[#666] mr-1">Sort by:</span>
            {(['popular', 'latest', 'oldest'] as Sort[]).map((s) => (
              <button key={s} onClick={() => setSort(s)} className={`px-2.5 py-1 rounded-full capitalize transition ${sort === s ? 'text-white font-semibold' : 'text-[#666] hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* table header */}
        <div className="hidden md:grid grid-cols-[24px_1fr_100px_120px_80px_40px] gap-4 px-3 pb-2 text-xs text-[#666] uppercase tracking-wider border-b border-[#1a1a1a]">
          <span>#</span><span>Title</span><span className="text-right">Plays</span><span className="text-right">Released</span><span className="text-right">Duration</span><span></span>
        </div>

        <div className="mt-1">
          {visible.map((t, i) => (
            <TrackRow key={t.id} t={t} index={i + 1}
              isPlaying={currentTrack?.id === t.id && isPlaying}
              isCurrent={currentTrack?.id === t.id}
              onPlay={() => { if (currentTrack?.id === t.id) togglePlay(); else setTrack(t, sorted); }}
              onOpen={() => navigate(`/track/${t.id}`)}
            />
          ))}
          {!sorted.length && <p className="text-sm text-[#666] py-6">У артиста пока нет треков.</p>}
        </div>

        {sorted.length > 8 && (
          <div className="flex justify-center mt-5">
            <button onClick={() => setShowAll((s) => !s)} className="px-5 py-2 rounded-full bg-[#151515] text-sm text-[#aaa] hover:bg-[#1f1f1f] transition">
              {showAll ? 'Show less' : `Show all ${trackCount} tracks`}
            </button>
          </div>
        )}
      </div>

      {/* About + Stats */}
      <div className="px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 border-t border-[#1a1a1a] pt-8">
        <div>
          <h3 className="text-xs tracking-widest text-[#666] uppercase mb-3">About</h3>
          <p className="text-sm text-[#bdbdbd] leading-relaxed">
            {name} — независимый артист на NextSound. {trackCount > 0 ? `Опубликовано ${trackCount} ${trackCount === 1 ? 'трек' : 'треков'}, суммарно ${formatNumber(totalPlays)} прослушиваний.` : 'Пока без публикаций.'} Слушайте, лайкайте и добавляйте треки в плейлисты.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a className="w-9 h-9 rounded-full bg-[#151515] flex items-center justify-center text-[#888] hover:text-white transition"><AtSign size={16} /></a>
            <a className="w-9 h-9 rounded-full bg-[#151515] flex items-center justify-center text-[#888] hover:text-white transition"><Send size={16} /></a>
            <a className="w-9 h-9 rounded-full bg-[#151515] flex items-center justify-center text-[#888] hover:text-white transition"><Globe size={16} /></a>
          </div>
        </div>
        <div>
          <h3 className="text-xs tracking-widest text-[#666] uppercase mb-3">Stats</h3>
          <dl className="space-y-3 text-sm">
            <StatRow k="Monthly Listeners" v={formatNumber(monthlyListeners)} />
            <StatRow k="Total Plays" v={formatCount(totalPlays)} />
            <StatRow k="Followers" v={formatNumber(followers)} />
            <StatRow k="Following" v={formatNumber(followingCount)} />
            <StatRow k="Member Since" v={String(memberSince)} />
          </dl>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-[#777]">{k}</dt>
    <dd className="text-white font-medium">{v}</dd>
  </div>
);

const TrackRow = ({ t, index, isPlaying, isCurrent, onPlay, onOpen }: {
  t: Track; index: number; isPlaying: boolean; isCurrent: boolean; onPlay: () => void; onOpen: () => void;
}) => {
  const cover = resolveAssetUrl(t.cover_path);
  const duration = `${3 + (t.id % 4)}:${(derivedStat(t.id, 0, 59)).toString().padStart(2, '0')}`;
  return (
    <div className={`group grid grid-cols-[24px_1fr_auto] md:grid-cols-[24px_1fr_100px_120px_80px_40px] gap-3 md:gap-4 items-center px-3 py-2 rounded-lg transition cursor-pointer ${isCurrent ? 'bg-white/5' : 'hover:bg-white/5'}`}>
      <button onClick={onPlay} className="w-6 flex items-center justify-center text-[#888]">
        {isCurrent ? (
          isPlaying ? <BarChart3 size={15} className="text-white" /> : <Pause size={14} className="text-white" />
        ) : (
          <>
            <span className="group-hover:hidden text-sm">{index}</span>
            <Play size={14} className="hidden group-hover:block text-white" />
          </>
        )}
      </button>
      <div className="flex items-center gap-3 min-w-0" onClick={onOpen}>
        <img src={cover} alt="" onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-10 h-10 rounded object-cover bg-[#151515] shrink-0" />
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : ''}`}>{t.title}</p>
          {t.genre && <p className="text-xs text-[#666] truncate">{t.genre}</p>}
        </div>
      </div>
      <span className="text-sm text-[#888] text-right hidden md:block">{formatCount(t.plays_count)}</span>
      <span className="text-sm text-[#888] text-right hidden md:block">{formatDate(t.release_date || t.created_at)}</span>
      <span className="text-sm text-[#888] text-right hidden md:block">{duration}</span>
      <button className="text-[#666] hover:text-red-400 transition justify-self-end" onClick={(e) => e.stopPropagation()}>
        <Heart size={15} />
      </button>
    </div>
  );
};
