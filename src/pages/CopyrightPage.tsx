import { useState } from 'react';
import toast from 'react-hot-toast';
import { LegalShell, H2, P } from '../components/LegalShell';
import { copyrightApi } from '../api/copyright.api';

export const CopyrightPage = () => {
  const [form, setForm] = useState({ claimantName: '', claimantEmail: '', claimantOrg: '', trackUrl: '', description: '' });
  const [statement, setStatement] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement) { toast.error('Подтвердите достоверность заявления'); return; }
    setSending(true);
    try {
      await copyrightApi.submit({ ...form, statement });
      setDone(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Не удалось отправить обращение');
    } finally {
      setSending(false);
    }
  };

  return (
    <LegalShell title="Правообладателям" updated="2026-07-02">
      <P>
        NextSound — площадка, где контент загружают пользователи. Мы уважаем интеллектуальные права и оперативно
        рассматриваем обоснованные обращения. Если вы считаете, что размещённый материал нарушает ваши авторские
        или смежные права, отправьте обращение через форму ниже.
      </P>

      <H2>Как это работает</H2>
      <P>
        1. Вы заполняете форму, указывая ссылку на материал и подтверждая наличие прав. 2. Мы рассматриваем обращение
        в разумный срок (как правило, до 3 рабочих дней). 3. При подтверждении нарушения материал удаляется, а к
        нарушителю могут применяться меры вплоть до блокировки аккаунта при повторных нарушениях.
      </P>
      <P>
        Направляя обращение, вы подтверждаете, что действуете добросовестно и являетесь правообладателем либо его
        уполномоченным представителем. Заведомо ложные заявления могут повлечь ответственность.
      </P>

      <H2>Форма обращения</H2>

      {done ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-5 text-emerald-200">
          Обращение принято. Мы свяжемся с вами по указанному e-mail. Спасибо, что помогаете держать платформу чистой.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3 max-w-xl">
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="ns-input" placeholder="Ваше имя / ФИО *" value={form.claimantName} onChange={set('claimantName')} required />
            <input className="ns-input" type="email" placeholder="E-mail для связи *" value={form.claimantEmail} onChange={set('claimantEmail')} required />
          </div>
          <input className="ns-input" placeholder="Организация / правообладатель (если есть)" value={form.claimantOrg} onChange={set('claimantOrg')} />
          <input className="ns-input" placeholder="Ссылка на материал (например, https://24nextsound.ru/track/123) *" value={form.trackUrl} onChange={set('trackUrl')} required />
          <textarea className="ns-input resize-none h-32" placeholder="Опишите нарушение: что за произведение, чем подтверждаются ваши права *" value={form.description} onChange={set('description')} required />

          <label className="flex items-start gap-2.5 text-xs text-[#9a9a9a] leading-relaxed cursor-pointer">
            <input type="checkbox" checked={statement} onChange={(e) => setStatement(e.target.checked)} className="mt-0.5 w-4 h-4 accent-violet-500 shrink-0" />
            <span>Я подтверждаю, что сведения достоверны, и я являюсь правообладателем или его уполномоченным представителем.</span>
          </label>

          <button type="submit" disabled={sending} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
            {sending ? 'Отправка…' : 'Отправить обращение'}
          </button>
        </form>
      )}
    </LegalShell>
  );
};
