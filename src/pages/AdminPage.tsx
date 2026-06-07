import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Music, Play, Heart, MessageCircle, ListMusic, HardDrive,
  Trash2, ShieldCheck, Search, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin.api';
import type { AdminStats, AdminUser } from '../api/admin.api';
import { usePlayerStore } from '../store/player.store';
import { resolveAssetUrl, formatNumber, formatCount, formatBytes, formatDate } from '@/lib/utils';
import type { Track, Comment } from '@/types';

type Tab = 'overview' | 'tracks' | 'users' | 'comments';

export const AdminPage = () => {
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Обзор' },
    { id: 'tracks', label: 'Треки' },
    { id: 'users', label: 'Пользователи' },
    { id: 'comments', label: 'Комментарии' },
  ];

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Админ-панель</h1>
          <p className="text-xs text-[#777]">Модерация и статистика NextSound</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[#1a1a1a] mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${tab === t.id ? 'border-white text-white' : 'border-transparent text-[#777] hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'tracks' && <TracksTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'comments' && <CommentsTab />}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4">
    <div className="flex items-center gap-2 text-[#888] text-xs mb-2">{icon}{label}</div>
    <div className="text-2xl font-bold">{value}</div>
    {sub && <div className="text-xs text-[#666] mt-1">{sub}</div>}
  </div>
);

const Overview = () => {
  const { data: s, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats().then((r) => r.data) });
  const navigate = useNavigate();

  if (isLoading || !s) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <div key={i} className="h-24 bg-[#0e0e0e] rounded-2xl animate-pulse" />)}</div>;
  }

  const st: AdminStats = s;
  const total = st.storage.totalBytes || 1;
  const seg = (b: number) => `${(b / total * 100).toFixed(1)}%`;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users size={14} />} label="Пользователи" value={formatNumber(st.users.total)} sub={`+${st.users.new7d} за неделю`} />
        <StatCard icon={<Music size={14} />} label="Треки" value={formatNumber(st.tracks.total)} sub={`+${st.tracks.new7d} за неделю`} />
        <StatCard icon={<Play size={14} />} label="Прослушивания" value={formatCount(st.engagement.totalPlays)} sub={`${formatNumber(st.engagement.uniquePlays)} уникальных`} />
        <StatCard icon={<HardDrive size={14} />} label="Занято места" value={formatBytes(st.storage.totalBytes)} sub="аудио + обложки + аватары" />
        <StatCard icon={<Heart size={14} />} label="Лайки" value={formatNumber(st.engagement.likes)} />
        <StatCard icon={<MessageCircle size={14} />} label="Комментарии" value={formatNumber(st.engagement.comments)} />
        <StatCard icon={<ListMusic size={14} />} label="Плейлисты" value={formatNumber(st.engagement.playlists)} />
        <StatCard icon={<Music size={14} />} label="Публичных треков" value={formatNumber(st.tracks.public)} sub={`${st.tracks.private} приватных · ${st.tracks.link} по ссылке`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><HardDrive size={15} /> Хранилище</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-[#1a1a1a] mb-3">
            <div className="bg-violet-500" style={{ width: seg(st.storage.audioBytes) }} />
            <div className="bg-blue-500" style={{ width: seg(st.storage.coverBytes) }} />
            <div className="bg-green-500" style={{ width: seg(st.storage.avatarBytes) }} />
          </div>
          <div className="space-y-1.5 text-sm">
            <Legend color="bg-violet-500" label="Аудио" value={formatBytes(st.storage.audioBytes)} />
            <Legend color="bg-blue-500" label="Обложки" value={formatBytes(st.storage.coverBytes)} />
            <Legend color="bg-green-500" label="Аватары" value={formatBytes(st.storage.avatarBytes)} />
          </div>
        </div>

        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Users size={15} /> Состав пользователей</h3>
          <div className="space-y-2 text-sm">
            <Legend color="bg-[#888]" label="Слушатели" value={String(st.users.listeners)} />
            <Legend color="bg-violet-400" label="Артисты" value={String(st.users.artists)} />
            <Legend color="bg-blue-400" label="Админы" value={String(st.users.admins)} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={15} /> Топ треков</h3>
        {st.topTracks.length === 0 ? <p className="text-sm text-[#666]">Пока нет треков.</p> : (
          <div className="space-y-1">
            {st.topTracks.slice(0, 10).map((t, i) => (
              <div key={t.id} onClick={() => navigate(`/track/${t.id}`)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <span className="w-5 text-center text-[#666] text-sm">{i + 1}</span>
                <img src={resolveAssetUrl(t.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-9 h-9 rounded object-cover bg-[#151515]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-[#666] truncate">{t.user?.nickname || t.user?.firstName}</p>
                </div>
                <span className="text-sm text-[#888] flex items-center gap-1"><Play size={12} /> {formatCount(t.plays_count)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Legend = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-[#aaa] flex-1">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const TracksTab = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { setTrack } = usePlayerStore();
  const [q, setQ] = useState('');
  const { data: tracks, isLoading } = useQuery({ queryKey: ['admin-tracks'], queryFn: () => adminApi.getTracks().then((r) => r.data) });

  const del = async (t: Track) => {
    if (!confirm(`Удалить трек «${t.title}»? Файлы и все связанные данные будут стёрты.`)) return;
    try {
      await adminApi.deleteTrack(t.id);
      toast.success('Трек удалён');
      qc.invalidateQueries({ queryKey: ['admin-tracks'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch { toast.error('Не удалось удалить'); }
  };

  const list = (tracks || []).filter((t) =>
    !q || t.title.toLowerCase().includes(q.toLowerCase()) ||
    (t.user?.nickname || t.user?.firstName || '').toLowerCase().includes(q.toLowerCase()));

  if (isLoading) return <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-14 bg-[#0e0e0e] rounded-lg animate-pulse" />)}</div>;

  return (
    <div>
      <div className="relative max-w-md mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию или артисту..." className="w-full pl-9 pr-3 py-2 bg-[#0e0e0e] border border-[#1f1f1f] rounded-lg text-sm outline-none focus:border-violet-500/60" />
      </div>
      <p className="text-xs text-[#666] mb-2">Всего: {list.length}</p>
      <div className="space-y-1">
        {list.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 group">
            <button onClick={() => setTrack(t, list)} className="relative shrink-0">
              <img src={resolveAssetUrl(t.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-11 h-11 rounded object-cover bg-[#151515]" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded transition"><Play size={16} /></span>
            </button>
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/track/${t.id}`)}>
              <p className="text-sm font-medium truncate">{t.title}</p>
              <p className="text-xs text-[#666] truncate">{t.user?.nickname || t.user?.firstName} · {t.genre || 'без жанра'}</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-[#888] shrink-0">
              <span className="flex items-center gap-1"><Play size={11} /> {formatCount(t.plays_count)}</span>
              <span>{formatBytes(t.size)}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${t.visibility === 'public' ? 'bg-green-500/15 text-green-400' : 'bg-[#222] text-[#999]'}`}>{t.visibility}</span>
              <span className="w-20 text-right">{formatDate(t.created_at)}</span>
            </div>
            <button onClick={() => del(t)} className="p-2 text-[#666] hover:text-red-400 transition shrink-0"><Trash2 size={16} /></button>
          </div>
        ))}
        {!list.length && <p className="text-sm text-[#666] py-6 text-center">Ничего не найдено.</p>}
      </div>
    </div>
  );
};

const ROLE_LABELS: Record<string, string> = { listener: 'Слушатель', artist: 'Артист', admin: 'Админ' };

const UsersTab = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: users, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminApi.getUsers().then((r) => r.data) });

  const changeRole = async (u: AdminUser, role: string) => {
    try {
      await adminApi.setRole(u.id, role);
      toast.success('Роль обновлена');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch { toast.error('Не удалось'); }
  };

  const del = async (u: AdminUser) => {
    if (!confirm(`Удалить пользователя ${u.nickname || u.email}? Все его треки, плейлисты и комментарии будут удалены.`)) return;
    try {
      await adminApi.deleteUser(u.id);
      toast.success('Пользователь удалён');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch { toast.error('Не удалось удалить'); }
  };

  if (isLoading) return <div className="space-y-2">{Array(6).fill(0).map((_, i) => <div key={i} className="h-14 bg-[#0e0e0e] rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-1">
      {(users || []).map((u) => (
        <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
          <button onClick={() => navigate(`/artist/${u.id}`)} className="shrink-0">
            {u.avatar ? <img src={resolveAssetUrl(u.avatar)} className="w-10 h-10 rounded-full object-cover" /> :
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-bold">{(u.nickname || u.firstName || '?')[0]?.toUpperCase()}</div>}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{u.nickname || `${u.firstName} ${u.lastName}`}</p>
            <p className="text-xs text-[#666] truncate">{u.email} · {u.trackCount} треков</p>
          </div>
          <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="bg-[#0e0e0e] border border-[#1f1f1f] rounded-lg text-xs px-2 py-1.5 outline-none focus:border-violet-500/60 shrink-0">
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={() => del(u)} className="p-2 text-[#666] hover:text-red-400 transition shrink-0"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
};

const CommentsTab = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: comments, isLoading } = useQuery({ queryKey: ['admin-comments'], queryFn: () => adminApi.getComments().then((r) => r.data) });

  const del = async (c: Comment) => {
    try {
      await adminApi.deleteComment(c.id);
      toast.success('Комментарий удалён');
      qc.invalidateQueries({ queryKey: ['admin-comments'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch { toast.error('Не удалось удалить'); }
  };

  if (isLoading) return <div className="space-y-2">{Array(6).fill(0).map((_, i) => <div key={i} className="h-14 bg-[#0e0e0e] rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-2">
      {(comments || []).map((c) => (
        <div key={c.id} className="flex items-start gap-3 px-3 py-3 rounded-lg bg-[#0e0e0e] border border-[#1a1a1a]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
            {(c.user?.nickname || c.user?.firstName || '?')[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{c.user?.nickname || c.user?.firstName}</span>
              <span className="text-xs text-[#666]">{formatDate(c.created_at)}</span>
              <button onClick={() => navigate(`/track/${c.trackId}`)} className="text-xs text-violet-400 hover:underline">→ трек #{c.trackId}</button>
            </div>
            <p className="text-sm text-[#c9c9c9] mt-1 break-words">{c.text}</p>
          </div>
          <button onClick={() => del(c)} className="p-2 text-[#666] hover:text-red-400 transition shrink-0"><Trash2 size={16} /></button>
        </div>
      ))}
      {!comments?.length && <p className="text-sm text-[#666] py-6 text-center">Комментариев нет.</p>}
    </div>
  );
};
