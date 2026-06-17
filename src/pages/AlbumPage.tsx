import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Disc3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { albumsApi } from '../api/albums.api';
import { usePlayerStore } from '../store/player.store';
import { useAuthStore } from '../store/auth.store';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { resolveAssetUrl, formatCount } from '@/lib/utils';

export const AlbumPage = () => {
  const { id } = useParams<{ id: string }>();
  const albumId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { setTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  const { data: album, isLoading } = useQuery({
    queryKey: ['album', albumId],
    queryFn: () => albumsApi.getOne(albumId).then((r) => r.data),
  });

  if (isLoading || !album) {
    return (
      <div className="px-4 md:px-8 py-6 animate-pulse">
        <div className="flex gap-6">
          <div className="w-48 h-48 rounded-2xl bg-[#151515]" />
          <div className="flex-1 space-y-3 pt-6"><div className="h-8 w-1/2 bg-[#151515] rounded" /><div className="h-4 w-1/3 bg-[#151515] rounded" /></div>
        </div>
      </div>
    );
  }

  const tracks = album.tracks || [];
  const cover = resolveAssetUrl(album.cover_path);
  const playAll = () => { if (tracks.length) setTrack(tracks[0], tracks); };
  const canDelete = !!user && (user.id === album.userId || user.role === 'admin');

  const handleDelete = async () => {
    if (!confirm(`Удалить альбом «${album.title}»? Треки останутся как отдельные синглы.`)) return;
    try {
      await albumsApi.delete(album.id);
      toast.success('Альбом удалён');
      qc.invalidateQueries({ queryKey: ['albums', album.userId] });
      navigate(`/artist/${album.userId}`);
    } catch {
      toast.error('Не удалось удалить альбом');
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
        <img
          src={cover}
          alt={album.title}
          onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }}
          className="w-44 h-44 md:w-52 md:h-52 rounded-2xl object-cover shadow-2xl bg-[#151515] shrink-0"
        />
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs tracking-widest text-violet-300 uppercase"><Disc3 size={13} /> Альбом</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-2 break-words">{album.title}</h1>
          <button onClick={() => navigate(`/artist/${album.userId}`)} className="flex items-center gap-1.5 mt-3 text-sm text-[#bbb] hover:text-white transition">
            <span>{album.user?.nickname || album.user?.firstName}</span>
            <VerifiedBadge verified={album.user?.isArtistVerified} />
          </button>
          <p className="text-sm text-[#666] mt-2">
            {album.trackCount} {album.trackCount === 1 ? 'трек' : 'треков'} · {formatCount(album.plays || 0)} прослушиваний
          </p>
          <div className="flex items-center gap-2 mt-5">
            <button onClick={playAll} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold inline-flex items-center gap-2 hover:scale-105 transition">
              <Play size={16} /> Слушать
            </button>
            {canDelete && (
              <button onClick={handleDelete} title="Удалить альбом" className="w-10 h-10 rounded-full border border-[#242424] flex items-center justify-center text-[#888] hover:text-red-400 hover:border-red-400/50 transition">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {tracks.map((t, i) => {
          const isCur = currentTrack?.id === t.id;
          return (
            <div key={t.id} className={`group grid grid-cols-[24px_1fr_auto] gap-3 items-center px-3 py-2 rounded-lg transition ${isCur ? 'bg-white/5' : 'hover:bg-white/5'}`}>
              <button onClick={() => { if (isCur) togglePlay(); else setTrack(t, tracks); }} className="w-6 flex items-center justify-center text-[#888]">
                {isCur && isPlaying ? <Pause size={14} className="text-white" /> : <><span className="group-hover:hidden text-sm">{i + 1}</span><Play size={14} className="hidden group-hover:block text-white" /></>}
              </button>
              <div className="min-w-0 flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/track/${t.id}`)}>
                <img src={resolveAssetUrl(t.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-10 h-10 rounded object-cover bg-[#151515] shrink-0" />
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isCur ? 'text-white' : ''}`}>{t.title}</p>
                  {t.genre && <p className="text-xs text-[#666] truncate">{t.genre}</p>}
                </div>
              </div>
              <span className="text-xs text-[#888] flex items-center gap-1 pr-2"><Play size={11} /> {formatCount(t.plays_count)}</span>
            </div>
          );
        })}
        {!tracks.length && <p className="text-sm text-[#666] py-6">В альбоме пока нет треков.</p>}
      </div>
    </div>
  );
};
