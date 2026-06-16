import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const KEY = 'ns_cookie_consent';

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(KEY, new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[200] p-3 md:p-4">
      <div className="max-w-3xl mx-auto bg-[#121212] border border-[#262626] rounded-2xl shadow-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <Cookie size={26} className="text-violet-400 shrink-0 hidden sm:block" />
        <div className="flex-1 text-sm text-[#cfcfcf] leading-relaxed">
          Мы используем cookie для работы сайта, авторизации и рекомендаций. Продолжая пользоваться NextSound, вы соглашаетесь с{' '}
          <Link to="/privacy" className="text-white underline hover:text-violet-300">Политикой конфиденциальности</Link>. На сайте применяются{' '}
          <Link to="/recommendations" className="text-white underline hover:text-violet-300">рекомендательные технологии</Link>.
        </div>
        <button
          onClick={accept}
          className="shrink-0 px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:opacity-90 transition"
        >
          Принять
        </button>
      </div>
    </div>
  );
};
