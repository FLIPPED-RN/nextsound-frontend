import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Play } from 'lucide-react';
import { tracksApi } from '../api/tracks.api';
import { TrackCard } from '@/components/TrackCard';
import { usePlayerStore } from '../store/player.store';
import { resolveAssetUrl, formatCount } from '@/lib/utils';
import type { Track } from '@/types';

const Section = ({ title, tracks, loading }: { title: string; tracks?: Track[]; loading: boolean }) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {loading
        ? Array(5).fill(0).map((_, i) => <div key={i} className="aspect-square bg-[#151515] rounded-2xl animate-pulse" />)
        : tracks?.map((t) => <TrackCard key={t.id} track={t} />)}
    </div>
  </section>
);

export const DiscoverPage = () => {
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => tracksApi.getAll().then((r) => r.data),
  });
  const { setTrack } = usePlayerStore();

  const featured = tracks?.[0];
  const popular = useMemo(() => (tracks ? [...tracks].sort((a, b) => b.plays_count - a.plays_count) : []), [tracks]);

  return (
    <div className="px-4 md:px-8 py-6 space-y-10">
      {/* Featured hero */}
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
              <span className="text-xs tracking-widest text-violet-300 uppercase">Featured</span>
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

      <Section title="Новое" tracks={tracks} loading={isLoading} />
      <Section title="Популярное" tracks={popular} loading={isLoading} />
      <Section title="Стоит послушать" tracks={tracks} loading={isLoading} />

      {!isLoading && !tracks?.length && (
        <div className="text-center py-20 text-[#666]">
          <p className="text-lg">Пока нет треков</p>
          <p className="text-sm mt-1">Загрузите первый трек, чтобы начать</p>
        </div>
      )}
    </div>
  );
};
