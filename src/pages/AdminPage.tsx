import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Music, Play, Heart, MessageCircle, ListMusic, HardDrive,
  Trash2, ShieldCheck, Search, TrendingUp, BadgeCheck, Star, Flag, Check,
  Copyright, X, ExternalLink, Gauge,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin.api';
import { playlistsApi } from '../api/playlists.api';
import { copyrightApi } from '../api/copyright.api';
import { analyticsApi } from '../api/analytics.api';
import type { AdminStats, AdminUser } from '../api/admin.api';
import { usePlayerStore } from '../store/player.store';
import { resolveAssetUrl, formatNumber, formatCount, formatBytes, formatDate } from '@/lib/utils';
import type { Track, Comment } from '@/types';

type Tab = 'overview' | 'funnel' | 'tracks' | 'users' | 'comments' | 'reports' | 'copyright' | 'exclusive';

export const AdminPage = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const { data: reports } = useQuery({ queryKey: ['admin-reports'], queryFn: () => adminApi.getReports().then((r) => r.data) });
  const { data: claims } = useQuery({ queryKey: ['admin-copyright'], queryFn: () => copyrightApi.list().then((r) => r.data) });
  const newClaims = (claims || []).filter((c) => c.status === 'new').length;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Обзор' },
    { id: 'funnel', label: 'Воронка' },
    { id: 'tracks', label: 'Треки' },
    { id: 'users', label: 'Пользователи' },
    { id: 'comments', label: 'Комментарии' },
    { id: 'reports', label: `Жалобы${reports?.length ? ` (${reports.length})` : ''}` },
    { id: 'copyright', label: `Копирайт${newClaims ? ` (${newClaims})` : ''}` },
    { id: 'exclusive', label: 'Эксклюзив' },
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
      {tab === 'funnel' && <FunnelTab />}
      {tab === 'tracks' && <TracksTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'comments' && <CommentsTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'copyright' && <CopyrightTab />}
      {tab === 'exclusive' && <ExclusiveTab />}
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

  const toggleFeatured = async (t: Track) => {
    try {
      await adminApi.setFeatured(t.id, !t.isFeatured);
      toast.success(!t.isFeatured ? 'Трек в «Рекомендуем»' : 'Убрано из рекомендаций');
      qc.invalidateQueries({ queryKey: ['admin-tracks'] });
      qc.invalidateQueries({ queryKey: ['tracks'] });
    } catch { toast.error('Не удалось'); }
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
            <button onClick={() => toggleFeatured(t)} title="Рекомендуем" className={`p-2 transition shrink-0 ${t.isFeatured ? 'text-yellow-400' : 'text-[#666] hover:text-yellow-400'}`}>
              <Star size={16} className={t.isFeatured ? 'fill-yellow-400' : ''} />
            </button>
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

  const changeVerified = async (u: AdminUser, verified: boolean) => {
    try {
      await adminApi.setArtistVerified(u.id, verified);
      toast.success(verified ? 'Артист подтверждён' : 'Подтверждение снято');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch { toast.error('Не удалось'); }
  };

  const changePlan = async (u: AdminUser, plan: string) => {
    try {
      await adminApi.setPlan(u.id, plan);
      toast.success(`Тариф: ${plan}`);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch { toast.error('Не удалось'); }
  };

  if (isLoading) return <div className="space-y-2">{Array(6).fill(0).map((_, i) => <div key={i} className="h-14 bg-[#0e0e0e] rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-1">
      {(users || []).map((u) => (
        <div key={u.id} className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
          <button onClick={() => navigate(`/artist/${u.id}`)} className="shrink-0">
            {u.avatar ? <img src={resolveAssetUrl(u.avatar)} className="w-10 h-10 rounded-full object-cover" /> :
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-bold">{(u.nickname || u.firstName || '?')[0]?.toUpperCase()}</div>}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate flex items-center gap-1">
              {u.nickname || `${u.firstName} ${u.lastName}`}
              {u.isArtistVerified && <BadgeCheck size={14} className="text-blue-400 shrink-0" />}
            </p>
            <p className="text-xs text-[#666] truncate">{u.email} · {u.trackCount} треков</p>
          </div>
          <select
            value={u.isArtistVerified ? '1' : '0'}
            onChange={(e) => changeVerified(u, e.target.value === '1')}
            title="Подтверждённый артист"
            className="bg-[#0e0e0e] border border-[#1f1f1f] rounded-lg text-xs px-2 py-1.5 outline-none focus:border-violet-500/60 shrink-0"
          >
            <option value="0">Не подтверждён</option>
            <option value="1">✓ Артист</option>
          </select>
          <select value={u.plan || 'free'} onChange={(e) => changePlan(u, e.target.value)} title="Тариф подписки" className="bg-[#0e0e0e] border border-[#1f1f1f] rounded-lg text-xs px-2 py-1.5 outline-none focus:border-violet-500/60 shrink-0">
            {['free', 'plus', 'artist', 'pro'].map((p) => <option key={p} value={p}>{p === 'free' ? 'Free' : p[0].toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} title="Роль" className="bg-[#0e0e0e] border border-[#1f1f1f] rounded-lg text-xs px-2 py-1.5 outline-none focus:border-violet-500/60 shrink-0 hidden sm:block">
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

const ReportsTab = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: reports, isLoading } = useQuery({ queryKey: ['admin-reports'], queryFn: () => adminApi.getReports().then((r) => r.data) });

  const dismiss = async (id: number) => {
    try {
      await adminApi.dismissReport(id);
      toast.success('Жалоба закрыта');
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
    } catch { toast.error('Не удалось'); }
  };

  const removeTrack = async (trackId: number) => {
    if (!confirm('Удалить трек по жалобе? Файлы и все данные будут стёрты.')) return;
    try {
      await adminApi.deleteTrack(trackId);
      toast.success('Трек удалён');
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-tracks'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch { toast.error('Не удалось удалить'); }
  };

  if (isLoading) return <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-[#0e0e0e] rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-2">
      {(reports || []).map((r) => (
        <div key={r.id} className="flex items-start gap-3 px-3 py-3 rounded-lg bg-[#0e0e0e] border border-[#1a1a1a]">
          <Flag size={16} className="text-red-400 shrink-0 mt-1" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {r.track
                ? <button onClick={() => navigate(`/track/${r.trackId}`)} className="text-sm font-medium text-violet-300 hover:underline truncate">{r.track.title}</button>
                : <span className="text-sm text-[#666]">Трек удалён (#{r.trackId})</span>}
              <span className="text-xs text-[#666]">от {r.reporter?.nickname || r.reporter?.firstName || 'аноним'} · {formatDate(r.created_at)}</span>
            </div>
            <p className="text-sm text-[#c9c9c9] mt-1 break-words">{r.reason}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {r.track && <button onClick={() => removeTrack(r.trackId)} title="Удалить трек" className="p-2 text-[#666] hover:text-red-400 transition"><Trash2 size={16} /></button>}
            <button onClick={() => dismiss(r.id)} title="Закрыть жалобу" className="p-2 text-[#666] hover:text-green-400 transition"><Check size={16} /></button>
          </div>
        </div>
      ))}
      {!reports?.length && <p className="text-sm text-[#666] py-6 text-center">Жалоб нет.</p>}
    </div>
  );
};

const FunnelTab = () => {
  const [days, setDays] = useState(30);
  const { data: f, isLoading } = useQuery({ queryKey: ['admin-funnel', days], queryFn: () => analyticsApi.funnel(days).then((r) => r.data) });

  if (isLoading || !f) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-[#0e0e0e] rounded-2xl animate-pulse" />)}</div>;

  const steps = [
    { label: 'Просмотры /premium', value: f.counts.views, color: 'bg-violet-500' },
    { label: 'Клики «Оформить/Подарить»', value: f.counts.clicks, color: 'bg-fuchsia-500' },
    { label: 'Перешли к оплате', value: f.counts.created, color: 'bg-blue-500' },
    { label: 'Оплатили', value: f.counts.paid, color: 'bg-emerald-500' },
  ];
  const max = Math.max(1, f.counts.views);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-full text-sm transition ${days === d ? 'bg-white text-black font-semibold' : 'bg-[#151515] text-[#aaa] hover:text-white'}`}>{d} дн.</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Gauge size={14} />} label="Просмотр → клик" value={`${f.rates.viewToClick}%`} />
        <StatCard icon={<Gauge size={14} />} label="Клик → оплата" value={`${f.rates.clickToPaid}%`} />
        <StatCard icon={<Gauge size={14} />} label="Просмотр → оплата" value={`${f.rates.viewToPaid}%`} sub="итоговая конверсия" />
        <StatCard icon={<Gauge size={14} />} label="Чекаут → оплата" value={`${f.rates.checkoutToPaid}%`} sub="доводимость оплаты" />
      </div>

      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold mb-2">Воронка за {days} дн.</h3>
        {steps.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between text-sm mb-1"><span className="text-[#bbb]">{s.label}</span><span className="font-semibold">{formatNumber(s.value)}</span></div>
            <div className="h-2.5 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div className={`h-full ${s.color}`} style={{ width: `${Math.max(2, (s.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {!!f.paidByPlan.length && (
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3">Оплаты по тарифам</h3>
          <div className="space-y-2 text-sm">
            {f.paidByPlan.map((p) => (
              <div key={p.plan} className="flex justify-between"><span className="text-[#aaa] capitalize">{p.plan}</span><span className="font-medium">{p.count}</span></div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-[#666]">Данные накапливаются с момента релиза аналитики — на старте цифры будут расти постепенно.</p>
    </div>
  );
};

const CLAIM_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новое', cls: 'bg-amber-500/15 text-amber-400' },
  resolved: { label: 'Удалено/решено', cls: 'bg-emerald-500/15 text-emerald-400' },
  rejected: { label: 'Отклонено', cls: 'bg-[#222] text-[#999]' },
};

const CopyrightTab = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: claims, isLoading } = useQuery({ queryKey: ['admin-copyright'], queryFn: () => copyrightApi.list().then((r) => r.data) });

  const setStatus = async (id: number, status: string) => {
    try {
      await copyrightApi.setStatus(id, status);
      qc.invalidateQueries({ queryKey: ['admin-copyright'] });
    } catch { toast.error('Не удалось'); }
  };

  const removeTrack = async (trackId: number, claimId: number) => {
    if (!confirm('Удалить трек по обращению правообладателя? Файлы и все данные будут стёрты.')) return;
    try {
      await adminApi.deleteTrack(trackId);
      await copyrightApi.setStatus(claimId, 'resolved');
      toast.success('Трек удалён, обращение закрыто');
      qc.invalidateQueries({ queryKey: ['admin-copyright'] });
      qc.invalidateQueries({ queryKey: ['admin-tracks'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch { toast.error('Не удалось удалить'); }
  };

  if (isLoading) return <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-[#0e0e0e] rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-2">
      {(claims || []).map((c) => {
        const st = CLAIM_STATUS[c.status] || CLAIM_STATUS.new;
        return (
          <div key={c.id} className="px-4 py-3 rounded-xl bg-[#0e0e0e] border border-[#1a1a1a]">
            <div className="flex items-start gap-3">
              <Copyright size={16} className="text-amber-400 shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{c.claimantName}</span>
                  {c.claimantOrg && <span className="text-xs text-[#888]">· {c.claimantOrg}</span>}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  <span className="text-xs text-[#666]">{formatDate(c.created_at)}</span>
                </div>
                <a href={`mailto:${c.claimantEmail}`} className="text-xs text-violet-300 hover:underline">{c.claimantEmail}</a>
                <p className="text-sm text-[#c9c9c9] mt-1.5 break-words whitespace-pre-wrap">{c.description}</p>
                <a href={c.trackUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#888] hover:text-white mt-1.5 break-all">
                  <ExternalLink size={12} /> {c.trackUrl}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-1.5 justify-end mt-2 flex-wrap">
              {c.trackId && <button onClick={() => navigate(`/track/${c.trackId}`)} className="text-xs px-3 py-1.5 rounded-full bg-[#181818] text-[#bbb] hover:text-white transition">Открыть трек</button>}
              {c.trackId && <button onClick={() => removeTrack(c.trackId!, c.id)} className="text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 transition inline-flex items-center gap-1"><Trash2 size={13} /> Удалить трек</button>}
              <button onClick={() => setStatus(c.id, 'resolved')} className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition inline-flex items-center gap-1"><Check size={13} /> Решено</button>
              <button onClick={() => setStatus(c.id, 'rejected')} className="text-xs px-3 py-1.5 rounded-full bg-[#181818] text-[#999] hover:text-white transition inline-flex items-center gap-1"><X size={13} /> Отклонить</button>
            </div>
          </div>
        );
      })}
      {!claims?.length && <p className="text-sm text-[#666] py-6 text-center">Обращений правообладателей нет.</p>}
    </div>
  );
};

const ExclusiveTab = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const { data: playlists, isLoading } = useQuery({ queryKey: ['exclusive-playlists'], queryFn: () => playlistsApi.getExclusive().then((r) => r.data) });

  const create = async () => {
    if (!name.trim()) return;
    try {
      await playlistsApi.createExclusive(name.trim());
      toast.success('Эксклюзивный плейлист создан');
      setName('');
      qc.invalidateQueries({ queryKey: ['exclusive-playlists'] });
    } catch { toast.error('Не удалось создать'); }
  };

  const changeCover = async (id: number, file?: File) => {
    if (!file) return;
    try {
      await playlistsApi.setCover(id, file);
      toast.success('Обложка обновлена');
      qc.invalidateQueries({ queryKey: ['exclusive-playlists'] });
    } catch { toast.error('Не удалось загрузить обложку'); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4">
        <p className="text-sm font-semibold mb-1">Создать эксклюзивный плейлист</p>
        <p className="text-xs text-[#777] mb-3">Доступен только подписчикам Plus и выше. Треки добавляются на странице трека через «Добавить в плейлист».</p>
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название подборки" className="flex-1 bg-[#0e0e0e] border border-[#1f1f1f] rounded-lg text-sm px-3 py-2 outline-none focus:border-violet-500/60" />
          <button onClick={create} className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 transition">Создать</button>
        </div>
      </div>

      {isLoading ? <div className="h-14 bg-[#0e0e0e] rounded-lg animate-pulse" /> : (
        <div className="space-y-1">
          {(playlists || []).map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
              <img src={resolveAssetUrl(p.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-10 h-10 rounded object-cover bg-[#151515]" />
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/playlists/${p.id}`)}>
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-[#666]">{p.trackCount} треков · эксклюзив</p>
              </div>
              <label className="text-xs text-violet-300 hover:text-violet-200 cursor-pointer px-2 py-1 shrink-0">
                Обложка
                <input type="file" accept="image/*" className="hidden" onChange={(e) => changeCover(p.id, e.target.files?.[0])} />
              </label>
            </div>
          ))}
          {!playlists?.length && <p className="text-sm text-[#666] py-6 text-center">Эксклюзивных плейлистов пока нет.</p>}
        </div>
      )}
    </div>
  );
};
