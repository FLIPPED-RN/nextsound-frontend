// src/components/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Upload, ListMusic, Heart } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const links = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/search', icon: Search, label: 'Поиск' },
  { to: '/upload', icon: Upload, label: 'Загрузить' },
  { to: '/playlists', icon: ListMusic, label: 'Плейлисты' },
  { to: '/liked', icon: Heart, label: 'Любимое' },
];

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-[#111111] border-r border-[#242424] px-4 py-5">
      <div className='flex items-center mb-10'>
        <img src="/NextSoundLogo.png" alt="" className='w-12 h-12' />
        <h1 className="text-2xl font-bold px-2">NextSound</h1>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isActive ? 'bg-white text-black font-semibold' : 'text-[#888888] hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Card */}
      {user && (
        <div className="mt-auto pt-4 border-t border-[#242424]">
          <button
            onClick={() => navigate(`/artist/${user.id}`)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#242424] transition w-full"
          >
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
              {user.firstName[0]}
            </div>
            <span className="text-sm truncate">{user.nickname || user.firstName}</span>
          </button>
          <button
            onClick={logout}
            className="mt-2 text-xs text-[#888888] hover:text-white px-3 transition"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
};