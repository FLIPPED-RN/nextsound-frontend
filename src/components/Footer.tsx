import { Link } from 'react-router-dom';

const links = [
  { to: '/privacy', label: 'Политика конфиденциальности' },
  { to: '/terms', label: 'Пользовательское соглашение' },
  { to: '/offer', label: 'Публичная оферта' },
  { to: '/recommendations', label: 'Рекомендательные технологии' },
];

export const Footer = () => (
  <footer className="mt-12 border-t border-[#1a1a1a] px-4 md:px-8 py-6">
    <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-xs text-[#777]">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="hover:text-white transition">{l.label}</Link>
      ))}
    </div>
    <p className="text-center text-xs text-[#555] mt-3">
      © {new Date().getFullYear()} NextSound · Назаров Р.Н. · ИНН 391506814428
    </p>
  </footer>
);
