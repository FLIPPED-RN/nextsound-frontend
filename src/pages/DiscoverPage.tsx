import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Crown, Lock, ChevronLeft, ChevronRight, Waves, LoaderCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { tracksApi } from '../api/tracks.api';
import { albumsApi } from '../api/albums.api';
import { playlistsApi } from '../api/playlists.api';
import { achievementsApi, type Progress } from '../api/achievements.api';
import { effectivePlan } from '../lib/plans';
import type { Playlist } from '@/types';
import { TrackCard } from '@/components/TrackCard';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { ArtistLink } from '@/components/ArtistLink';
import type { Album } from '@/types';
import { usePlayerStore } from '../store/player.store';
import { useAuthStore } from '../store/auth.store';
import { resolveAssetUrl, formatCount } from '@/lib/utils';
import type { Track, User } from '@/types';

const RowHeader = ({ title, scrollRef }: { title: React.ReactNode; scrollRef: React.RefObject<HTMLDivElement | null> }) => {
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 520, behavior: 'smooth' });
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg md:text-2xl font-bold">{title}</h2>
      <div className="hidden md:flex gap-1.5">
        <button onClick={() => scroll(-1)} aria-label="Назад" className="w-8 h-8 rounded-full border border-[#242424] flex items-center justify-center text-[#999] hover:text-white hover:border-white/40 transition"><ChevronLeft size={16} /></button>
        <button onClick={() => scroll(1)} aria-label="Вперёд" className="w-8 h-8 rounded-full border border-[#242424] flex items-center justify-center text-[#999] hover:text-white hover:border-white/40 transition"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

const Section = ({ title, tracks, loading }: { title: React.ReactNode; tracks?: Track[]; loading: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const list = (tracks || []).slice(0, 12);
  if (!loading && !list.length) return null;
  return (
    <section className="space-y-3">
      <RowHeader title={title} scrollRef={ref} />
      <div ref={ref} className="ns-row flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {loading
          ? Array(6).fill(0).map((_, i) => <div key={i} className="w-40 sm:w-44 shrink-0 aspect-square bg-[#151515] rounded-2xl animate-pulse" />)
          : list.map((t) => (
            <div key={t.id} className="w-40 sm:w-44 shrink-0 snap-start">
              <TrackCard track={t} />
            </div>
          ))}
      </div>
    </section>
  );
};

const NewArtists = ({ artists }: { artists: { user: User; count: number }[] }) => {
  const navigate = useNavigate();
  if (!artists.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg md:text-2xl font-bold">Новые имена</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {artists.map(({ user, count }) => (
          <button
            key={user.id}
            onClick={() => navigate(`/artist/${user.id}`)}
            className="shrink-0 w-28 flex flex-col items-center text-center group"
          >
            {user.avatar ? (
              <img src={resolveAssetUrl(user.avatar)} alt="" className="w-24 h-24 rounded-full object-cover group-hover:scale-105 transition" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-3xl font-bold group-hover:scale-105 transition">
                {(user.nickname || user.firstName || '?')[0]?.toUpperCase()}
              </div>
            )}
            <p className="text-sm font-medium truncate w-full mt-2 flex items-center justify-center gap-1">
              <span className="truncate">{user.nickname || user.firstName}</span>
              <VerifiedBadge verified={user.isArtistVerified} size={13} />
            </p>
            <p className="text-xs text-[#666]">{count} {count === 1 ? 'трек' : 'треков'}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

const AlbumsRow = ({ albums }: { albums?: Album[] }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  if (!albums?.length) return null;
  return (
    <section className="space-y-3">
      <RowHeader title="Новые альбомы" scrollRef={ref} />
      <div ref={ref} className="ns-row flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {albums.slice(0, 14).map((a) => (
          <button key={a.id} onClick={() => navigate(`/album/${a.id}`)} className="text-left group w-40 sm:w-44 shrink-0 snap-start">
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#151515]">
              <img src={resolveAssetUrl(a.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-full h-full object-cover group-hover:scale-105 transition" />
            </div>
            <p className="text-sm font-medium truncate mt-2">{a.title}</p>
            <p className="text-xs text-[#666] truncate"><ArtistLink user={a.user} id={a.userId} /> · {a.trackCount} тр.</p>
          </button>
        ))}
      </div>
    </section>
  );
};

const ExclusiveRow = ({ playlists }: { playlists?: Playlist[] }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  if (!playlists?.length) return null;
  return (
    <section className="space-y-3">
      <RowHeader title={<span className="flex items-center gap-2"><Crown size={20} className="text-violet-400" /> Эксклюзив</span>} scrollRef={ref} />
      <div ref={ref} className="ns-row flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {playlists.slice(0, 14).map((p) => (
          <button key={p.id} onClick={() => navigate(`/playlists/${p.id}`)} className="text-left group w-40 sm:w-44 shrink-0 snap-start">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/40 to-blue-600/30">
              {p.cover_path && <img src={resolveAssetUrl(p.cover_path)} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-cover group-hover:scale-105 transition" />}
              <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"><Lock size={13} className="text-violet-300" /></span>
            </div>
            <p className="text-sm font-medium truncate mt-2">{p.name}</p>
            <p className="text-xs text-[#666]">{p.trackCount} тр. · Plus</p>
          </button>
        ))}
      </div>
    </section>
  );
};

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${active ? 'bg-white text-black' : 'bg-[#161616] text-[#bbb] hover:bg-[#1f1f1f] hover:text-white'}`}
  >
    {children}
  </button>
);

const Top10 = ({ tracks }: { tracks: Track[] }) => {
  const { setTrack } = usePlayerStore();
  const list = tracks.slice(0, 10);
  if (!list.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg md:text-2xl font-bold">Топ-10 треков</h2>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-0.5">
        {list.map((t, i) => (
          <button key={t.id} onClick={() => setTrack(t, list)} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition text-left">
            <span className="w-6 text-center text-lg font-extrabold text-[#555] group-hover:text-white tabular-nums shrink-0">{i + 1}</span>
            <img src={resolveAssetUrl(t.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-11 h-11 rounded-lg object-cover bg-[#151515] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.title}</p>
              <p className="text-xs text-[#777] truncate flex items-center gap-1">
                <ArtistLink user={t.user} id={t.userId} className="truncate" />
                <VerifiedBadge verified={t.user?.isArtistVerified} size={11} />
              </p>
            </div>
            <span className="text-xs text-[#666] shrink-0 tabular-nums">{formatCount(t.plays_count)}</span>
            <span className="w-8 h-8 rounded-full bg-white text-black items-center justify-center hidden group-hover:flex shrink-0"><Play size={14} className="ml-0.5" /></span>
          </button>
        ))}
      </div>
    </section>
  );
};

const QuickGrid = ({ tracks }: { tracks: Track[] }) => {
  const { setTrack } = usePlayerStore();
  if (tracks.length < 2) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {tracks.map((t) => (
        <button key={t.id} onClick={() => setTrack(t, tracks)} className="group flex items-center gap-3 bg-[#161616] hover:bg-[#1f1f1f] rounded-xl overflow-hidden transition text-left">
          <img src={resolveAssetUrl(t.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-14 h-14 object-cover shrink-0 bg-[#151515]" />
          <span className="text-sm font-semibold truncate flex-1 pr-2">{t.title}</span>
          <span className="w-9 h-9 mr-2 rounded-full bg-white text-black items-center justify-center hidden group-hover:flex shrink-0"><Play size={15} className="ml-0.5" /></span>
        </button>
      ))}
    </div>
  );
};

const LevelStreak = ({ progress, onClick }: { progress: Progress; onClick: () => void }) => (
  <button onClick={onClick} className="inline-flex items-center gap-2.5 rounded-full bg-[#141414] border border-[#222] px-3 py-1.5 hover:border-[#333] transition">
    <span className="font-pixel text-[8px] text-fuchsia-200">LVL {progress.level}</span>
    <span className="w-20 h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden hidden sm:block"><span className="block h-full bg-fuchsia-500" style={{ width: `${progress.pct}%` }} /></span>
    {progress.streak > 0 && <span className="text-xs font-semibold whitespace-nowrap">🔥 {progress.streak}</span>}
  </button>
);

const PremiumTeaser = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/15 via-fuchsia-600/10 to-transparent p-4 md:p-5 flex items-center gap-4 hover:brightness-125 transition">
    <div className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0"><Crown size={22} className="text-violet-300" /></div>
    <div className="min-w-0 flex-1">
      <h3 className="font-bold">NextSound Premium</h3>
      <p className="text-sm text-[#bbb] truncate">Эксклюзив, расширенная статистика, кастомизация профиля — от 199 ₽/мес</p>
    </div>
    <ChevronRight size={20} className="text-[#888] shrink-0" />
  </button>
);

const UploadCTA = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-600/12 to-transparent p-4 md:p-5 flex items-center gap-4 hover:brightness-125 transition">
    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0"><Upload size={20} className="text-emerald-300" /></div>
    <div className="min-w-0 flex-1">
      <h3 className="font-bold">Поделись своей музыкой</h3>
      <p className="text-sm text-[#bbb] truncate">Загрузи первый трек — это бесплатно, до 5 треков на Free</p>
    </div>
    <ChevronRight size={20} className="text-[#888] shrink-0" />
  </button>
);

export const DiscoverPage = () => {
  const { user } = useAuthStore();
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => tracksApi.getAll().then((r) => r.data),
  });
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => tracksApi.getTrending().then((r) => r.data),
  });
  const { data: history } = useQuery({
    queryKey: ['history'],
    queryFn: () => tracksApi.getHistory().then((r) => r.data),
    enabled: !!user,
  });
  const { data: recentAlbums } = useQuery({
    queryKey: ['recent-albums'],
    queryFn: () => albumsApi.getRecent().then((r) => r.data),
  });
  const { data: exclusive } = useQuery({
    queryKey: ['exclusive-playlists'],
    queryFn: () => playlistsApi.getExclusive().then((r) => r.data),
  });
  const { data: liked } = useQuery({
    queryKey: ['home-liked'],
    queryFn: () => tracksApi.getLiked().then((r) => r.data),
    enabled: !!user,
  });
  const { data: achv } = useQuery({
    queryKey: ['home-achv'],
    queryFn: () => achievementsApi.mine().then((r) => r.data),
    enabled: !!user,
  });
  const { data: myTracks } = useQuery({
    queryKey: ['home-my-tracks'],
    queryFn: () => tracksApi.getMy().then((r) => r.data),
    enabled: !!user,
  });
  const navigate = useNavigate();
  const { setTrack } = usePlayerStore();
  const [flowLoading, setFlowLoading] = useState(false);

  const startFlow = async () => {
    setFlowLoading(true);
    try {
      const { data } = await tracksApi.getFlow();
      if (data.length) { setTrack(data[0], data); toast('🌊 Поток запущен'); }
      else toast.error('Пока нет треков для потока');
    } catch {
      toast.error('Не удалось запустить Поток');
    } finally {
      setFlowLoading(false);
    }
  };

  const featured = tracks?.find((t) => t.isFeatured) || tracks?.[0];
  const popular = useMemo(() => (tracks ? [...tracks].sort((a, b) => b.plays_count - a.plays_count) : []), [tracks]);

  const newArtists = useMemo(() => {
    if (!tracks) return [];
    const map = new Map<number, { user: User; count: number }>();
    for (const t of tracks) {
      if (!t.user) continue;
      const prev = map.get(t.userId);
      if (prev) prev.count += 1;
      else map.set(t.userId, { user: t.user, count: 1 });
    }
    return [...map.values()].sort((a, b) => +new Date(b.user.created_at) - +new Date(a.user.created_at)).slice(0, 12);
  }, [tracks]);

  const genres = useMemo(() => {
    const seen = new Map<string, string>(); // ключ в нижнем регистре -> отображаемое написание
    (tracks || []).forEach((t) => {
      (t.genre || '').split(',').forEach((raw) => {
        const g = raw.trim();
        // отсекаем мусор вроде «-»: нужен хотя бы 2-символьный жанр с буквой
        if (g.length >= 2 && /\p{L}/u.test(g) && !seen.has(g.toLowerCase())) seen.set(g.toLowerCase(), g);
      });
    });
    return [...seen.values()].slice(0, 12);
  }, [tracks]);
  const [genre, setGenre] = useState<string | null>(null);
  const newList = useMemo(() => {
    if (!genre) return tracks;
    const g = genre.toLowerCase();
    return (tracks || []).filter((t) => (t.genre || '').toLowerCase().split(',').map((s) => s.trim()).includes(g));
  }, [tracks, genre]);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  const name = user?.nickname || user?.firstName;

  // «Быстрый доступ» — недавнее прослушанное + любимое, без дублей.
  const quickTracks = useMemo(() => {
    const seen = new Set<number>();
    const out: Track[] = [];
    for (const t of [...(history || []), ...((liked || []).map((l) => l.track))]) {
      if (t && !seen.has(t.id)) { seen.add(t.id); out.push(t); }
    }
    return out.slice(0, 6);
  }, [history, liked]);

  const progress = achv?.progress;
  const isFree = !!user && effectivePlan(user) === 'free';
  const noUploads = !!user && !!myTracks && myTracks.length === 0;

  return (
    <div className="px-4 md:px-8 py-5 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-3xl font-extrabold truncate">
          {name ? `${greeting}, ${name}` : 'Открой для себя музыку'}
        </h1>
        <button
          onClick={startFlow}
          disabled={flowLoading}
          className="shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 hover:brightness-110 transition disabled:opacity-70"
          title="Бесконечная волна музыки под тебя"
        >
          {flowLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Waves size={16} />}
          Поток
        </button>
      </div>

      {user && progress && (
        <div className="-mt-4">
          <LevelStreak progress={progress} onClick={() => navigate(`/artist/${user.id}`)} />
        </div>
      )}

      {user && quickTracks.length >= 2 && (
        <section className="space-y-3">
          <h2 className="text-lg md:text-2xl font-bold">Быстрый доступ</h2>
          <QuickGrid tracks={quickTracks} />
        </section>
      )}

      {featured && (
        <div className="relative overflow-hidden rounded-2xl border border-white/5">
          <img src={resolveAssetUrl(featured.cover_path)} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black via-black/85 to-black/40" />
          <div className="relative flex flex-row items-center sm:items-end gap-4 sm:gap-6 p-4 sm:p-8 md:p-10">
            <button
              onClick={() => setTrack(featured, tracks || [])}
              className="group relative shrink-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl"
              aria-label="Слушать"
            >
              <img
                src={resolveAssetUrl(featured.cover_path)}
                alt={featured.title}
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }}
                className="w-24 h-24 sm:w-40 sm:h-40 md:w-44 md:h-44 object-cover bg-[#151515]"
              />
              <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <span className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center"><Play size={20} className="ml-0.5" /></span>
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-semibold tracking-wide text-violet-200 bg-violet-500/20 px-2.5 py-1 rounded-full">✦ Рекомендуем</span>
              <h1 className="text-xl sm:text-4xl md:text-5xl font-extrabold mt-2 sm:mt-3 line-clamp-2 sm:truncate leading-tight">{featured.title}</h1>
              <p className="text-xs sm:text-sm text-[#bbb] mt-1.5 flex items-center gap-1 flex-wrap">
                <ArtistLink user={featured.user} id={featured.userId} className="truncate max-w-[140px] sm:max-w-none" />
                <VerifiedBadge verified={featured.user?.isArtistVerified} />
                <span className="text-[#777]">· {formatCount(featured.plays_count)} прослуш.</span>
                {featured.genre && <span className="text-violet-300/80 hidden sm:inline">· {featured.genre}</span>}
              </p>
              <button
                onClick={() => setTrack(featured, tracks || [])}
                className="mt-3 sm:mt-5 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-black text-sm font-semibold inline-flex items-center gap-2 hover:scale-105 transition"
              >
                <Play size={16} /> Слушать
              </button>
            </div>
          </div>
        </div>
      )}

      {!!trending?.length && <Section title="🔥 В тренде за неделю" tracks={trending} loading={trendingLoading} />}
      <Top10 tracks={popular} />
      {noUploads && <UploadCTA onClick={() => navigate('/upload')} />}
      <ExclusiveRow playlists={exclusive} />
      {isFree && <PremiumTeaser onClick={() => navigate('/premium')} />}
      <NewArtists artists={newArtists} />

      <div className="space-y-3">
        {genres.length > 1 && (
          <div className="flex gap-2 overflow-x-auto ns-row -mx-1 px-1 pb-1">
            <Chip active={!genre} onClick={() => setGenre(null)}>Все</Chip>
            {genres.map((g) => <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>{g}</Chip>)}
          </div>
        )}
        <Section title={genre ? `Новое · ${genre}` : 'Новое'} tracks={newList} loading={isLoading} />
      </div>

      <AlbumsRow albums={recentAlbums} />

      {!isLoading && !tracks?.length && (
        <div className="text-center py-20 text-[#666]">
          <p className="text-lg">Пока нет треков</p>
          <p className="text-sm mt-1">Загрузите первый трек, чтобы начать</p>
        </div>
      )}
    </div>
  );
};
