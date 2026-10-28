import React, { useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';
type Row = Record<string, unknown>;
type Recharge = { treasury: number; issued: number | null; agencies: Row[]; requests: Row[]; ledger: Row[]; isOwner: boolean };
export const AdminRechargePanel: React.FC = () => {
  const [state, setState] = useState<Recharge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [coins, setCoins] = useState('');
  const [note, setNote] = useState('');
  const [topupResult, setTopupResult] = useState('');
  const [topupBusy, setTopupBusy] = useState(false);
  const refresh = async () => {
    setBusy(true); setError('');
    try {
      if (!stagingBackend) throw new Error('الخادم غير متصل');
      const { data, error: rpcError } = await stagingBackend.rpc('phase4_recharge_state');
      if (rpcError) throw rpcError;
      setState(data as Recharge);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const topupById = async () => {
    const id = Number(recipientId.trim());
    const amount = Number(coins.trim());
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000 || note.trim().length < 10) {
      setError('أدخل ID صحيحاً وكمية من 1 إلى مليار وسبباً لا يقل عن 10 أحرف.'); return;
    }
    if (!window.confirm(`تأكيد تحويل ${amount.toLocaleString()} عملة من الخزينة إلى حساب ID ${id}؟ لا يمكن التراجع عن العملية.`)) return;
    setTopupBusy(true); setError(''); setTopupResult('');
    const requestId = crypto.randomUUID();
    try {
      if (!stagingBackend) throw new Error('الخادم غير متصل');
      const { data, error: rpcError } = await stagingBackend.rpc('phase4_owner_topup_by_id', {
        p_public_id: id, p_coins: amount, p_note: note.trim(), p_request_id: requestId,
      });
      if (rpcError) throw rpcError;
      if (data?.status !== 'completed') throw new Error('لم يؤكد الخادم الشحن');
      setTopupResult(`تم شحن ${data.coins} عملة للحساب ${data.recipient_id} (${data.recipient_name || 'مستخدم'}). رقم العملية: ${data.id}`);
      setCoins(''); setNote('');
      await refresh();
    } catch (e) {
      setError((e instanceof Error ? e.message : String(e)) + ' — إذا انقطع الاتصال بعد التأكيد، راجع السجل قبل إعادة المحاولة.');
    } finally { setTopupBusy(false); }
  };
  return <section className="bg-white border border-amber-200 rounded-2xl p-4 mb-5">
    <h2 className="font-black text-lg mb-2">الشحن والمحفظة — السجلات المالية</h2>
    <button type="button" disabled={busy} className="border border-amber-500 rounded-xl px-4 py-2" onClick={() => void refresh()}>{busy ? 'جاري التحميل...' : 'عرض الأرصدة والطلبات'}</button>
    {state?.isOwner && <div className="mt-4 border border-amber-300 rounded-xl p-3 space-y-3">
      <h3 className="font-black">إصدار عملات للخزينة</h3>
      <p className="text-xs">هذه العملية متاحة للمالك فقط وتحتاج تأكيداً قبل التنفيذ.</p>
      <button type="button" className="bg-amber-700 text-white rounded-xl px-4 py-3 font-bold" onClick={() => window.alert('يجب تفعيل إجراء الإصدار الآمن قبل استخدام هذا الزر')}>إصدار العملات</button>
    </div>}
    <div className="mt-4 border border-amber-300 rounded-xl p-3 space-y-3">
      <h3 className="font-black">شحن مستخدم بواسطة ID الحساب</h3>
      <input inputMode="numeric" aria-label="ID المستخدم" value={recipientId} onChange={e => setRecipientId(e.target.value)} placeholder="ID المستخدم (مثال: 100000)" className="w-full border rounded-lg p-3" />
      <input inputMode="numeric" aria-label="عدد العملات" value={coins} onChange={e => setCoins(e.target.value)} placeholder="عدد العملات" className="w-full border rounded-lg p-3" />
      <textarea aria-label="سبب الشحن" value={note} onChange={e => setNote(e.target.value)} placeholder="سبب الشحن أو مرجع العملية (10 أحرف على الأقل)" className="w-full border rounded-lg p-3" rows={2} />
      <p className="text-xs text-amber-900">العملية تخصم من الخزينة ولا تصدر عملات جديدة. تحقق من رقم المستخدم قبل التأكيد.</p>
      <button type="button" disabled={topupBusy} onClick={() => void topupById()} className="bg-amber-600 text-white rounded-xl px-4 py-3 font-bold disabled:opacity-50">{topupBusy ? 'جاري الشحن...' : 'تأكيد شحن المستخدم'}</button>
      {topupResult && <p role="status" className="text-green-800 break-words">{topupResult}</p>}
    </div>
    {error && <p role="alert" className="text-red-700 mt-2">{error}</p>}
    {state && <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="border rounded-xl p-3"><p className="text-xs text-slate-500">رصيد الخزينة</p><p className="font-black">{String(state.treasury)}</p></div>
        <div className="border rounded-xl p-3"><p className="text-xs text-slate-500">العملات المصدرة</p><p className="font-black">{state.issued == null ? '—' : String(state.issued)}</p></div>
      </div>
      <h3 className="font-bold mt-4">وكالات الشحن ({state.agencies.length})</h3>
      {state.agencies.map((r,i) => <div key={String(r.id ?? i)} className="border-b py-2 text-sm">{String(r.name ?? 'وكالة')} — {r.is_active ? 'فعالة' : 'متوقفة'}<p dir="ltr" className="text-xs text-slate-500 break-all">{String(r.id)}</p></div>)}
      <h3 className="font-bold mt-4">طلبات الشحن ({state.requests.length})</h3>
      {state.requests.map((r,i) => <div key={String(r.id ?? i)} className="border-b py-2 text-xs">{String(r.status)} — {String(r.coins)} عملة<p dir="ltr" className="break-all text-slate-500">{String(r.id)}</p></div>)}
      <h3 className="font-bold mt-4">حركة الخزينة ({state.ledger.length})</h3>
      {state.ledger.map((r,i) => <div key={String(r.id ?? i)} className="border-b py-2 text-xs">{String(r.amount ?? '—')} — الرصيد: {String(r.balance_after ?? '—')}</div>)}
      <p className="text-xs text-amber-800 mt-4">إصدار العملات وتحويلها يتطلب تأكيد قرار مالي مستقل، لذلك لم يتم تنفيذ أي إصدار أو تحويل.</p>
    </div>}
  </section>;
};
