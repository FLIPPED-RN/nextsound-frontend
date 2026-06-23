import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Play, Users, Heart, MessageCircle, Repeat2, Music, BarChart3, Lock,
  Headphones, TrendingUp, TrendingDown, Flame, Sparkles, Gauge, UserPlus,
} from 'lucide-react';
import { statsApi, type ArtistStats } from '../api/stats.api';
import { resolveAssetUrl, formatCount, formatNumber } from '@/lib/utils';

const Trend = ({ v }: { v: number }) => {
  if (!v) return <span className="text-[11px] text-[#777]">—</span>;
  const up = v > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{up ? '+' : ''}{v}%
    </span>
  );
};

const Headline = ({ icon, label, value, sub, trend, from, to }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; trend?: number; from: string; to: string;
}) => (
  <div className="relative overflow-hidden rounded-2xl p-4 border border-white/5" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
    <div className="absolute -right-4 -top-4 opacity-10 text-white scale-[2.6]">{icon}</div>
    <div className="relative">
      <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">{icon}{label}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {trend !== undefined && <Trend v={trend} />}
        {sub && <span className="text-[11px] text-white/60">{sub}</span>}
      </div>
    </div>
  </div>
);

const StatPill = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4 hover:border-[#2a2a2a] transition">
    <div className="flex items-center gap-2 text-xs mb-2" style={{ color }}>{icon}<span className="text-[#888]">{label}</span></div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const AreaChart = ({ data }: { data: { date: string; count: number }[] }) => {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760, H = 200, padB = 22, padT = 10;
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.count));
  const avg = data.reduce((s, d) => s + d.count, 0) / (n || 1);
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => padT + (1 - v / max) * (H - padB - padT);

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.count).toFixed(1)}`).join(' ');
  const area = `${line} L ${W} ${H - padB} L 0 ${H - padB} Z`;
  const peak = data.reduce((m, d, i) => (d.count > data[m].count ? i : m), 0);

  const fmt = (s: string) => { const [, m, dd] = s.split('-'); return `${dd}.${m}`; };
  const ticks = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];

  return (
    <div
      className="relative w-full"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        setHover(Math.round(ratio * (n - 1)));
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={padT + g * (H - padB - padT)} y2={padT + g * (H - padB - padT)} stroke="#1c1c1c" strokeWidth="1" />
        ))}
        <line x1="0" x2={W} y1={y(avg)} y2={y(avg)} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
        <path d={area} fill="url(#area)" />
        <path d={line} fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(peak)} cy={y(data[peak].count)} r="4" fill="#f59e0b" stroke="#1a1a1a" strokeWidth="1.5" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="#a855f7" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx={x(hover)} cy={y(data[hover].count)} r="4.5" fill="#fff" stroke="#a855f7" strokeWidth="2.5" />
          </>
        )}
      </svg>
      <div className="flex justify-between px-0.5 -mt-3 text-[10px] text-[#666]">
        {ticks.map((t) => <span key={t}>{fmt(data[t].date)}</span>)}
      </div>
      {hover !== null && (
        <div
          className="absolute -top-1 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-xs pointer-events-none shadow-xl whitespace-nowrap"
          style={{ left: `${Math.min(88, Math.max(12, (hover / (n - 1)) * 100))}%`, transform: 'translateX(-50%)' }}
        >
          <span className="text-white font-bold">{formatNumber(data[hover].count)}</span>
          <span className="text-[#888] ml-1.5">{fmt(data[hover].date)}</span>
        </div>
      )}
    </div>
  );
};

const LockedBlock = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  return (
    <div className="relative rounded-2xl border border-[#242424] bg-[#0e0e0e] p-6 overflow-hidden min-h-[200px]">
      <div className="absolute inset-0 flex items-end gap-1 p-6 blur-sm opacity-30 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => <div key={i} className="flex-1 bg-violet-500 rounded" style={{ height: `${20 + ((i * 37) % 80)}%` }} />)}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4">
        <Lock size={26} className="text-violet-400" />
        <p className="text-sm text-[#cfcfcf]">{title} — доступно по подписке</p>
        <button onClick={() => navigate('/premium')} className="px-5 py-2 rounded-full bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition">Оформить подписку</button>
      </div>
    </div>
  );
};

export const StatsPage = () => {
  const navigate = useNavigate();
  const { data: s, isLoading } = useQuery<ArtistStats>({ queryKey: ['my-stats'], queryFn: () => statsApi.getMine().then((r) => r.data) });

  if (isLoading || !s) {
    return <div className="px-4 md:px-8 py-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <div key={i} className="h-24 bg-[#0e0e0e] rounded-2xl animate-pulse" />)}</div></div>;
  }

  const t = s.trends;

  return (
    <div className="px-4 md:px-8 py-6 space-y-7 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center"><BarChart3 size={22} /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Статистика</h1>
          <p className="text-xs text-[#777]">Аналитика твоих треков и аудитории</p>
        </div>
      </div>

      {/* Headline cards with trends */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Headline icon={<Flame size={15} />} label="Сегодня" value={formatNumber(t.playsToday)} sub="прослушиваний" from="#7c3aed25" to="#db277725" />
        <Headline icon={<Play size={15} />} label="За 7 дней" value={formatCount(t.plays7d)} trend={t.playsTrend} sub="vs прошлая неделя" from="#2563eb25" to="#7c3aed25" />
        <Headline icon={<UserPlus size={15} />} label="Новые подписчики" value={formatNumber(t.followers7d)} trend={t.followersTrend} sub="за 7 дней" from="#059f6925" to="#2563eb25" />
        <Headline icon={<Gauge size={15} />} label="Вовлечённость" value={`${t.engagementRate}%`} sub="реакций на прослуш." from="#db277725" to="#f59e0b25" />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatPill icon={<Play size={14} />} label="Всего прослуш." value={formatCount(s.summary.totalPlays)} color="#c084fc" />
        <StatPill icon={<Headphones size={14} />} label="Слушателей" value={formatNumber(s.summary.uniqueListeners)} color="#60a5fa" />
        <StatPill icon={<Users size={14} />} label="Подписчики" value={formatNumber(s.summary.followers)} color="#34d399" />
        <StatPill icon={<Heart size={14} />} label="Лайки" value={formatNumber(s.summary.likes)} color="#f87171" />
        <StatPill icon={<MessageCircle size={14} />} label="Комментарии" value={formatNumber(s.summary.comments)} color="#38bdf8" />
        <StatPill icon={<Repeat2 size={14} />} label="Репосты" value={formatNumber(s.summary.reposts)} color="#4ade80" />
      </div>

      {/* Chart */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><BarChart3 size={15} className="text-violet-400" /> Прослушивания за 30 дней</h3>
          {s.playsByDay && (
            <div className="flex items-center gap-3 text-[11px] text-[#888]">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#3f3f46]" style={{ borderTop: '1px dashed #3f3f46' }} /> среднее</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> пик</span>
            </div>
          )}
        </div>
        {s.playsByDay
          ? <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4 pt-5"><AreaChart data={s.playsByDay} /></div>
          : <LockedBlock title="График прослушиваний по дням" />}
      </div>

      {/* secondary metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatPill icon={<Sparkles size={14} />} label="В среднем на трек" value={formatNumber(t.avgPerTrack)} color="#fbbf24" />
        <StatPill icon={<Music size={14} />} label="Треков" value={formatNumber(s.summary.trackCount)} color="#a78bfa" />
        <StatPill icon={<Play size={14} />} label="За 30 дней" value={formatCount(t.plays30d)} color="#c084fc" />
        <StatPill icon={<Headphones size={14} />} label="Слушателей за 7д" value={formatNumber(t.listeners7d)} color="#60a5fa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Music size={15} className="text-violet-400" /> Топ треков</h3>
          <div className="space-y-1 bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-2">
            {s.topTracks.length === 0 ? <p className="text-sm text-[#666] p-3">Пока нет треков.</p> : s.topTracks.map((tr, i) => {
              const pct = Math.round((tr.plays_count / Math.max(1, s.topTracks[0].plays_count)) * 100);
              return (
                <div key={tr.id} onClick={() => navigate(`/track/${tr.id}`)} className="relative flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 bg-violet-500/[0.07]" style={{ width: `${pct}%` }} />
                  <span className={`relative w-5 text-center text-sm font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-[#666]'}`}>{i + 1}</span>
                  <img src={resolveAssetUrl(tr.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="relative w-9 h-9 rounded object-cover bg-[#151515]" />
                  <p className="relative text-sm font-medium truncate flex-1">{tr.title}</p>
                  <span className="relative text-sm text-[#aaa] flex items-center gap-1 font-semibold"><Play size={12} /> {formatCount(tr.plays_count)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Headphones size={15} className="text-violet-400" /> Кто тебя слушает</h3>
          {s.recentListeners
            ? (s.recentListeners.length === 0
              ? <p className="text-sm text-[#666]">Пока нет слушателей.</p>
              : <div className="flex flex-wrap gap-3 bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4">
                {s.recentListeners.map((u) => (
                  <button key={u.id} onClick={() => navigate(`/artist/${u.id}`)} className="flex flex-col items-center w-16 group">
                    {u.avatar
                      ? <img src={resolveAssetUrl(u.avatar)} className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition" />
                      : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-bold">{(u.nickname || u.firstName || '?')[0]?.toUpperCase()}</div>}
                    <span className="text-[11px] text-[#999] truncate w-full text-center mt-1">{u.nickname || u.firstName}</span>
                  </button>
                ))}
              </div>)
            : <LockedBlock title="Список слушателей" />}
        </div>
      </div>
    </div>
  );
};
