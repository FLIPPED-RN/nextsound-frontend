import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { resolveAssetUrl } from '../lib/utils';

export const MobileHeader = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-black/80 backdrop-blur border-b border-[#1a1a1a]">
      <button onClick={() => navigate('/')} className="flex items-center gap-2">
        <img src="/NextSoundLogo.png" alt="" className="w-8 h-8" />
        <span className="text-lg font-bold">NextSound</span>
      </button>

      {user ? (
        <button onClick={() => navigate(`/artist/${user.id}`)} aria-label="Профиль">
          {user.avatar ? (
            <img src={resolveAssetUrl(user.avatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-bold">
              {(user.nickname || user.firstName || '?')[0]?.toUpperCase()}
            </div>
          )}
        </button>
      ) : (
        <button onClick={() => navigate('/login')} className="text-sm font-medium px-3 py-1.5 rounded-full bg-white text-black">
          Войти
        </button>
      )}
    </header>
  );
};
