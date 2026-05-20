// src/pages/PlaylistsPage.tsx
import { useQuery } from '@tanstack/react-query';
import { playlistsApi } from '../api/playlists.api';
import { useNavigate } from 'react-router-dom';
import { Plus, ListMusic } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export const PlaylistsPage = () => {
  const { data: playlists, refetch } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistsApi.getMy().then((r) => r.data),
  });
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await playlistsApi.create(name);
    toast.success('Playlist created');
    setName('');
    setShowCreate(false);
    refetch();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Playlists</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="p-2 bg-white text-black rounded-full">
          <Plus size={20} />
        </button>
      </div>
      {showCreate && (
        <div className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist name"
            className="flex-1 px-4 py-2 bg-[#151515] rounded-xl text-white outline-none"
          />
          <button onClick={handleCreate} className="bg-white text-black px-4 py-2 rounded-full font-semibold">Create</button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {playlists?.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/playlists/${p.id}`)}
            className="bg-[#151515] rounded-2xl p-3 hover:bg-[#1f1f1f] transition cursor-pointer space-y-3"
          >
            <div className="w-full aspect-square bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <ListMusic size={40} />
            </div>
            <p className="font-semibold truncate">{p.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};