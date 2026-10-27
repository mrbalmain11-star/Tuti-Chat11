import React, { useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';
type Report = { summary: Record<string, unknown>; rows: Array<Record<string, unknown>>; total: number };
export const AdminReportsPanel: React.FC = () => {
  const today = new Date().toISOString().slice(0,10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async (page = 0) => {
    setBusy(true); setError('');
    try {
      if (!stagingBackend) throw new Error('الخادم غير متصل');
      const start = new Date(from + 'T00:00:00Z');
      const end = new Date(to + 'T00:00:00Z');
      end.setUTCDate(end.getUTCDate() + 1);
      if (!(start < end) || (end.getTime() - start.getTime()) > 366 * 86400000) throw new Error('حدد فترة صحيحة لا تتجاوز 366 يوماً');
      const { data, error: rpcError } = await stagingBackend.rpc('phase4_admin_report', { p_from: start.toISOString(), p_to: end.toISOString(), p_status: status || null, p_offset: page, p_limit: 20 });
      if (rpcError) throw rpcError;
      setReport(data as Report); setOffset(page);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className="bg-white border border-amber-200 rounded-2xl p-4 mb-5">
    <h2 className="font-black text-lg mb-2">التقارير والإحصائيات المالية</h2>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <label className="text-xs">من<input type="date" className="block border rounded-lg p-2 w-full" value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label className="text-xs">إلى (شامل)<input type="date" className="block border rounded-lg p-2 w-full" value={to} onChange={e => setTo(e.target.value)} /></label>
    </div>
    <select className="w-full border rounded-lg p-2 mb-3" value={status} onChange={e => setStatus(e.target.value)}>
      <option value="">كل الحالات</option><option value="pending">قيد الانتظار</option><option value="completed">مكتمل</option><option value="failed">فاشل</option><option value="refunded">مسترد</option>
    </select>
    <button disabled={busy} className="bg-amber-700 text-white rounded-xl px-4 py-2 disabled:opacity-40" onClick={() => void load()}>عرض التقرير</button>
    {busy && <p>جاري التحميل...</p>}
    {error && <p role="alert" className="text-red-700 mt-2">{error}</p>}
    {report && <div className="mt-4">
      <h3 className="font-bold mb-2">ملخص الخادم</h3>
      <div className="grid grid-cols-2 gap-2">{Object.entries(report.summary).filter(([k]) => k !== 'operation_statuses').map(([k,v]) => <div className="border rounded-lg p-2" key={k}><p className="text-xs text-slate-500">{k}</p><p className="font-bold break-all">{String(v)}</p></div>)}</div>
      <h3 className="font-bold mt-4">العمليات ({report.total})</h3>
      {report.rows.map(r => <div key={String(r.id)} className="border-b py-2 text-xs"><div>{String(r.operation)} — {String(r.status)}</div><div dir="ltr" className="break-all text-slate-500">{String(r.id)}</div></div>)}
      <div className="flex justify-between mt-3"><button disabled={busy || offset === 0} onClick={() => void load(Math.max(0,offset-20))}>السابق</button><span>{offset+1}–{Math.min(offset+20,report.total)}</span><button disabled={busy || offset+20>=report.total} onClick={() => void load(offset+20)}>التالي</button></div>
    </div>}
  </section>;
};
