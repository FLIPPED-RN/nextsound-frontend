import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Heart, MessageCircle, Repeat2, Music, BarChart3, Lock, Headphones } from 'lucide-react';
import { statsApi } from '../api/stats.api';
import { resolveAssetUrl, formatCount, formatNumber } from '@/lib/utils';

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4">
    <div className="flex items-center gap-2 text-[#888] text-xs mb-2">{icon}{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const PlaysChart = ({ data }: { data: { date: string; count: number }[] }) => {
  const max = Math.max(1, ...data.map((d) => d.count));
  const W = 720, H = 170, n = data.length, bw = W / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.count / max) * (H - 18);
        return <rect key={i} x={i * bw + 2} y={H - h} width={Math.max(1, bw - 4)} height={h} rx="2" fill="url(#barg)" />;
      })}
      <defs><linearGradient id="barg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#6d28d9" /></linearGradient></defs>
    </svg>
  );
};

const LockedBlock = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  return (
    <div className="relative rounded-2xl border border-[#242424] bg-[#0e0e0e] p-6 overflow-hidden min-h-[180px]">
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
  const { data: s, isLoading } = useQuery({ queryKey: ['my-stats'], queryFn: () => statsApi.getMine().then((r) => r.data) });

  if (isLoading || !s) {
    return <div className="px-4 md:px-8 py-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <div key={i} className="h-24 bg-[#0e0e0e] rounded-2xl animate-pulse" />)}</div></div>;
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center"><BarChart3 size={22} /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Статистика</h1>
          <p className="text-xs text-[#777]">Аналитика твоих треков и аудитории</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Play size={14} />} label="Прослушивания" value={formatCount(s.summary.totalPlays)} />
        <StatCard icon={<Headphones size={14} />} label="Слушателей" value={formatNumber(s.summary.uniqueListeners)} />
        <StatCard icon={<Users size={14} />} label="Подписчики" value={formatNumber(s.summary.followers)} />
        <StatCard icon={<Music size={14} />} label="Треков" value={formatNumber(s.summary.trackCount)} />
        <StatCard icon={<Heart size={14} />} label="Лайки" value={formatNumber(s.summary.likes)} />
        <StatCard icon={<MessageCircle size={14} />} label="Комментарии" value={formatNumber(s.summary.comments)} />
        <StatCard icon={<Repeat2 size={14} />} label="Репосты" value={formatNumber(s.summary.reposts)} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 size={15} /> Прослушивания за 30 дней</h3>
        {s.playsByDay
          ? <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-4"><PlaysChart data={s.playsByDay} /></div>
          : <LockedBlock title="График прослушиваний по дням" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Music size={15} /> Топ треков</h3>
          <div className="space-y-1">
            {s.topTracks.length === 0 ? <p className="text-sm text-[#666]">Пока нет треков.</p> : s.topTracks.map((t, i) => (
              <div key={t.id} onClick={() => navigate(`/track/${t.id}`)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <span className="w-5 text-center text-[#666] text-sm">{i + 1}</span>
                <img src={resolveAssetUrl(t.cover_path)} onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }} className="w-9 h-9 rounded object-cover bg-[#151515]" />
                <p className="text-sm font-medium truncate flex-1">{t.title}</p>
                <span className="text-sm text-[#888] flex items-center gap-1"><Play size={12} /> {formatCount(t.plays_count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Headphones size={15} /> Кто тебя слушает</h3>
          {s.recentListeners
            ? (s.recentListeners.length === 0
              ? <p className="text-sm text-[#666]">Пока нет слушателей.</p>
              : <div className="flex flex-wrap gap-3">
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
