import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { Play, Pause, Heart, BadgeCheck, MoreHorizontal, UserPlus, Check, BarChart3, Camera, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/users.api';
import { tracksApi } from '../api/tracks.api';
import { usePlayerStore } from '../store/player.store';
import { useAuthStore } from '../store/auth.store';
import { resolveAssetUrl, formatCount, formatNumber } from '@/lib/utils';
import type { Track, User } from '@/types';

type Sort = 'popular' | 'latest' | 'oldest';

export const ArtistPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const userId = Number(id);

  const { user: me, uploadAvatar } = useAuthStore();
  const isOwn = me?.id === userId;

  const { data: artist } = useQuery({
    queryKey: ['artist', userId],
    queryFn: () => usersApi.getProfile(userId).then((r) => r.data),
  });
  const { data: tracks } = useQuery({
    queryKey: ['artistTracks', userId],
    queryFn: () => tracksApi.getByUser(userId).then((r) => r.data),
  });

  const { setTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const [sort, setSort] = useState<Sort>('popular');
  const [following, setFollowing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => {
    const list = [...(tracks || [])];
    if (sort === 'popular') list.sort((a, b) => b.plays_count - a.plays_count);
    if (sort === 'latest') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'oldest') list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return list;
  }, [tracks, sort]);

  const displayArtist = isOwn && me ? { ...artist, ...me } as User : artist;

  if (!displayArtist) {
    return (
      <div className="animate-pulse">
        <div className="h-64 md:h-80 bg-[#151515]" />
        <div className="p-8 space-y-4"><div className="h-8 w-48 bg-[#151515] rounded" /></div>
      </div>
    );
  }

  const name = displayArtist.nickname || `${displayArtist.firstName} ${displayArtist.lastName}`;
  const totalPlays = (tracks || []).reduce((s, t) => s + (t.plays_count || 0), 0);
  const trackCount = tracks?.length || 0;
  const isVerified = displayArtist.role === 'artist' || displayArtist.role === 'admin';
  const banner = displayArtist.avatar
    ? resolveAssetUrl(displayArtist.avatar)
    : (tracks?.[0]?.cover_path ? resolveAssetUrl(tracks[0].cover_path) : '');
  const memberSince = new Date(displayArtist.created_at).getFullYear() || new Date().getFullYear();

  const handlePlayAll = () => { if (sorted.length) setTrack(sorted[0], sorted); };

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      qc.invalidateQueries({ queryKey: ['artist', userId] });
      toast.success('Фото обновлено');
    } catch {
      toast.error('Не удалось загрузить фото');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const visible = showAll ? sorted : sorted.slice(0, 8);

  return (
    <div className="pb-8 overflow-x-hidden">
      <div className="relative h-64 md:h-80">
        {banner ? (
          <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700/40 via-blue-700/30 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

        {isOwn && (
          <>
            <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            <button
              onClick={() => avatarInput.current?.click()}
              disabled={uploadingAvatar}
              className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 text-sm bg-black/50 backdrop-blur px-3 py-1.5 rounded-full hover:bg-black/70 transition disabled:opacity-60"
            >
              <Camera size={15} /> {uploadingAvatar ? 'Загрузка...' : 'Сменить фото'}
            </button>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-5">
          {isVerified && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full mb-3">
              <BadgeCheck size={14} className="text-blue-400" /> Проверенный артист
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg break-words">{name}</h1>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-5 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8a8a8a]">
          <span><span className="text-white font-semibold">{trackCount}</span> {trackCount === 1 ? 'трек' : 'треков'}</span>
          <span><span className="text-white font-semibold">{formatCount(totalPlays)}</span> прослушиваний</span>
          <span>с <span className="text-white font-semibold">{memberSince}</span></span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {isOwn ? (
            <button onClick={() => setEditing(true)} className="px-5 py-2 rounded-full text-sm font-semibold bg-white text-black flex items-center gap-2 hover:opacity-90 transition">
              <Pencil size={15} /> Редактировать
            </button>
          ) : (
            <button
              onClick={() => setFollowing((f) => !f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition ${following ? 'bg-[#222] text-white border border-[#333]' : 'bg-white text-black hover:opacity-90'}`}
            >
              {following ? <><Check size={16} /> Вы подписаны</> : <><UserPlus size={16} /> Подписаться</>}
            </button>
          )}
          <button onClick={handlePlayAll} className="px-5 py-2 rounded-full text-sm font-semibold border border-[#242424] flex items-center gap-2 hover:border-white/50 transition">
            <Play size={16} /> Слушать всё
          </button>
          <button className="w-9 h-9 rounded-full border border-[#242424] flex items-center justify-center hover:border-white/50 transition">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-2xl font-bold">Треки</h2>
          <div className="flex items-center gap-1 text-sm flex-wrap">
            <span className="text-[#666] mr-1 hidden sm:inline">Сортировка:</span>
            {(['popular', 'latest', 'oldest'] as Sort[]).map((s) => (
              <button key={s} onClick={() => setSort(s)} className={`px-3 py-1 rounded-full transition ${sort === s ? 'bg-white/10 text-white font-semibold' : 'text-[#888] hover:text-white'}`}>
                {({ popular: 'Популярные', latest: 'Новые', oldest: 'Старые' } as Record<Sort, string>)[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-[24px_1fr_120px_140px_40px] gap-4 px-3 pb-2 text-xs text-[#666] uppercase tracking-wider border-b border-[#1a1a1a]">
          <span>#</span><span>Название</span><span className="text-right">Прослушивания</span><span className="text-right">Дата</span><span></span>
        </div>

        <div className="mt-1">
          {visible.map((t, i) => (
            <TrackRow key={t.id} t={t} index={i + 1}
              isPlaying={currentTrack?.id === t.id && isPlaying}
              isCurrent={currentTrack?.id === t.id}
              onPlay={() => { if (currentTrack?.id === t.id) togglePlay(); else setTrack(t, sorted); }}
              onOpen={() => navigate(`/track/${t.id}`)}
            />
          ))}
          {!sorted.length && <p className="text-sm text-[#666] py-6">У артиста пока нет треков.</p>}
        </div>

        {sorted.length > 8 && (
          <div className="flex justify-center mt-5">
            <button onClick={() => setShowAll((s) => !s)} className="px-5 py-2 rounded-full bg-[#151515] text-sm text-[#aaa] hover:bg-[#1f1f1f] transition">
              {showAll ? 'Свернуть' : `Показать все (${trackCount})`}
            </button>
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 border-t border-[#1a1a1a] pt-8">
        <div>
          <h3 className="text-xs tracking-widest text-[#666] uppercase mb-3">Об артисте</h3>
          <p className="text-sm text-[#bdbdbd] leading-relaxed whitespace-pre-line">
            {displayArtist.bio?.trim()
              ? displayArtist.bio
              : `${name} — артист на NextSound.${trackCount > 0 ? ` ${trackCount} ${trackCount === 1 ? 'трек' : 'треков'}, ${formatNumber(totalPlays)} прослушиваний.` : ' Пока без публикаций.'}`}
          </p>
        </div>
        <div>
          <h3 className="text-xs tracking-widest text-[#666] uppercase mb-3">Статистика</h3>
          <dl className="space-y-3 text-sm">
            <StatRow k="Всего прослушиваний" v={formatNumber(totalPlays)} />
            <StatRow k="Треков" v={String(trackCount)} />
            <StatRow k="На сайте с" v={String(memberSince)} />
          </dl>
        </div>
      </div>

      {editing && me && <EditProfileModal onClose={() => setEditing(false)} />}
    </div>
  );
};

const StatRow = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-[#777]">{k}</dt>
    <dd className="text-white font-medium">{v}</dd>
  </div>
);

const EditProfileModal = ({ onClose }: { onClose: () => void }) => {
  const { user, updateProfile } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    nickname: user?.nickname || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Профиль обновлён');
      onClose();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="w-full max-w-md bg-[#111] border border-[#242424] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Редактировать профиль</h3>
          <button type="button" onClick={onClose} className="text-[#666] hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="ns-input" placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input className="ns-input" placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <input className="ns-input" placeholder="Никнейм" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
        <textarea className="ns-input resize-none h-28" placeholder="О себе" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm text-[#aaa] hover:text-white transition">Отмена</button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-full text-sm font-semibold bg-white text-black hover:opacity-90 transition disabled:opacity-60">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

const TrackRow = ({ t, index, isPlaying, isCurrent, onPlay, onOpen }: {
  t: Track; index: number; isPlaying: boolean; isCurrent: boolean; onPlay: () => void; onOpen: () => void;
}) => {
  const cover = resolveAssetUrl(t.cover_path);
  const released = new Date(t.release_date || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <div className={`group grid grid-cols-[24px_1fr_auto] md:grid-cols-[24px_1fr_120px_140px_40px] gap-3 md:gap-4 items-center px-3 py-2 rounded-lg transition ${isCurrent ? 'bg-white/5' : 'hover:bg-white/5'}`}>
      <button onClick={onPlay} className="w-6 flex items-center justify-center text-[#888]">
        {isCurrent ? (
          isPlaying ? <BarChart3 size={15} className="text-white" /> : <Pause size={14} className="text-white" />
        ) : (
          <>
            <span className="group-hover:hidden text-sm">{index}</span>
            <Play size={14} className="hidden group-hover:block text-white" />
          </>
        )}
      </button>
      <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={onOpen}>
        <img src={cover} alt="" onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-10 h-10 rounded object-cover bg-[#151515] shrink-0" />
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : ''}`}>{t.title}</p>
          {t.genre && <p className="text-xs text-[#666] truncate">{t.genre}</p>}
        </div>
      </div>
      <span className="text-sm text-[#888] text-right hidden md:block">{formatCount(t.plays_count)}</span>
      <span className="text-sm text-[#888] text-right hidden md:block">{released}</span>
      <button className="text-[#666] hover:text-red-400 transition justify-self-end" onClick={(e) => e.stopPropagation()}>
        <Heart size={15} />
      </button>
    </div>
  );
};
