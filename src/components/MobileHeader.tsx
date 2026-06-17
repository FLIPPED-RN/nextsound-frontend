import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { resolveAssetUrl } from '../lib/utils';
import { NotificationBell } from './NotificationBell';

export const MobileHeader = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#0b0b0b] border-b border-[#1a1a1a]">
      <button onClick={() => navigate('/')} className="flex items-center gap-2">
        <img src="/NextSoundLogo.png" alt="" className="w-8 h-8" />
        <span className="text-lg font-bold">NextSound</span>
      </button>

      {user ? (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/premium')} aria-label="Premium" className="w-9 h-9 rounded-full flex items-center justify-center text-violet-300 hover:bg-white/10 transition">
            <Crown size={20} />
          </button>
          <NotificationBell />
          <button onClick={() => navigate(`/artist/${user.id}`)} aria-label="Профиль">
            {user.avatar ? (
              <img src={resolveAssetUrl(user.avatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                {(user.nickname || user.firstName || '?')[0]?.toUpperCase()}
              </div>
            )}
          </button>
        </div>
      ) : (
        <button onClick={() => navigate('/login')} className="text-sm font-medium px-3 py-1.5 rounded-full bg-white text-black">
          Войти
        </button>
      )}
    </header>
  );
};
