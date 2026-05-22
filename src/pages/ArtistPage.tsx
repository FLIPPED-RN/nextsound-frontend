import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { tracksApi } from '../api/tracks.api';
import { usePlayerStore } from '../store/player.store';
import { Play } from 'lucide-react';

export const ArtistPage = () => {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { data: artist } = useQuery({
    queryKey: ['artist', userId],
    queryFn: () => usersApi.getProfile(userId).then((r) => r.data),
  });
  const { data: tracks } = useQuery({
    queryKey: ['artistTracks', userId],
    queryFn: () => tracksApi.getByUser(userId).then((r) => r.data),
  });
  const { setTrack, queue } = usePlayerStore();

  const getUrl = (path?: string) => {
    if (!path) return '/default-cover.png';
    if (path.startsWith('http')) return path;
    return `/${path.replace(/\\/g, '/')}`;
  };

  if (!artist) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-48 h-48 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-5xl font-bold">
          {artist.firstName[0]}
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{artist.nickname || `${artist.firstName} ${artist.lastName}`}</h1>
          <p className="text-sm text-[#888888]">{tracks?.length || 0} tracks</p>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-4">Tracks</h3>
        <div className="space-y-2">
          {tracks?.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#151515] transition group cursor-pointer"
              onClick={() => setTrack(t, tracks)}
            >
              <span className="w-8 text-center text-[#888888] group-hover:hidden">{i + 1}</span>
              <Play size={16} className="hidden group-hover:block" />
              <img
                src={getUrl(t.cover_path)}
                alt={t.title}
                className="w-16 h-16 rounded-2xl object-cover shadow-2xl"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{t.title}</p>
              </div>
              <span className="text-sm text-[#888888]">{t.plays_count} plays</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};