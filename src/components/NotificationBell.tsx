import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, UserPlus, Repeat2, MessageCircle, Heart, CornerDownRight } from 'lucide-react';
import { notificationsApi } from '../api/notifications.api';
import type { AppNotification } from '../api/notifications.api';
import { useAuthStore } from '../store/auth.store';
import { resolveAssetUrl, timeAgo } from '../lib/utils';

const ICON: Record<string, React.ReactNode> = {
  follow: <UserPlus size={13} className="text-violet-400" />,
  repost: <Repeat2 size={13} className="text-green-400" />,
  comment: <MessageCircle size={13} className="text-blue-400" />,
  reply: <CornerDownRight size={13} className="text-blue-400" />,
  comment_like: <Heart size={13} className="text-red-400" />,
  track_like: <Heart size={13} className="text-red-400" />,
};

const text = (n: AppNotification) => {
  const name = n.actor?.nickname || n.actor?.firstName || 'Кто-то';
  const t = n.trackTitle ? `«${n.trackTitle}»` : 'ваш трек';
  switch (n.type) {
    case 'follow': return `${name} подписался на вас`;
    case 'repost': return `${name} сделал репост ${t}`;
    case 'comment': return `${name} прокомментировал ${t}`;
    case 'reply': return `${name} ответил на ваш комментарий`;
    case 'comment_like': return `${name} оценил ваш комментарий`;
    case 'track_like': return `${name} лайкнул ${t}`;
    default: return name;
  }
};

export const NotificationBell = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unread } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const { data: list } = useQuery({
    queryKey: ['notif-list'],
    queryFn: () => notificationsApi.list().then((r) => r.data),
    enabled: !!user && open,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;
  const count = unread?.count || 0;

  const openMenu = async () => {
    const next = !open;
    setOpen(next);
    if (next && count > 0) {
      try { await notificationsApi.markRead(); qc.invalidateQueries({ queryKey: ['notif-unread'] }); } catch { }
    }
  };

  const go = (n: AppNotification) => {
    setOpen(false);
    if (n.trackId) navigate(`/track/${n.trackId}`);
    else navigate(`/artist/${n.actorId}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={openMenu} className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition" aria-label="Уведомления">
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[88vw] max-h-[70vh] overflow-y-auto rounded-2xl bg-[#111] border border-[#242424] shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-[#1f1f1f] text-sm font-semibold">Уведомления</div>
          {!list?.length ? (
            <p className="px-4 py-8 text-sm text-[#666] text-center">Пока нет уведомлений</p>
          ) : (
            <div>
              {list.map((n) => (
                <button key={n.id} onClick={() => go(n)} className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition ${!n.isRead ? 'bg-violet-500/5' : ''}`}>
                  <div className="relative shrink-0">
                    {n.actor?.avatar
                      ? <img src={resolveAssetUrl(n.actor.avatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold">{(n.actor?.nickname || n.actor?.firstName || '?')[0]?.toUpperCase()}</div>}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#111] flex items-center justify-center">{ICON[n.type]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{text(n)}</p>
                    <p className="text-xs text-[#666] mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {n.trackCover && <img src={resolveAssetUrl(n.trackCover)} alt="" className="w-9 h-9 rounded object-cover shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
