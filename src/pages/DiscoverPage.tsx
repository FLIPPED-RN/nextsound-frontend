import { useQuery } from '@tanstack/react-query';
import { tracksApi } from '../api/tracks.api';
import { TrackCard } from '@/components/TrackCard';

export const DiscoverPage = () => {
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => tracksApi.getAll().then((r) => r.data),
  });

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h2 className="text-3xl font-bold">Главная</h2>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-56 bg-[#151515] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tracks?.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  );
};