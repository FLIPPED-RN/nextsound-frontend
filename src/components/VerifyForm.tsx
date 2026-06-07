import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LoaderCircle, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

export const VerifyForm = ({ email, autoSend, onBack }: { email: string; autoSend?: boolean; onBack?: () => void }) => {
  const { verify, resend } = useAuthStore();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const doResend = async (silent = false) => {
    if (cooldown > 0) return;
    try {
      await resend(email);
      setCooldown(60);
      if (!silent) toast.success('Код отправлен повторно');
    } catch {
      if (!silent) toast.error('Не удалось отправить код');
    }
  };

  useEffect(() => {
    if (autoSend) doResend(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Введите 6 цифр из письма'); return; }
    setLoading(true);
    setError('');
    try {
      await verify(email, code);
      toast.success('Почта подтверждена!');
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center mb-4">
        <MailCheck size={24} />
      </div>
      <h1 className="text-3xl font-bold">Подтвердите почту</h1>
      <p className="text-sm text-[#888] mt-2">
        Мы отправили 6-значный код на <span className="text-white">{email}</span>
      </p>

      <form onSubmit={submit} className="space-y-4 mt-8">
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</div>
        )}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoFocus
          placeholder="••••••"
          className="w-full text-center text-3xl tracking-[0.5em] font-bold py-4 bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl outline-none transition focus:border-violet-500/60 placeholder:text-[#333]"
        />
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-3 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? <LoaderCircle size={18} className="animate-spin" /> : <>Подтвердить <ArrowRight size={18} /></>}
        </button>
      </form>

      <div className="flex items-center justify-between mt-6 text-sm">
        {onBack ? (
          <button onClick={onBack} className="text-[#888] hover:text-white transition">← Назад</button>
        ) : <span />}
        <button
          onClick={() => doResend(false)}
          disabled={cooldown > 0}
          className="text-[#888] hover:text-white transition disabled:opacity-50"
        >
          {cooldown > 0 ? `Отправить ещё раз (${cooldown})` : 'Отправить код ещё раз'}
        </button>
      </div>
    </>
  );
};
