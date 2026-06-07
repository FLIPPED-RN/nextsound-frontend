import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { tracksApi } from '../api/tracks.api';
import { TrackCard } from '@/components/TrackCard';
import { usePlayerStore } from '../store/player.store';
import { resolveAssetUrl, formatCount } from '@/lib/utils';
import type { Track, User } from '@/types';

const Section = ({ title, tracks, loading }: { title: string; tracks?: Track[]; loading: boolean }) => {
  const list = (tracks || []).slice(0, 10);
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading
          ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-square bg-[#151515] rounded-2xl animate-pulse" />)
          : list.map((t, i) => (
            <div key={t.id} className={i >= 8 ? 'hidden lg:block' : ''}>
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
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Новые имена</h2>
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
            <p className="text-sm font-medium truncate w-full mt-2">{user.nickname || user.firstName}</p>
            <p className="text-xs text-[#666]">{count} {count === 1 ? 'трек' : 'треков'}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export const DiscoverPage = () => {
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => tracksApi.getAll().then((r) => r.data),
  });
  const { setTrack } = usePlayerStore();

  const featured = tracks?.[0];
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

  return (
    <div className="px-4 md:px-8 py-6 space-y-10">
      {featured && (
        <div className="relative overflow-hidden rounded-3xl">
          <img src={resolveAssetUrl(featured.cover_path)} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 md:p-10">
            <img
              src={resolveAssetUrl(featured.cover_path)}
              alt={featured.title}
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }}
              className="w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover shadow-2xl bg-[#151515] shrink-0"
            />
            <div className="min-w-0">
              <span className="text-xs tracking-widest text-violet-300 uppercase">Рекомендуем</span>
              <h1 className="text-3xl md:text-5xl font-extrabold mt-2 truncate">{featured.title}</h1>
              <p className="text-sm text-[#bbb] mt-2">{featured.user?.nickname || featured.user?.firstName} · {formatCount(featured.plays_count)} прослушиваний</p>
              <button
                onClick={() => setTrack(featured, tracks || [])}
                className="mt-5 px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold inline-flex items-center gap-2 hover:scale-105 transition"
              >
                <Play size={16} /> Слушать
              </button>
            </div>
          </div>
        </div>
      )}

      <NewArtists artists={newArtists} />
      <Section title="Новое" tracks={tracks} loading={isLoading} />
      <Section title="Популярное" tracks={popular} loading={isLoading} />

      {!isLoading && !tracks?.length && (
        <div className="text-center py-20 text-[#666]">
          <p className="text-lg">Пока нет треков</p>
          <p className="text-sm mt-1">Загрузите первый трек, чтобы начать</p>
        </div>
      )}
    </div>
  );
};
