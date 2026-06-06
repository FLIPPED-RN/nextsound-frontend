import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, X } from 'lucide-react';
import { tracksApi } from '../api/tracks.api';
import { TrackCard } from '../components/TrackCard';

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => tracksApi.searchTracks(debounced).then((r) => r.data),
  });

  return (
    <div className="px-4 md:px-8 py-6 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5">Поиск</h1>
        <div className="relative max-w-2xl">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Треки, артисты, жанры..."
            autoFocus
            className="w-full pl-12 pr-12 py-3.5 bg-[#0e0e0e] border border-[#1f1f1f] rounded-full text-white outline-none transition focus:border-violet-500/60 placeholder:text-[#555]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {isLoading || isFetching ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => <div key={i} className="aspect-square bg-[#151515] rounded-2xl animate-pulse" />)}
        </div>
      ) : data?.length ? (
        <>
          <p className="text-sm text-[#888]">{debounced ? `Найдено: ${data.length}` : 'Все треки'}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.map((t) => <TrackCard key={t.id} track={t} />)}
          </div>
        </>
      ) : (
        <div className="text-center py-24 text-[#666]">
          <p className="text-lg">Ничего не найдено</p>
          <p className="text-sm mt-1">Попробуйте другой запрос</p>
        </div>
      )}
    </div>
  );
};
