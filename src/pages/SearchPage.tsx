import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tracksApi } from '../api/tracks.api';
import { TrackCard } from '../components/TrackCard';
import { Search } from 'lucide-react';

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => tracksApi.getAll({ search: query }).then((r) => r.data),
    enabled: query.length > 0,
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="relative max-w-md">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracks or artists..."
          className="w-full pl-12 pr-4 py-3 bg-[#151515] rounded-full text-white outline-none"
        />
      </div>
      {isLoading && <p className="text-[#888888]">Поиск...</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data?.map((t) => <TrackCard key={t.id} track={t} />)}
      </div>
    </div>
  );
};