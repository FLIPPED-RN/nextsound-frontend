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
    tagline: 'Слушай как инсайдер',
    perks: [
      '🎧 Эксклюзивные плейлисты и авторские подборки, которых нет у других',
      '⬇️ Скачивание любимых треков в высоком качестве',
      '👑 Значок Plus у ника + достижение «Меценат»',
    ],
  },
  {
    id: 'artist', name: 'Artist', price: 399, audience: 'для артистов',
    tagline: 'Выкладывай без лимитов',
    perks: [
      '✅ Всё из Plus',
      '🚀 До 50 треков и файлы до 100 МБ — целые альбомы',
      '🎖 Значок Artist, выделяющий тебя среди новичков',
    ],
  },
  {
    id: 'pro', name: 'Pro', price: 599, audience: 'для артистов', featured: true,
    tagline: 'Максимум охвата и статуса',
    perks: [
      '✅ Всё из Artist',
      '♾️ Безлимитные загрузки, файлы до 200 МБ',
      '🔝 Приоритет в рекомендациях — тебя слышат первыми',
      '⭐ Золотой значок Pro — топ-уровень платформы',
    ],
  },
];
