import { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LoaderCircle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { AuthInput } from './AuthShell';

export const ForgotPasswordForm = ({
  initialEmail = '',
  onBack,
  onDone,
}: {
  initialEmail?: string;
  onBack: () => void;
  onDone: (email: string) => void;
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (silent = false) => {
    if (!email.trim()) { setError('Введите email'); return; }
    if (cooldown > 0) return;
    setLoading(true); setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setStep(2);
      setCooldown(60);
      if (!silent) toast.success('Если аккаунт существует — код отправлен на почту');
    } catch {
      setError('Не удалось отправить код, попробуйте позже');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Введите 6 цифр из письма'); return; }
    if (password.length < 6) { setError('Пароль должен быть не короче 6 символов'); return; }
    setLoading(true); setError('');
    try {
      await authApi.resetPassword(email.trim(), code, password);
      toast.success('Пароль изменён! Войдите с новым паролем');
      onDone(email.trim());
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  const errorBox = error && (
    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</div>
  );

  return (
    <>
      <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center mb-4">
        <KeyRound size={24} />
      </div>
      <h1 className="text-3xl font-bold">Восстановление пароля</h1>
      <p className="text-sm text-[#888] mt-2">
        {step === 1
          ? 'Укажите email — пришлём код для смены пароля'
          : <>Введите код из письма на <span className="text-white">{email}</span> и новый пароль</>}
      </p>

      {step === 1 ? (
        <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="space-y-4 mt-8">
          {errorBox}
          <AuthInput icon={<Mail size={18} />} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <>Отправить код <ArrowRight size={18} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={submitReset} className="space-y-4 mt-8">
          {errorBox}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoFocus
            placeholder="Код из письма"
            className="w-full text-center text-2xl tracking-[0.4em] font-bold py-3.5 bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl outline-none transition focus:border-violet-500/60 placeholder:text-[#333] placeholder:text-base placeholder:tracking-normal"
          />
          <AuthInput
            icon={<Lock size={18} />}
            type={show ? 'text' : 'password'}
            placeholder="Новый пароль (мин. 6 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            rightSlot={
              <button type="button" onClick={() => setShow((s) => !s)} className="text-[#666] hover:text-white transition p-1">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <>Сменить пароль <ArrowRight size={18} /></>}
          </button>
          <div className="text-right">
            <button
              type="button"
              onClick={() => sendCode(false)}
              disabled={cooldown > 0}
              className="text-sm text-[#888] hover:text-white transition disabled:opacity-50"
            >
              {cooldown > 0 ? `Отправить ещё раз (${cooldown})` : 'Отправить код ещё раз'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-sm">
        <button onClick={onBack} className="text-[#888] hover:text-white transition">← Назад ко входу</button>
      </div>
    </>
  );
};
