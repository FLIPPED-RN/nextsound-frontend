import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, AtSign, ArrowRight, LoaderCircle, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { AuthShell, AuthInput } from '../components/AuthShell';
import { VerifyForm } from '../components/VerifyForm';

export const RegisterPage = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', nickname: '', email: '', password: '' });
  const [consents, setConsents] = useState({ legal: false, marketing: false });
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') || '';

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Пароль должен быть не короче 6 символов'); return; }
    if (form.password !== confirm) { setError('Пароли не совпадают'); return; }
    if (!consents.legal) { toast.error('Примите Политику конфиденциальности и Пользовательское соглашение'); return; }
    setLoading(true);
    try {
      const res = await register({
        ...form,
        consentPrivacy: true,
        consentTerms: true,
        consentMarketing: consents.marketing,
        ...(ref ? { ref } : {}),
      });
      if (res.needVerification) {
        setPendingEmail(res.email || form.email);
      } else {
        await login(form.email, form.password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Не удалось зарегистрироваться. Возможно, email уже занят');
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <AuthShell>
        <VerifyForm email={pendingEmail} onBack={() => setPendingEmail(null)} />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold">Создать аккаунт</h1>
      <p className="text-sm text-[#888] mt-2">Присоединяйтесь к сообществу NextSound</p>

      {ref && (
        <div className="mt-4 flex items-center gap-2.5 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <Gift size={18} className="shrink-0" />
          <span>Вы пришли по приглашению — после подтверждения почты вы и пригласивший получите <b>+7 дней Plus</b> 🎁</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mt-8">
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <AuthInput icon={<User size={18} />} placeholder="Имя" value={form.firstName} onChange={set('firstName')} required />
          <AuthInput icon={<User size={18} />} placeholder="Фамилия" value={form.lastName} onChange={set('lastName')} required />
        </div>
        <AuthInput icon={<AtSign size={18} />} placeholder="Никнейм" value={form.nickname} onChange={set('nickname')} required />
        <AuthInput icon={<Mail size={18} />} type="email" placeholder="Email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <AuthInput
          icon={<Lock size={18} />}
          type={show ? 'text' : 'password'}
          placeholder="Пароль (мин. 6 символов)"
          value={form.password}
          onChange={set('password')}
          required
          autoComplete="new-password"
          rightSlot={
            <button type="button" onClick={() => setShow((s) => !s)} className="text-[#666] hover:text-white transition p-1">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <AuthInput
          icon={<Lock size={18} />}
          type={show ? 'text' : 'password'}
          placeholder="Повторите пароль"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />

        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-2.5 text-xs text-[#9a9a9a] leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={consents.legal}
              onChange={(e) => setConsents({ ...consents, legal: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-violet-500 shrink-0"
            />
            <span>
              Я даю согласие на обработку персональных данных, ознакомлен(а) и принимаю{' '}
              <Link to="/privacy" target="_blank" className="text-white hover:underline">Политику конфиденциальности</Link>{' '}и{' '}
              <Link to="/terms" target="_blank" className="text-white hover:underline">Пользовательское соглашение</Link>.
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-xs text-[#9a9a9a] leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={consents.marketing}
              onChange={(e) => setConsents({ ...consents, marketing: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-violet-500 shrink-0"
            />
            <span>Я согласен(на) получать информационные и рекламные сообщения о сервисе (необязательно).</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !consents.legal}
          className="w-full py-3 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={18} className="animate-spin" /> : <>Создать аккаунт <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="text-center text-sm text-[#888] mt-6">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-white font-medium hover:underline">Войти</Link>
      </p>
    </AuthShell>
  );
};
