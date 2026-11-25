import { useEffect, useRef, useState } from 'react';
import { agentRpc, num, timestamp, type Decision, type Result } from './api';

export function SupplyReview() {
  const [rows, setRows] = useState<Decision[]>();
  const [selected, setSelected] = useState<Decision>();
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  async function load() {
    try { setRows(await agentRpc<Decision[]>('admin_list')); }
    catch { setMessage('تعذر تحميل طلبات التزويد.'); }
  }

  useEffect(() => { void load(); }, []);

  async function decide(approve: boolean) {
    if (!selected || lock.current || note.trim().length < 10) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await agentRpc<Result>(approve ? 'approve_supply' : 'reject_supply', { id: selected.id, note: note.trim() });
      setSelected(undefined);
      setNote('');
      setMessage(result.status === 'completed' ? 'تم تزويد الوكيل من الخزينة.' : 'الطلب مرفوض.');
      await load();
    } catch (cause) {
      const code = (cause as Error).message;
      setMessage(code === 'Insufficient Owner treasury' ? 'رصيد خزينة المالك غير كافٍ.'
        : code === 'AGENT_NOT_APPROVED' ? 'اعتماد الوكيل موقوف.' : 'تعذر تأكيد القرار. يمكنك إعادة المحاولة على نفس الطلب.');
    } finally { lock.current = false; setBusy(false); }
  }

  return <section dir="rtl" className="space-y-2 rounded-xl border p-3">
    <h3 className="font-bold">طلبات تزويد وكلاء الشحن</h3>
    <button type="button" className="underline" disabled={busy} onClick={() => void load()}>تحديث الطلبات</button>
    {rows?.length === 0 && <p>لا توجد طلبات معلّقة.</p>}
    {rows?.map(row => <button type="button" key={row.id} className="block w-full rounded-lg border p-2 text-start" disabled={busy}
      onClick={() => { setSelected(row); setNote(''); setMessage(''); }}>
      {row.agency_name} · {num(row.coins)} عملة <small>{timestamp(row.created_at)}</small>
    </button>)}
    {selected && <div className="space-y-2 rounded-lg bg-emerald-50 p-2">
      <p>قرار تزويد {selected.agency_name} بمبلغ {num(selected.coins)} عملة</p>
      <label className="block">سبب القرار
        <input className="block w-full rounded border bg-white p-2" value={note} maxLength={500} disabled={busy}
          onChange={event => setNote(event.target.value)} placeholder="10 أحرف على الأقل" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="font-bold text-emerald-800 disabled:opacity-50" disabled={busy || note.trim().length < 10}
          onClick={() => void decide(true)}>موافقة وتزويد</button>
        <button type="button" className="font-bold text-red-800 disabled:opacity-50" disabled={busy || note.trim().length < 10}
          onClick={() => void decide(false)}>رفض</button>
        <button type="button" disabled={busy} onClick={() => setSelected(undefined)}>إلغاء</button>
      </div>
    </div>}
    {message && <p role="status">{message}</p>}
  </section>;
}
