import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Crown, Sparkles, LoaderCircle, Gift, Copy, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { paymentsApi } from '../api/payments.api';
import { PLANS, PLAN_LABELS, FREE_PERKS, effectivePlan } from '../lib/plans';

export const PremiumPage = () => {
  const { user, fetchMe } = useAuthStore();
  const current = effectivePlan(user);
  const [params, setParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftPlan, setGiftPlan] = useState('plus');
  const [giftTo, setGiftTo] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);

  const refLink = user ? `${window.location.origin}/register?ref=${user.id}` : '';

  useEffect(() => {
    if (params.get('paid') === '1') {
      toast.success('Оплата получена! Активируем подписку…', { duration: 5000 });
      let tries = 0;
      const tick = () => { fetchMe(); if (++tries < 5) setTimeout(tick, 2500); };
      tick();
      params.delete('paid');
      setParams(params, { replace: true });
    }
    if (params.get('gift') === '1') {
      toast.success('Спасибо! Подарок отправлен 🎁 Подписка получателя активируется автоматически.', { duration: 6000 });
      params.delete('gift');
      setParams(params, { replace: true });
    }
  }, []);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      toast.success('Ссылка скопирована!');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const sendGift = async () => {
    if (!giftTo.trim()) { toast.error('Укажите e-mail или ник получателя'); return; }
    setGiftLoading(true);
    try {
      const { data } = await paymentsApi.createGift(giftPlan, giftTo.trim());
      if (data.url) window.location.href = data.url;
      else toast.error('Не удалось получить ссылку на оплату');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Не удалось оформить подарок');
    } finally {
      setGiftLoading(false);
    }
  };

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

      <div className="mb-6 rounded-3xl border border-[#242424] bg-[#0c0c0c] p-5 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Free</h3>
            <span className="text-xs text-[#777]">— навсегда бесплатно</span>
          </div>
          {current === 'free'
            ? <span className="text-xs font-semibold bg-white/10 text-white px-3 py-1 rounded-full">Ваш тариф</span>
            : <span className="text-2xl font-extrabold">0 ₽</span>}
        </div>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {FREE_PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm text-[#cfcfcf]">
              <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" /> {perk}
            </li>
          ))}
        </ul>
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

      {user && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-3xl p-6 border border-emerald-500/25 bg-emerald-500/[0.06]">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <Users size={18} /> Приглашай друзей
            </div>
            <p className="text-sm text-[#bcbcbc] mt-2">
              За каждого друга, который зарегистрируется по твоей ссылке, <b className="text-white">вы оба получаете +7 дней Plus</b>. Без ограничений по количеству.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                readOnly
                value={refLink}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 bg-black/40 border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-[#cfcfcf]"
              />
              <button
                onClick={copyRef}
                className="shrink-0 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-4 py-2.5 rounded-xl transition"
              >
                <Copy size={15} /> Копировать
              </button>
            </div>
          </div>

          <div className="rounded-3xl p-6 border border-pink-500/25 bg-pink-500/[0.06] flex flex-col">
            <div className="flex items-center gap-2 text-pink-300 font-semibold">
              <Gift size={18} /> Подарить подписку
            </div>
            <p className="text-sm text-[#bcbcbc] mt-2 flex-1">
              Оформи подписку на любой тариф для друга — ему придёт уведомление, а доступ активируется автоматически на 30 дней.
            </p>
            <button
              onClick={() => setGiftOpen(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-semibold text-sm py-3 rounded-xl transition"
            >
              <Gift size={16} /> Подарить
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-[#777]">
        Бесплатный тариф: прослушивание, плейлисты, лайки, комментарии, подписки и загрузка до 5 треков (до 30 МБ).
      </div>

      {giftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setGiftOpen(false)}>
          <div className="w-full max-w-md bg-[#0e0e0e] border border-[#242424] rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Gift size={18} className="text-pink-400" /> Подарить подписку</h3>
              <button onClick={() => setGiftOpen(false)} className="text-[#777] hover:text-white transition"><X size={20} /></button>
            </div>

            <label className="block text-xs text-[#888] mb-1.5">Кому (e-mail или ник получателя)</label>
            <input
              value={giftTo}
              onChange={(e) => setGiftTo(e.target.value)}
              placeholder="friend@mail.ru или nickname"
              className="w-full bg-black/40 border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white mb-4 outline-none focus:border-pink-500/50"
            />

            <label className="block text-xs text-[#888] mb-1.5">Тариф</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setGiftPlan(p.id)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition ${giftPlan === p.id ? 'border-pink-500 bg-pink-500/10' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'}`}
                >
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-[#999]">{p.price} ₽</div>
                </button>
              ))}
            </div>

            <button
              onClick={sendGift}
              disabled={giftLoading}
              className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
            >
              {giftLoading ? <LoaderCircle size={16} className="animate-spin" /> : <>Оплатить и подарить · {PLANS.find((p) => p.id === giftPlan)?.price} ₽</>}
            </button>
            <p className="text-[11px] text-[#666] text-center mt-3">Оплата через ЮKassa. Подписка получателя активируется на 30 дней после оплаты.</p>
          </div>
        </div>
      )}
    </div>
  );
};
