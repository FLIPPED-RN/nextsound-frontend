export type Plan = 'free' | 'plus' | 'artist' | 'pro';

export const PLAN_LABELS: Record<string, string> = {
  free: 'Free', plus: 'Plus', artist: 'Artist', pro: 'Pro',
};

interface PlanHolder { plan?: string | null; planExpires?: string | null }

export function effectivePlan(user?: PlanHolder | null): Plan {
  if (!user || !user.plan || user.plan === 'free') return 'free';
  if (user.planExpires && new Date(user.planExpires).getTime() < Date.now()) return 'free';
  return user.plan as Plan;
}

export function isSubscriber(user?: PlanHolder | null): boolean {
  return effectivePlan(user) !== 'free';
}

export const PLANS = [
  {
    id: 'plus', name: 'Plus', price: 199, audience: 'для слушателей',
    perks: ['Доступ к эксклюзивным плейлистам', 'Скачивание в высоком качестве', 'Значок Plus в профиле'],
  },
  {
    id: 'artist', name: 'Artist', price: 399, audience: 'для артистов',
    perks: ['Всё из Plus', 'Загрузка до 50 треков, файл до 100 МБ', 'Значок Artist'],
  },
  {
    id: 'pro', name: 'Pro', price: 599, audience: 'для артистов', featured: true,
    perks: ['Всё из Artist', 'Безлимит загрузок, файл до 200 МБ', 'Приоритет в рекомендациях, значок Pro'],
  },
];
