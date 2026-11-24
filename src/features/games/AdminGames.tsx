import { useEffect, useState } from 'react';
import { gameName, loadGameAdmin, type AdminSnapshot } from './api';

const time = (date: string) => new Date(date).toLocaleString('ar-IQ');
const operationNames: Record<string, string> = { grant: 'رصيد افتتاحي', stake: 'خصم الجولة', reward: 'مكافأة الجولة' };
export function AdminGames() {
  const [state, setState] = useState<AdminSnapshot>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function refresh(code?: string, enabled?: boolean) {
    setPending(true);
    setError(false);
    try {
      setState(await loadGameAdmin(code, enabled));
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  return <section className="space-y-3">
    <button type="button" disabled={pending} className="rounded-lg bg-emerald-800 px-3 py-2 text-white"
      onClick={() => void refresh()}>تحديث بيانات الألعاب</button>
    {error ? <p role="alert" className="text-red-700">تعذر قراءة البيانات أو تأكيد الإجراء.</p>
      : state ? <p role="status">خادم الألعاب متصل.</p> : <p role="status">جارٍ التحقق من الخادم…</p>}
    {state && <>
      <dl className="flex flex-wrap gap-3 rounded-xl bg-emerald-50 p-3">
        <div><dt>المحافظ التجريبية</dt><dd>{state.wallets}</dd></div>
        <div><dt>مجموع الأرصدة التجريبية</dt><dd>{state.balance}</dd></div>
        <div><dt>عدد الجولات</dt><dd>{state.round_count}</dd></div>
      </dl>
      <ul className="space-y-2">{state.catalog.map(game =>
        <li key={game.code} className="flex justify-between rounded bg-white p-2">
          <span>{gameName(game.code)}</span>
          {game.implemented ? <button type="button" disabled={pending} className="underline"
            onClick={() => void refresh(game.code, !game.enabled)}>{game.enabled ? 'تعطيل' : 'تفعيل'}</button> : <span>قيد التجهيز</span>}
        </li>)}</ul>
      <details>
        <summary>قواعد باتشينكو والاحتمالات</summary>
        <p>احتمال كل اتجاه في كل صف ٥٠٪. الجدول يوضح المضاعفات لكل عدد صفوف ومستوى مخاطرة.</p>
        {Object.entries(state.catalog.find(game => game.code === 'plinko')?.rules.payouts ?? {}).map(([risk, rows]) =>
          <div key={risk} className="mb-3" dir="ltr">
            <strong>{risk}</strong>
            {Object.entries(rows as Record<string, number[]>).map(([row, values]) =>
              <p key={row} className="break-words text-xs">{row} · {values.join(' / ')}</p>)}
          </div>)}
      </details>
      <details><summary>سجل الجولات</summary>
        {!state.rounds.length && <p>لا توجد جولات بعد.</p>}
        {state.rounds.map(round => <p key={round.user_id + round.request_id}>{time(round.created_at)} · {round.public_id ?? '—'} · ×{round.multiplier} · {round.reward}</p>)}
      </details>
      <details><summary>سجل العمليات التجريبية</summary>
        {!state.ledger.length && <p>لا توجد عمليات بعد.</p>}
        {state.ledger.map(entry => <p key={entry.id}>{time(entry.created_at)} · {entry.public_id ?? '—'} · {operationNames[entry.kind]} · {entry.amount} · الرصيد {entry.balance_after}</p>)}
      </details>
      <details><summary>سجل إجراءات الإدارة</summary>
        {!state.audit.length && <p>لا توجد إجراءات بعد.</p>}
        {state.audit.map(entry => <p key={entry.id}>{time(entry.created_at)} · {entry.public_id ?? '—'} · {gameName(entry.game_code)} · {entry.enabled ? 'تفعيل' : 'تعطيل'}</p>)}
      </details>
    </>}
  </section>;
}
