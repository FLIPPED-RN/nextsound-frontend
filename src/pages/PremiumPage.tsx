import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Crown, Sparkles, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { paymentsApi } from '../api/payments.api';
import { PLANS, PLAN_LABELS, effectivePlan } from '../lib/plans';

export const PremiumPage = () => {
  const { user, fetchMe } = useAuthStore();
  const current = effectivePlan(user);
  const [params, setParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('paid') === '1') {
      toast.success('Оплата получена! Активируем подписку…', { duration: 5000 });
      let tries = 0;
      const tick = () => { fetchMe(); if (++tries < 5) setTimeout(tick, 2500); };
      tick();
      params.delete('paid');
      setParams(params, { replace: true });
    }
  }, []);

  const subscribe = async (planId: string) => {
    if (current === planId) { toast('Это ваш текущий тариф'); return; }
    if (!user) { toast.error('Войдите, чтобы оформить подписку'); return; }
    setLoadingPlan(planId);
    try {
      const { data } = await paymentsApi.createPayment(planId);
      if (data.url) window.location.href = data.url;
      else toast.error('Не удалось получить ссылку на оплату');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Не удалось перейти к оплате');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs tracking-widest text-violet-300 uppercase mb-3">
          <Sparkles size={14} /> NextSound Premium
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Больше музыки. Больше возможностей.</h1>
        <p className="text-[#9a9a9a] mt-3">Базовые функции всегда бесплатны. Подписка открывает эксклюзив и снимает лимиты.</p>
        {current !== 'free' && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm bg-violet-500/15 text-violet-200 px-4 py-1.5 rounded-full">
            <Crown size={14} /> Ваш тариф: {PLAN_LABELS[current]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((p) => {
          const isCurrent = current === p.id;
          return (
            <div
              key={p.id}
              className={`relative rounded-3xl p-6 flex flex-col border transition ${p.featured ? 'border-violet-500 bg-violet-500/5' : 'border-[#242424] bg-[#0e0e0e]'}`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-violet-500 text-white px-3 py-1 rounded-full">Популярный</span>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-xs text-[#777] mt-0.5">{p.audience}</p>
              {(p as any).tagline && <p className="text-sm text-violet-300 font-medium mt-1.5">{(p as any).tagline}</p>}
              <div className="mt-4 mb-5">
                <span className="text-4xl font-extrabold">{p.price} ₽</span>
                <span className="text-sm text-[#777]"> / мес</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-[#cfcfcf]">
                    <Check size={16} className="text-violet-400 shrink-0 mt-0.5" /> {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(p.id)}
                disabled={isCurrent || loadingPlan === p.id}
                className={`w-full py-3 rounded-full text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 ${p.featured ? 'bg-violet-500 hover:bg-violet-400 text-white' : 'bg-white text-black hover:opacity-90'}`}
              >
                {loadingPlan === p.id ? <LoaderCircle size={16} className="animate-spin" /> : isCurrent ? 'Ваш тариф' : 'Оформить'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-[#777]">
        Бесплатный тариф: прослушивание, плейлисты, лайки, комментарии, подписки и загрузка до 5 треков (до 30 МБ).
      </div>
    </div>
  );
};
