import type { Achievement } from '@/types';

const CATS: { key: string; label: string }[] = [
  { key: 'listener', label: 'Слушатель' },
  { key: 'artist', label: 'Артист' },
  { key: 'social', label: 'Сообщество' },
  { key: 'special', label: 'Особые' },
];

const Card = ({ a }: { a: Achievement }) => {
  const pct = a.target ? Math.min(100, Math.round((a.current / a.target) * 100)) : 0;
  const border = a.unlocked
    ? (a.premium ? 'border-yellow-400 bg-yellow-400/10' : 'border-violet-500 bg-violet-500/10')
    : 'border-[#2a2a2a] bg-[#0c0c0c]';
  return (
    <div title={a.desc} className={`relative border-4 ${border} pixel-shadow p-3 flex flex-col items-center text-center select-none`}>
      <div className={`text-4xl leading-none mb-2 ${a.unlocked ? '' : 'grayscale opacity-25'}`}>{a.emoji}</div>
      <p className="font-pixel text-[8px] text-white/90 min-h-[24px] flex items-center">{a.title}</p>
      {a.unlocked ? (
        <p className={`font-pixel text-[7px] mt-1.5 ${a.premium ? 'text-yellow-300' : 'text-violet-300'}`}>
          {a.premium ? '★ PREMIUM' : 'ОТКРЫТО'}
        </p>
      ) : (
        <div className="w-full mt-1.5">
          <p className="text-[10px] text-[#777]">{a.current} / {a.target}</p>
          <div className="w-full h-1.5 bg-[#222] mt-1"><div className="h-full bg-violet-500" style={{ width: `${pct}%` }} /></div>
        </div>
      )}
    </div>
  );
};

export const PixelAchievements = ({ achievements, unlockedCount, total }: {
  achievements: Achievement[];
  unlockedCount: number;
  total: number;
}) => {
  const overall = total ? Math.round((unlockedCount / total) * 100) : 0;
  return (
    <div className="space-y-6">
      <div className="border-4 border-[#242424] pixel-shadow bg-[#0e0e0e] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[10px] text-white">КОЛЛЕКЦИЯ</span>
          <span className="font-pixel text-[10px] text-violet-300">{unlockedCount} / {total}</span>
        </div>
        <div className="w-full h-3 bg-[#222]"><div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${overall}%` }} /></div>
      </div>

      {CATS.map((c) => {
        const items = achievements.filter((a) => a.category === c.key);
        if (!items.length) return null;
        return (
          <div key={c.key} className="space-y-3">
            <h3 className="font-pixel text-[10px] text-[#888] uppercase">{c.label}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {items.map((a) => <Card key={a.id} a={a} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
