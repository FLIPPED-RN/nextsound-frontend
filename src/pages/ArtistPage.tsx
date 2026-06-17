import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Heart, BadgeCheck, UserPlus, Check, BarChart3, Camera, Pencil, X, LogOut, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/users.api';
import { tracksApi } from '../api/tracks.api';
import { albumsApi } from '../api/albums.api';
import { usePlayerStore } from '../store/player.store';
import { useAuthStore } from '../store/auth.store';
import { resolveAssetUrl, formatCount, formatNumber } from '@/lib/utils';
import { ScrollingText } from '../components/ScrollingText';
import { PlanBadge } from '../components/PlanBadge';
import type { Track, User } from '@/types';

type Sort = 'popular' | 'latest' | 'oldest';

export const ArtistPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const userId = Number(id);

  const { user: me, uploadAvatar, uploadBanner, logout } = useAuthStore();
  const isOwn = me?.id === userId;

  const handleLogout = async () => {
    try { await logout(); } catch { }
    navigate('/login');
  };

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
  const [tab, setTab] = useState<'tracks' | 'albums' | 'reposts'>('tracks');
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const { data: followInfo } = useQuery({
    queryKey: ['follow-info', userId],
    queryFn: () => usersApi.getFollowInfo(userId).then((r) => r.data),
  });
  useEffect(() => {
    if (followInfo) { setFollowing(followInfo.isFollowing); setFollowers(followInfo.followers); }
  }, [followInfo]);

  const { data: reposts } = useQuery({
    queryKey: ['reposts', userId],
    queryFn: () => tracksApi.getReposts(userId).then((r) => r.data),
    enabled: tab === 'reposts',
  });

  const { data: albums } = useQuery({
    queryKey: ['albums', userId],
    queryFn: () => albumsApi.getByUser(userId).then((r) => r.data),
  });

  const handleFollow = async () => {
    if (!me) { toast.error('Войдите, чтобы подписаться'); return; }
    const was = following;
    setFollowing(!was);
    setFollowers((c) => c + (was ? -1 : 1));
    try { await usersApi.follow(userId); }
    catch { setFollowing(was); setFollowers((c) => c + (was ? 1 : -1)); }
  };

  const sorted = useMemo(() => {
    const list = [...(tracks || [])];
    if (sort === 'popular') list.sort((a, b) => b.plays_count - a.plays_count);
    if (sort === 'latest') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'oldest') list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return list;
  }, [tracks, sort]);

  const { data: likedData } = useQuery({
    queryKey: ['my-liked-ids'],
    queryFn: () => tracksApi.getLiked().then((r) => r.data),
    enabled: !!me,
  });
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (likedData) setLikedIds(new Set(likedData.map((d) => d.track?.id).filter(Boolean) as number[]));
  }, [likedData]);

  const toggleLike = async (trackId: number) => {
    if (!me) { toast.error('Войдите, чтобы лайкать'); return; }
    setLikedIds((prev) => {
      const n = new Set(prev);
      n.has(trackId) ? n.delete(trackId) : n.add(trackId);
      return n;
    });
    try {
      await tracksApi.toggleLike(trackId);
    } catch {
      setLikedIds((prev) => {
        const n = new Set(prev);
        n.has(trackId) ? n.delete(trackId) : n.add(trackId);
        return n;
      });
    }
  };

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
  const isVerified = !!displayArtist.isArtistVerified;
  const banner = displayArtist.banner
    ? resolveAssetUrl(displayArtist.banner)
    : (displayArtist.avatar
      ? resolveAssetUrl(displayArtist.avatar)
      : (tracks?.[0]?.cover_path ? resolveAssetUrl(tracks[0].cover_path) : ''));
  const memberSince = new Date(displayArtist.created_at).getFullYear() || new Date().getFullYear();

  let socials: { key: string; label: string; url: string }[] = [];
  try {
    const parsed = displayArtist.links ? JSON.parse(displayArtist.links) : {};
    const labels: Record<string, string> = { telegram: 'Telegram', instagram: 'Instagram', vk: 'VK', youtube: 'YouTube', website: 'Сайт' };
    socials = Object.entries(labels)
      .filter(([k]) => parsed[k]?.trim())
      .map(([k, label]) => ({ key: k, label, url: parsed[k].trim() }));
  } catch { socials = []; }

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

  const handleBannerPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      await uploadBanner(file);
      qc.invalidateQueries({ queryKey: ['artist', userId] });
      toast.success('Обложка профиля обновлена');
    } catch {
      toast.error('Не удалось загрузить обложку');
    } finally {
      setUploadingBanner(false);
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
            <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={handleBannerPick} />
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                onClick={() => bannerInput.current?.click()}
                disabled={uploadingBanner}
                className="inline-flex items-center gap-2 text-sm bg-black/50 backdrop-blur px-3 py-1.5 rounded-full hover:bg-black/70 transition disabled:opacity-60"
              >
                <Camera size={15} /> {uploadingBanner ? 'Загрузка...' : 'Обложка'}
              </button>
              <button
                onClick={() => avatarInput.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-2 text-sm bg-black/50 backdrop-blur px-3 py-1.5 rounded-full hover:bg-black/70 transition disabled:opacity-60"
              >
                <Camera size={15} /> {uploadingAvatar ? 'Загрузка...' : 'Фото'}
              </button>
            </div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-5">
          <div className="flex items-center gap-2 mb-3">
            {isVerified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
                <BadgeCheck size={14} className="text-blue-400" /> Проверенный артист
              </span>
            )}
            <PlanBadge user={displayArtist} size="md" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg break-words">{name}</h1>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-5 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8a8a8a]">
          <span><span className="text-white font-semibold">{formatNumber(followers)}</span> подписчиков</span>
          <span><span className="text-white font-semibold">{trackCount}</span> {trackCount === 1 ? 'трек' : 'треков'}</span>
          <span><span className="text-white font-semibold">{formatCount(totalPlays)}</span> прослушиваний</span>
          <span>с <span className="text-white font-semibold">{memberSince}</span></span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {isOwn ? (
            <button onClick={() => setEditing(true)} className="flex-1 sm:flex-none sm:min-w-[160px] h-10 rounded-full text-sm font-semibold bg-white text-black flex items-center justify-center gap-2 hover:opacity-90 transition">
              <Pencil size={15} /> Редактировать
            </button>
          ) : (
            <button
              onClick={handleFollow}
              className={`flex-1 sm:flex-none sm:min-w-[160px] h-10 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition ${following ? 'bg-[#222] text-white border border-[#333]' : 'bg-white text-black hover:opacity-90'}`}
            >
              {following ? <><Check size={16} /> Вы подписаны</> : <><UserPlus size={16} /> Подписаться</>}
            </button>
          )}
          <button onClick={handlePlayAll} className="flex-1 sm:flex-none sm:min-w-[160px] h-10 rounded-full text-sm font-semibold border border-[#242424] flex items-center justify-center gap-2 hover:border-white/50 transition">
            <Play size={16} /> Слушать всё
          </button>
          {isOwn && (
            <button onClick={handleLogout} title="Выйти" className="w-10 h-10 rounded-full border border-[#242424] flex items-center justify-center text-[#888] hover:text-red-400 hover:border-red-400/50 transition shrink-0">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {socials.length > 0 && (
        <div className="px-4 md:px-8 mt-4 flex flex-wrap gap-2">
          {socials.map((s) => (
            <a
              key={s.key}
              href={s.url.startsWith('http') ? s.url : `https://${s.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-[#151515] text-[#bbb] hover:bg-[#1f1f1f] hover:text-white transition"
            >
              <Link2 size={13} /> {s.label}
            </a>
          ))}
        </div>
      )}

      <div className="px-4 md:px-8 mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setTab('tracks')} className={`text-2xl font-bold transition ${tab === 'tracks' ? 'text-white' : 'text-[#555] hover:text-white'}`}>Треки</button>
            {!!albums?.length && (
              <button onClick={() => setTab('albums')} className={`text-2xl font-bold transition ${tab === 'albums' ? 'text-white' : 'text-[#555] hover:text-white'}`}>Альбомы</button>
            )}
            <button onClick={() => setTab('reposts')} className={`text-2xl font-bold transition ${tab === 'reposts' ? 'text-white' : 'text-[#555] hover:text-white'}`}>Репосты</button>
          </div>
          {tab === 'tracks' && (
            <div className="flex items-center gap-1 text-sm flex-wrap">
              <span className="text-[#666] mr-1 hidden sm:inline">Сортировка:</span>
              {(['popular', 'latest', 'oldest'] as Sort[]).map((s) => (
                <button key={s} onClick={() => setSort(s)} className={`px-3 py-1 rounded-full transition ${sort === s ? 'bg-white/10 text-white font-semibold' : 'text-[#888] hover:text-white'}`}>
                  {({ popular: 'Популярные', latest: 'Новые', oldest: 'Старые' } as Record<Sort, string>)[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === 'tracks' && (
          <>
            <div className="hidden md:grid grid-cols-[24px_1fr_120px_140px_40px] gap-4 px-3 pb-2 text-xs text-[#666] uppercase tracking-wider border-b border-[#1a1a1a]">
              <span>#</span><span>Название</span><span className="text-right">Прослушивания</span><span className="text-right">Дата</span><span></span>
            </div>
            <div className="mt-1">
              {visible.map((t, i) => (
                <TrackRow key={t.id} t={t} index={i + 1}
                  isPlaying={currentTrack?.id === t.id && isPlaying}
                  isCurrent={currentTrack?.id === t.id}
                  liked={likedIds.has(t.id)}
                  onLike={() => toggleLike(t.id)}
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
          </>
        )}

        {tab === 'albums' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-1">
            {(albums || []).map((a) => (
              <button key={a.id} onClick={() => navigate(`/album/${a.id}`)} className="text-left group">
                <div className="aspect-square rounded-xl overflow-hidden bg-[#151515]">
                  <img src={resolveAssetUrl(a.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <p className="text-sm font-medium truncate mt-2">{a.title}</p>
                <p className="text-xs text-[#666]">{a.trackCount} {a.trackCount === 1 ? 'трек' : 'треков'}</p>
              </button>
            ))}
          </div>
        )}

        {tab === 'reposts' && (
          <div className="mt-1">
            {(reposts || []).map((t, i) => (
              <TrackRow key={t.id} t={t} index={i + 1}
                isPlaying={currentTrack?.id === t.id && isPlaying}
                isCurrent={currentTrack?.id === t.id}
                liked={likedIds.has(t.id)}
                onLike={() => toggleLike(t.id)}
                onPlay={() => { if (currentTrack?.id === t.id) togglePlay(); else setTrack(t, reposts || []); }}
                onOpen={() => navigate(`/track/${t.id}`)}
              />
            ))}
            {!reposts?.length && <p className="text-sm text-[#666] py-6">Пока нет репостов.</p>}
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
  const parsedLinks = (() => { try { return user?.links ? JSON.parse(user.links) : {}; } catch { return {}; } })();
  const [links, setLinks] = useState({
    telegram: parsedLinks.telegram || '',
    instagram: parsedLinks.instagram || '',
    vk: parsedLinks.vk || '',
    youtube: parsedLinks.youtube || '',
    website: parsedLinks.website || '',
  });
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanLinks = Object.fromEntries(Object.entries(links).filter(([, v]) => (v as string).trim()));
      await updateProfile({ ...form, links: JSON.stringify(cleanLinks) });
      toast.success('Профиль обновлён');
      onClose();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const savePwd = async () => {
    if (pwd.newPassword.length < 6) { toast.error('Новый пароль не короче 6 символов'); return; }
    setPwdSaving(true);
    try {
      await usersApi.changePassword(pwd.oldPassword, pwd.newPassword);
      toast.success('Пароль изменён');
      setPwd({ oldPassword: '', newPassword: '' });
      setShowPwd(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Не удалось изменить пароль');
    } finally {
      setPwdSaving(false);
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

        <div className="border-t border-[#242424] pt-3 space-y-2">
          <span className="block text-xs tracking-widest text-[#666] uppercase">Ссылки</span>
          <input className="ns-input" placeholder="Telegram (https://t.me/...)" value={links.telegram} onChange={(e) => setLinks({ ...links, telegram: e.target.value })} />
          <input className="ns-input" placeholder="Instagram" value={links.instagram} onChange={(e) => setLinks({ ...links, instagram: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="ns-input" placeholder="VK" value={links.vk} onChange={(e) => setLinks({ ...links, vk: e.target.value })} />
            <input className="ns-input" placeholder="YouTube" value={links.youtube} onChange={(e) => setLinks({ ...links, youtube: e.target.value })} />
          </div>
          <input className="ns-input" placeholder="Свой сайт" value={links.website} onChange={(e) => setLinks({ ...links, website: e.target.value })} />
        </div>

        <div className="border-t border-[#242424] pt-3">
          <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-sm text-[#aaa] hover:text-white transition">
            {showPwd ? '× Отменить смену пароля' : 'Сменить пароль'}
          </button>
          {showPwd && (
            <div className="space-y-3 mt-3">
              <input type="password" className="ns-input" placeholder="Текущий пароль" value={pwd.oldPassword} onChange={(e) => setPwd({ ...pwd, oldPassword: e.target.value })} />
              <input type="password" className="ns-input" placeholder="Новый пароль (мин. 6 символов)" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
              <button type="button" onClick={savePwd} disabled={pwdSaving} className="px-4 py-2 rounded-full text-sm font-semibold bg-violet-600 hover:bg-violet-500 transition disabled:opacity-60">
                {pwdSaving ? 'Сохранение...' : 'Обновить пароль'}
              </button>
            </div>
          )}
        </div>

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

const TrackRow = ({ t, index, isPlaying, isCurrent, liked, onLike, onPlay, onOpen }: {
  t: Track; index: number; isPlaying: boolean; isCurrent: boolean; liked: boolean; onLike: () => void; onPlay: () => void; onOpen: () => void;
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
          <ScrollingText text={t.title} className={`text-sm font-medium ${isCurrent ? 'text-white' : ''}`} />
          {t.genre && <p className="text-xs text-[#666] truncate">{t.genre}</p>}
        </div>
      </div>
      <span className="text-sm text-[#888] text-right hidden md:block">{formatCount(t.plays_count)}</span>
      <span className="text-sm text-[#888] text-right hidden md:block">{released}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        className={`transition justify-self-end ${liked ? 'text-red-500' : 'text-[#666] hover:text-red-400'}`}
      >
        <Heart size={15} className={liked ? 'fill-red-500' : ''} />
      </button>
    </div>
  );
};
