import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { AuthShell, AuthInput } from '../components/AuthShell';
import { VerifyForm } from '../components/VerifyForm';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 403 && data?.needVerification) {
        setPendingEmail(data.email || email);
      } else {
        setError('Неверный email или пароль');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <AuthShell>
        <VerifyForm email={pendingEmail} autoSend onBack={() => setPendingEmail(null)} />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold">С возвращением</h1>
      <p className="text-sm text-[#888] mt-2">Войдите, чтобы продолжить слушать</p>

      <form onSubmit={handleSubmit} className="space-y-4 mt-8">
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</div>
        )}
        <AuthInput icon={<Mail size={18} />} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <AuthInput
          icon={<Lock size={18} />}
          type={show ? 'text' : 'password'}
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          rightSlot={
            <button type="button" onClick={() => setShow((s) => !s)} className="text-[#666] hover:text-white transition p-1">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={18} className="animate-spin" /> : <>Войти <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="text-center text-sm text-[#888] mt-6">
        Ещё нет аккаунта?{' '}
        <Link to="/register" className="text-white font-medium hover:underline">Зарегистрироваться</Link>
      </p>
    </AuthShell>
  );
};
