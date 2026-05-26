import { NavLink } from 'react-router-dom';
import { Home, Search, Upload, ListMusic, Heart } from 'lucide-react';

const links = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/search', icon: Search, label: 'Поиск' },
  { to: '/upload', icon: Upload, label: 'Загрузить' },
  { to: '/playlists', icon: ListMusic, label: 'Плейлисты' },
  { to: '/liked', icon: Heart, label: 'Любимое' },
];

export const MobileNavbar = () => (
  <div className="flex items-center justify-around h-full">
    {links.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] transition ${
            isActive ? 'text-white' : 'text-[#888888]'
          }`
        }
      >
        <Icon size={20} />
        {label}
      </NavLink>
    ))}
  </div>
);