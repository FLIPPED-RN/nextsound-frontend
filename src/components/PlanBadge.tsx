import { effectivePlan } from '../lib/plans';

const STYLES: Record<string, { label: string; cls: string }> = {
  plus: { label: 'Plus', cls: 'bg-violet-500/20 text-violet-300' },
  artist: { label: 'Artist', cls: 'bg-blue-500/20 text-blue-300' },
  pro: { label: 'Pro', cls: 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' },
};

export const PlanBadge = ({ user, size = 'sm' }: {
  user?: { plan?: string | null; planExpires?: string | null } | null;
  size?: 'sm' | 'md';
}) => {
  const p = effectivePlan(user);
  const s = STYLES[p];
  if (!s) return null;
  const cls = size === 'md' ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5';
  return (
    <span className={`inline-flex items-center font-bold rounded shrink-0 ${cls} ${s.cls}`}>
      {s.label}
    </span>
  );
};
