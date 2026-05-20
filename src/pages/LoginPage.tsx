// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Неверный пароль');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 bg-[#151515] rounded-2xl space-y-5">
        <h2 className="text-2xl font-bold text-center">Вход</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white outline-none"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white outline-none"
          required
        />
        <button type="submit" className="w-full py-3 bg-white text-black rounded-full font-semibold">
          Войти
        </button>
        <p className="text-center text-sm text-[#888888]">
          Еще не зарегистрированны?{' '}
          <Link to="/register" className="text-white underline">Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  );
};