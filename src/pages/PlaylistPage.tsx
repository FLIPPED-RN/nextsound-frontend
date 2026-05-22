import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { playlistsApi } from '../api/playlists.api';
import { usePlayerStore } from '../store/player.store';
import { Play, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const PlaylistPage = () => {
  const { id } = useParams<{ id: string }>();
  const playlistId = Number(id);
  const navigate = useNavigate();
  const { setTrack, queue } = usePlayerStore();

  const { data: playlist } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => playlistsApi.getOne(playlistId).then((r) => r.data),
  });

  const { data: tracksData, refetch } = useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: () => playlistsApi.getTracks(playlistId).then((r) => r.data),
  });

  const tracks = Array.isArray(tracksData)
    ? tracksData.map((item: any) => item.track || item)
    : [];

  const handleRemoveTrack = async (trackId: number) => {
    await playlistsApi.removeTrack(playlistId, trackId);
    toast.success('Track removed');
    refetch();
  };

  if (!playlist) return null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <button onClick={() => navigate('/playlists')} className="text-[#888888] hover:text-white transition">
        ← Back
      </button>
      <h2 className="text-3xl font-bold">{playlist.name}</h2>
      {tracks.length === 0 ? (
        <p className="text-[#888888]">No tracks yet</p>
      ) : (
        <div className="space-y-2">
          {tracks.map((t: any, i: number) => (
            <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#151515] transition">
              <span className="w-6 text-center text-[#888888]">{i + 1}</span>
              <img
                src={t.cover_path ? `/${t.cover_path.replace(/\\/g, '/')}` : '/default-cover.png'}
                alt=""
                className="w-10 h-10 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{t.title}</p>
                <p className="text-sm text-[#888888] truncate">{t.user?.nickname || t.user?.firstName}</p>
              </div>
              <button onClick={() => setTrack(t, tracks)} className="p-2 hover:bg-[#242424] rounded-full">
                <Play size={16} />
              </button>
              <button onClick={() => handleRemoveTrack(t.id)} className="p-2 hover:bg-[#242424] rounded-full text-[#888888] hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};