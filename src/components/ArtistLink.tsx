import { useNavigate } from 'react-router-dom';
import type { User } from '@/types';

interface Props {
  /** объект артиста (для имени и, если есть, id) */
  user?: Partial<User> | null;
  /** явный id артиста — приоритетнее user.id (напр. track.userId) */
  id?: number | null;
  className?: string;
  /** доп. действие при переходе (напр. закрыть развёрнутый плеер) */
  onNavigate?: () => void;
  fallback?: string;
}

/**
 * Кликабельное имя артиста → переход в его профиль.
 * Рендерится как <span> (не <a>), чтобы безопасно жить внутри кликабельных
 * карточек и кнопок; переход делаем программно, всплытие клика гасим.
 */
export const ArtistLink = ({ user, id, className = '', onNavigate, fallback = 'Артист' }: Props) => {
  const navigate = useNavigate();
  const artistId = id ?? user?.id ?? null;
  const name = user?.nickname || user?.firstName || fallback;

  if (!artistId) return <span className={className}>{name}</span>;

  const go = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onNavigate?.();
    navigate(`/artist/${artistId}`);
  };

  return (
    <span
      role="link"
      title={name}
      onClick={go}
      className={`cursor-pointer hover:underline hover:text-white transition ${className}`}
    >
      {name}
    </span>
  );
};
