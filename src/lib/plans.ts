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

// Что входит в бесплатный тариф — он остаётся щедрым
export const FREE_PERKS = [
  '🎧 Безлимитное прослушивание, лайки, комментарии, репосты',
  '📁 Свои плейлисты без ограничений',
  '⬇️ Скачивание отдельных треков',
  '⬆️ Загрузка до 5 треков (файлы до 30 МБ)',
  '🏆 Достижения, уровни, стрики и базовая статистика',
  '🎁 Реферальная программа: +7 дней Plus за друга',
];

export const PLANS = [
  {
    id: 'plus', name: 'Plus', price: 199, audience: 'для слушателей',
    tagline: 'Слушай как инсайдер',
    perks: [
      '✅ Всё из Free',
      '🎧 Эксклюзивные плейлисты и авторские подборки',
      '📊 Расширенная статистика: график за 30 дней и «кто тебя слушает»',
      '⚡ ×2 опыта (XP) и заморозка стрика',
      '📦 Скачивание целого альбома одним архивом',
      '🎨 Кастомный цвет профиля + значок Plus и достижение «Меценат»',
    ],
  },
  {
    id: 'artist', name: 'Artist', price: 399, audience: 'для артистов',
    tagline: 'Выкладывай без лимитов',
    perks: [
      '✅ Всё из Plus',
      '🚀 До 50 треков и файлы до 100 МБ — целые альбомы',
      '🔼 Продвижение релизов в ленте «Новое»',
      '🎖 Значок Artist, выделяющий тебя среди новичков',
    ],
  },
  {
    id: 'pro', name: 'Pro', price: 599, audience: 'для артистов', featured: true,
    tagline: 'Максимум охвата и статуса',
    perks: [
      '✅ Всё из Artist',
      '♾️ Безлимитные загрузки, файлы до 200 МБ',
      '🔝 Максимальный буст релизов в рекомендациях',
      '⭐ Золотой значок Pro — топ-уровень платформы',
    ],
  },
];
