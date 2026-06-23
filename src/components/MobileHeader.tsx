import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, BarChart3, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { resolveAssetUrl } from '../lib/utils';
import { NotificationBell } from './NotificationBell';

export const MobileHeader = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (to: string) => { setOpen(false); navigate(to); };

  const Avatar = () =>
    user?.avatar ? (
      <img src={resolveAssetUrl(user.avatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
    ) : (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-bold">
        {(user?.nickname || user?.firstName || '?')[0]?.toUpperCase()}
      </div>
    );

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#0b0b0b]/95 backdrop-blur border-b border-[#1a1a1a]">
      <button onClick={() => navigate('/')} className="flex items-center gap-2">
        <img src="/NextSoundLogo.png" alt="" className="w-8 h-8" />
        <span className="text-lg font-bold">NextSound</span>
      </button>

      {user ? (
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <div className="relative" ref={ref}>
            <button onClick={() => setOpen((o) => !o)} aria-label="Меню профиля" className="block rounded-full ring-2 ring-transparent active:ring-white/20 transition">
              <Avatar />
            </button>

            {open && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-[#141414] border border-[#262626] shadow-2xl overflow-hidden z-50">
                <button onClick={() => go(`/artist/${user.id}`)} className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#1f1f1f] hover:bg-white/5 transition">
                  <Avatar />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold truncate">{user.nickname || user.firstName}</p>
                    <p className="text-xs text-[#777]">Мой профиль</p>
                  </div>
                </button>
                <button onClick={() => go('/stats')} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition">
                  <BarChart3 size={17} className="text-violet-400" /> Статистика
                </button>
                <button onClick={() => go('/premium')} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition">
                  <Crown size={17} className="text-amber-400" /> Premium
                </button>
                {user.role === 'admin' && (
                  <button onClick={() => go('/admin')} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition">
                    <ShieldCheck size={17} className="text-emerald-400" /> Админка
                  </button>
                )}
                <button onClick={() => { setOpen(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 border-t border-[#1f1f1f] hover:bg-red-500/10 transition">
                  <LogOut size={17} /> Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/premium')} aria-label="Premium" className="w-9 h-9 rounded-full flex items-center justify-center text-amber-300 hover:bg-white/10 transition">
            <Crown size={19} />
          </button>
          <button onClick={() => navigate('/login')} className="text-sm font-medium px-3 py-1.5 rounded-full bg-white text-black">
            Войти
          </button>
        </div>
      )}
    </header>
  );
};
