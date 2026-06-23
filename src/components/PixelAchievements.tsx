import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { Achievement } from '@/types';

const RARITY = {
  common: { label: 'ОБЫЧНОЕ', color: '#8b95a1', soft: 'rgba(139,149,161,0.10)' },
  rare: { label: 'РЕДКОЕ', color: '#3b82f6', soft: 'rgba(59,130,246,0.14)' },
  epic: { label: 'ЭПИК', color: '#a855f7', soft: 'rgba(168,85,247,0.16)' },
  legendary: { label: 'ЛЕГЕНДА', color: '#f59e0b', soft: 'rgba(245,158,11,0.16)' },
} as const;

const RARITY_OF: Record<string, keyof typeof RARITY> = {
  first_listen: 'common', debut: 'common', curator: 'common',
  liker: 'rare', first_fan: 'rare', critic: 'rare', spreader: 'rare', melomaniac: 'rare',
  rising: 'epic', album_out: 'epic', famous: 'epic',
  star: 'legendary', explorer: 'legendary', patron: 'legendary', collector: 'legendary',
};
const rarityOf = (id: string) => RARITY[RARITY_OF[id] || 'common'];

const CATS: { key: string; label: string; icon: string }[] = [
  { key: 'listener', label: 'Слушатель', icon: '🎧' },
  { key: 'artist', label: 'Артист', icon: '🎤' },
  { key: 'social', label: 'Сообщество', icon: '💬' },
  { key: 'special', label: 'Особые', icon: '👑' },
];

const rankOf = (pct: number) =>
  pct >= 100 ? 'Легенда NextSound' : pct >= 67 ? 'Коллекционер' : pct >= 34 ? 'Знаток' : pct > 0 ? 'Любитель' : 'Новичок';

const Card = ({ a, i }: { a: Achievement; i: number }) => {
  const r = rarityOf(a.id);
  const pct = a.target ? Math.min(100, Math.round((a.current / a.target) * 100)) : 0;
  const legendary = RARITY_OF[a.id] === 'legendary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32, delay: (i % 10) * 0.035 }}
      whileHover={{ scale: 1.06, y: -2 }}
      className={`relative overflow-hidden rounded-xl p-3 min-w-0 flex flex-col items-center text-center ${a.unlocked ? 'ach-shine' : ''} ${a.unlocked && legendary ? 'ach-gold' : ''}`}
      style={{
        border: `2px solid ${a.unlocked ? r.color : '#262626'}`,
        background: a.unlocked ? r.soft : '#0b0b0b',
        boxShadow: a.unlocked && !legendary ? `0 0 14px ${r.color}40` : undefined,
      }}
    >
      <span
        className="absolute top-1.5 left-1.5 font-pixel text-[6px] px-1 py-0.5 rounded"
        style={{ color: a.unlocked ? r.color : '#444', border: `1px solid ${a.unlocked ? r.color : '#333'}` }}
      >
        {r.label}
      </span>

      <div className={`text-4xl leading-none mt-3 mb-2 transition ${a.unlocked ? 'drop-shadow-lg' : 'grayscale opacity-20'}`}>
        {a.emoji}
      </div>
      <p className="font-pixel text-[8px] text-white/90 leading-relaxed break-words w-full min-h-[26px] flex items-center justify-center">{a.title}</p>

      {a.unlocked ? (
        <p className="font-pixel text-[7px] mt-1.5" style={{ color: r.color }}>{a.premium ? '★ PREMIUM' : '✓ ОТКРЫТО'}</p>
      ) : (
        <div className="w-full mt-1.5">
          <div className="flex items-center justify-center gap-1 text-[10px] text-[#777]">
            <Lock size={9} /> {a.current}/{a.target}
          </div>
          <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full mt-1 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.color }} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const PixelAchievements = ({ achievements, unlockedCount, total }: {
  achievements: Achievement[];
  unlockedCount: number;
  total: number;
}) => {
  const overall = total ? Math.round((unlockedCount / total) * 100) : 0;
  const R = 34, C = 2 * Math.PI * R, off = C * (1 - overall / 100);
  const byRar = (t: keyof typeof RARITY) => achievements.filter((a) => a.unlocked && (RARITY_OF[a.id] || 'common') === t).length;

  return (
    <div className="space-y-7 w-full overflow-x-hidden">
      {/* Hero / trophy room */}
      <div className="relative overflow-hidden rounded-2xl border border-[#242424] bg-gradient-to-br from-violet-600/15 via-[#0e0e0e] to-fuchsia-600/10 p-5 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <svg width="92" height="92" viewBox="0 0 84 84" className="shrink-0">
          <circle cx="42" cy="42" r={R} stroke="#1f1f1f" strokeWidth="8" fill="none" />
          <circle cx="42" cy="42" r={R} stroke="url(#ringg)" strokeWidth="8" fill="none" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 42 42)" />
          <defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs>
          <text x="42" y="47" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">{overall}%</text>
        </svg>
        <div className="min-w-0">
          <p className="font-pixel text-[9px] text-[#888] mb-1">РАНГ</p>
          <h3 className="font-pixel text-[13px] text-white leading-relaxed">{rankOf(overall)}</h3>
          <p className="text-sm text-[#aaa] mt-2">Открыто <span className="text-white font-semibold">{unlockedCount}</span> из {total} достижений</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs justify-center sm:justify-start">
            {(['legendary', 'epic', 'rare', 'common'] as const).map((t) => (
              <span key={t} className="inline-flex items-center gap-1" style={{ color: RARITY[t].color }}>
                <span className="w-2 h-2 rounded-sm" style={{ background: RARITY[t].color }} /> {byRar(t)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {CATS.map((c) => {
        const items = achievements.filter((a) => a.category === c.key);
        if (!items.length) return null;
        const got = items.filter((a) => a.unlocked).length;
        return (
          <div key={c.key} className="space-y-3">
            <h3 className="font-pixel text-[10px] text-[#999] flex flex-wrap items-center gap-2">
              <span>{c.icon}</span> {c.label.toUpperCase()}
              <span className="text-violet-300">{got}/{items.length}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((a, i) => <Card key={a.id} a={a} i={i} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
