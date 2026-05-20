// src/pages/LikedPage.tsx
import { useQuery } from '@tanstack/react-query';
import { tracksApi } from '../api/tracks.api';
import { TrackCard } from '../components/TrackCard';
import { Heart } from 'lucide-react';

export const LikedPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['liked'],
    queryFn: () => tracksApi.getLiked().then((r) => r.data),
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Heart size={28} className="fill-red-500 text-red-500" />
        <h2 className="text-3xl font-bold">Liked Tracks</h2>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-56 bg-[#151515] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data?.map(({ track }) => <TrackCard key={track.id} track={track} />)}
        </div>
      )}
    </div>
  );
};