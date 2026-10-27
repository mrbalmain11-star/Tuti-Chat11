import React, { useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';
type Row = Record<string, unknown>;
type Recharge = { treasury: number; issued: number | null; agencies: Row[]; requests: Row[]; ledger: Row[]; isOwner: boolean };
export const AdminRechargePanel: React.FC = () => {
  const [state, setState] = useState<Recharge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
  return <section className="bg-white border border-amber-200 rounded-2xl p-4 mb-5">
    <h2 className="font-black text-lg mb-2">الشحن والمحفظة — السجلات المالية</h2>
    <button type="button" disabled={busy} className="border border-amber-500 rounded-xl px-4 py-2" onClick={() => void refresh()}>{busy ? 'جاري التحميل...' : 'عرض الأرصدة والطلبات'}</button>
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
