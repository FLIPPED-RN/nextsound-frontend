import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Play, Pause, Plus, Trash2, ListMusic, LayoutGrid, List, ChevronLeft, BarChart3, X, Lock, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { playlistsApi } from '../api/playlists.api';
import { usePlayerStore } from '../store/player.store';
import { useAuthStore } from '../store/auth.store';
import { isSubscriber } from '../lib/plans';
import { resolveAssetUrl, formatDate } from '@/lib/utils';
import { ScrollingText } from '../components/ScrollingText';
import { VerifiedBadge } from '../components/VerifiedBadge';
import type { Playlist, Track } from '@/types';

const extractTracks = (data: any): Track[] =>
  Array.isArray(data) ? data.map((item: any) => item.track || item).filter(Boolean) : [];

export const PlaylistPage = () => {
  const { id } = useParams<{ id: string }>();
  return id ? <PlaylistDetail playlistId={Number(id)} /> : <PlaylistsGrid />;
};

const NewPlaylistModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await playlistsApi.create(name.trim());
      toast.success('Плейлист создан');
      onCreated();
      onClose();
    } catch {
      toast.error('Не удалось создать плейлист');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="w-full max-w-sm bg-[#111] border border-[#242424] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Новый плейлист</h3>
          <button type="button" onClick={onClose} className="text-[#666] hover:text-white transition"><X size={18} /></button>
        </div>
        <input autoFocus className="ns-input" placeholder="Название плейлиста" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm text-[#aaa] hover:text-white transition">Отмена</button>
          <button type="submit" disabled={saving || !name.trim()} className="px-5 py-2 rounded-full text-sm font-semibold bg-white text-black hover:opacity-90 transition disabled:opacity-60">
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
};

const PlaylistsGrid = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [creating, setCreating] = useState(false);

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['my-playlists'],
    queryFn: () => playlistsApi.getMy().then((r) => r.data),
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ['my-playlists'] });

  const list = playlists || [];
  const recent = list.slice(0, 4);

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-widest text-[#666] uppercase mb-1">Ваша библиотека</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ВАШИ ПЛЕЙЛИСТЫ</h1>
        </div>
        <button onClick={() => setCreating(true)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition">
          <Plus size={16} /> Новый плейлист
        </button>
      </div>

      <div className="flex items-center justify-between border-y border-[#1a1a1a] py-3 mb-6 text-sm">
        <div className="flex items-center gap-5 text-[#888]">
          <span><span className="text-white font-semibold">{list.length}</span> плейлистов</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setView('grid')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${view === 'grid' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setView('list')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${view === 'list' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white'}`}><List size={16} /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <div key={i} className="aspect-square bg-[#151515] rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {recent.length > 0 && (
            <>
              <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Недавние</h2>
              <div className={view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8' : 'space-y-2 mb-8'}>
                {recent.map((p) => <PlaylistCard key={p.id} playlist={p} view={view} onOpen={() => navigate(`/playlists/${p.id}`)} />)}
              </div>
            </>
          )}

          <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Все плейлисты</h2>
          <div className={view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
            {list.map((p) => <PlaylistCard key={p.id} playlist={p} view={view} onOpen={() => navigate(`/playlists/${p.id}`)} />)}
            <button
              onClick={() => setCreating(true)}
              className={view === 'grid'
                ? 'aspect-square rounded-2xl border-2 border-dashed border-[#242424] hover:border-[#444] flex flex-col items-center justify-center text-[#666] hover:text-white transition'
                : 'w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#242424] hover:border-[#444] text-[#666] hover:text-white transition'}
            >
              <Plus size={view === 'grid' ? 28 : 20} />
              <span className="text-sm mt-1">Создать плейлист</span>
            </button>
          </div>

          {!list.length && (
            <p className="text-sm text-[#666] mt-6">У вас пока нет плейлистов. Создайте первый!</p>
          )}
        </>
      )}

      {creating && <NewPlaylistModal onClose={() => setCreating(false)} onCreated={refetch} />}
    </div>
  );
};

const PlaylistCard = ({ playlist, view, onOpen }: { playlist: Playlist; view: 'grid' | 'list'; onOpen: () => void }) => {
  const { setTrack } = usePlayerStore();
  const { data } = useQuery({
    queryKey: ['playlist-tracks', playlist.id],
    queryFn: () => playlistsApi.getTracks(playlist.id).then((r) => r.data),
  });
  const tracks = extractTracks(data);
  const cover = tracks[0]?.cover_path ? resolveAssetUrl(tracks[0].cover_path) : '';
  const meta = `${tracks.length} ${tracks.length === 1 ? 'трек' : 'треков'}`;

  const playAll = (e: React.MouseEvent) => { e.stopPropagation(); if (tracks.length) setTrack(tracks[0], tracks); };

  if (view === 'list') {
    return (
      <div onClick={onOpen} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition cursor-pointer group">
        <CoverBox cover={cover} />
        <div className="min-w-0 flex-1">
          <ScrollingText text={playlist.name} className="text-sm font-semibold" />
          <p className="text-xs text-[#666] truncate">{meta}</p>
        </div>
        <button onClick={playAll} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Play size={15} className="ml-0.5" /></button>
      </div>
    );
  }

  return (
    <div onClick={onOpen} className="group cursor-pointer">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#151515]">
        {cover ? (
          <img src={cover} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-600/40 to-blue-600/30 flex items-center justify-center">
            <ListMusic size={32} className="text-white/40" />
          </div>
        )}
        <button onClick={playAll} className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-xl">
          <Play size={18} className="ml-0.5" />
        </button>
      </div>
      <ScrollingText text={playlist.name} className="text-sm font-semibold mt-2" />
      <p className="text-xs text-[#666] truncate">{meta}</p>
    </div>
  );
};

const CoverBox = ({ cover }: { cover: string }) => (
  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#151515] shrink-0">
    {cover ? <img src={cover} alt="" className="w-full h-full object-cover" />
      : <div className="w-full h-full bg-gradient-to-br from-violet-600/40 to-blue-600/30 flex items-center justify-center"><ListMusic size={16} className="text-white/40" /></div>}
  </div>
);

const PlaylistDetail = ({ playlistId }: { playlistId: number }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { setTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  const { data: playlist } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => playlistsApi.getOne(playlistId).then((r) => r.data),
  });

  const locked = !!playlist?.isExclusive && !isSubscriber(user)
    && user?.id !== playlist?.userId && user?.role !== 'admin';

  const { data: tracksData } = useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: () => playlistsApi.getTracks(playlistId).then((r) => r.data),
    enabled: !!playlist && !locked,
  });

  const tracks = useMemo(() => extractTracks(tracksData), [tracksData]);

  const handleRemove = async (trackId: number) => {
    try {
      await playlistsApi.removeTrack(playlistId, trackId);
      toast.success('Трек удалён');
      qc.invalidateQueries({ queryKey: ['playlist-tracks', playlistId] });
    } catch { toast.error('Не удалось удалить'); }
  };

  const canDelete = !!user && (user.id === playlist?.userId || user.role === 'admin');
  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (!confirm(`Удалить плейлист «${playlist.name}»?`)) return;
    try {
      await playlistsApi.delete(playlist.id);
      toast.success('Плейлист удалён');
      qc.invalidateQueries({ queryKey: ['my-playlists'] });
      qc.invalidateQueries({ queryKey: ['exclusive-playlists'] });
      navigate('/playlists');
    } catch { toast.error('Не удалось удалить плейлист'); }
  };

  if (!playlist) return <div className="p-8 animate-pulse"><div className="h-8 w-48 bg-[#151515] rounded" /></div>;

  if (locked) {
    return (
      <div className="px-4 md:px-8 py-6">
        <button onClick={() => navigate('/playlists')} className="inline-flex items-center gap-1 text-sm text-[#888] hover:text-white transition mb-8">
          <ChevronLeft size={16} /> Назад
        </button>
        <div className="max-w-md mx-auto text-center mt-10">
          <div className="w-20 h-20 rounded-3xl bg-violet-500/15 flex items-center justify-center mx-auto mb-5">
            <Lock size={34} className="text-violet-400" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-violet-300"><Crown size={13} /> Эксклюзив</span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">{playlist.name}</h1>
          <p className="text-[#9a9a9a] mt-3">Этот плейлист доступен по подписке NextSound Plus. Оформи подписку, чтобы слушать эксклюзивные подборки.</p>
          <button onClick={() => navigate('/premium')} className="mt-6 px-7 py-3 rounded-full bg-violet-500 hover:bg-violet-400 text-white font-semibold transition">
            Оформить Plus за 99 ₽
          </button>
        </div>
      </div>
    );
  }

  const cover = tracks[0]?.cover_path ? resolveAssetUrl(tracks[0].cover_path) : '';

  return (
    <div className="px-4 md:px-8 py-6">
      <button onClick={() => navigate('/playlists')} className="inline-flex items-center gap-1 text-sm text-[#888] hover:text-white transition mb-5">
        <ChevronLeft size={16} /> Назад
      </button>

      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-8">
        <div className="w-44 h-44 rounded-2xl overflow-hidden bg-[#151515] shadow-2xl shrink-0">
          {cover ? <img src={cover} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-violet-600/40 to-blue-600/30 flex items-center justify-center"><ListMusic size={40} className="text-white/40" /></div>}
        </div>
        <div className="min-w-0">
          <p className="text-xs tracking-widest text-[#666] uppercase mb-2">Плейлист</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight break-words">{playlist.name}</h1>
          <p className="text-sm text-[#888] mt-3">{tracks.length} {tracks.length === 1 ? 'трек' : 'треков'}</p>
          <div className="flex items-center gap-2 mt-4">
            {tracks.length > 0 && (
              <button onClick={() => setTrack(tracks[0], tracks)} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition">
                <Play size={16} /> Слушать всё
              </button>
            )}
            {canDelete && (
              <button onClick={handleDeletePlaylist} title="Удалить плейлист" className="w-10 h-10 rounded-full border border-[#242424] flex items-center justify-center text-[#888] hover:text-red-400 hover:border-red-400/50 transition">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <p className="text-sm text-[#666]">В плейлисте пока нет треков.</p>
      ) : (
        <div>
          {tracks.map((t, i) => {
            const isCurrent = currentTrack?.id === t.id;
            return (
              <div key={t.id} className={`group grid grid-cols-[24px_1fr_auto] gap-3 items-center px-3 py-2 rounded-lg transition ${isCurrent ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                <button onClick={() => (isCurrent ? togglePlay() : setTrack(t, tracks))} className="w-6 flex items-center justify-center text-[#888]">
                  {isCurrent ? (isPlaying ? <BarChart3 size={15} className="text-white" /> : <Pause size={14} className="text-white" />)
                    : <><span className="group-hover:hidden text-sm">{i + 1}</span><Play size={14} className="hidden group-hover:block text-white" /></>}
                </button>
                <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => navigate(`/track/${t.id}`)}>
                  <img src={resolveAssetUrl(t.cover_path)} alt="" onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-10 h-10 rounded object-cover bg-[#151515] shrink-0" />
                  <div className="min-w-0">
                    <ScrollingText text={t.title} className={`text-sm font-medium ${isCurrent ? 'text-white' : ''}`} />
                    <p className="text-xs text-[#666] truncate flex items-center gap-1">
                      <span className="truncate">{t.user?.nickname || t.user?.firstName}</span>
                      <VerifiedBadge verified={t.user?.isArtistVerified} size={12} />
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#666] hidden sm:block">{formatDate(t.created_at)}</span>
                  <button onClick={() => handleRemove(t.id)} className="text-[#666] hover:text-red-400 transition"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
