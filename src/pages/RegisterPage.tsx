import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, AtSign, ArrowRight, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { AuthShell, AuthInput } from '../components/AuthShell';

export const RegisterPage = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', nickname: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Пароль должен быть не короче 6 символов'); return; }
    setLoading(true);
    try {
      await register(form);
      // auto-login after successful signup
      try {
        await login(form.email, form.password);
        toast.success('Добро пожаловать в NextSound!');
        navigate('/');
      } catch {
        navigate('/login');
      }
    } catch {
      setError('Не удалось зарегистрироваться. Возможно, email уже занят');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold">Создать аккаунт</h1>
      <p className="text-sm text-[#888] mt-2">Присоединяйтесь к сообществу NextSound</p>

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

        <button
          type="submit"
          disabled={loading}
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
