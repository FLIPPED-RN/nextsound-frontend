import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export const RegisterPage = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', nickname: '', email: '', password: '' });
  const [error, setError] = useState('');
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/login');
    } catch {
      setError('Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 bg-[#151515] rounded-2xl space-y-4">
        <h2 className="text-2xl font-bold text-center">Регистрация</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input type="text" placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white outline-none" required />
        <input type="text" placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white outline-none" required />
        <input type="text" placeholder="Никнейм" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white outline-none" />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white outline-none" required />
        <input type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white outline-none" required />
        <button type="submit" className="w-full py-3 bg-white text-black rounded-full font-semibold">Зарегистрироваться</button>
        <p className="text-center text-sm text-[#888888]">
          Уже есть аккаунт? <Link to="/login" className="text-white underline">Войти</Link>
        </p>
      </form>
    </div>
  );
};