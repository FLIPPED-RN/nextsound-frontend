import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import logo from '/NextSoundLogo.png';

export const LegalShell = ({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) => (
  <div className="h-screen overflow-y-auto bg-[#050505] text-white">
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#888] hover:text-white transition">
          <ChevronLeft size={16} /> На главную
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="NextSound" className="w-7 h-7" />
          <span className="font-bold">NextSound</span>
        </Link>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
      {updated && <p className="text-sm text-[#666] mt-2">Редакция от {updated}</p>}

      <div className="mt-8 space-y-1 pb-20">{children}</div>

      <div className="mt-12 pt-6 border-t border-[#1a1a1a] flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#888]">
        <Link to="/privacy" className="hover:text-white transition">Политика конфиденциальности</Link>
        <Link to="/terms" className="hover:text-white transition">Пользовательское соглашение</Link>
        <Link to="/offer" className="hover:text-white transition">Публичная оферта</Link>
        <Link to="/payment" className="hover:text-white transition">Оплата и возврат</Link>
        <Link to="/recommendations" className="hover:text-white transition">Рекомендательные технологии</Link>
      </div>
    </div>
  </div>
);

export const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-bold mt-8 mb-3">{children}</h2>
);

export const P = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[15px] leading-relaxed text-[#cfcfcf] mb-3 ${className || ''}`}>{children}</p>
);

export const UL = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed text-[#cfcfcf] mb-3">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);
