import React, { useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

export const AdminAgencyActionsPanel: React.FC = () => {
  const [kind, setKind] = useState<'approve_registration' | 'reject_registration' | 'edit' | 'close' | 'reject_join' | 'exception_transfer'>('approve_registration');
  const [id, setId] = useState('');
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [commission, setCommission] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async () => {
    setError(''); setMessage('');
    if (!stagingBackend) { setError('الخادم غير متصل'); return; }
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id.trim())) { setError('أدخل UUID الطلب أو الوكالة'); return; }
    if (note.trim().length < (kind === 'exception_transfer' ? 10 : 3)) { setError('سبب القرار قصير جداً'); return; }
    if ((kind === 'edit' || kind === 'approve_registration') && (!commission.trim() || !Number.isFinite(Number(commission)) || Number(commission) < 0 || Number(commission) > 100)) { setError('حدد نسبة عمولة بين 0 و100'); return; }
    if (kind === 'edit' && (name.trim().length < 2 || name.trim().length > 80)) { setError('اسم الوكالة غير صالح'); return; }
    if (!window.confirm('هل تؤكد تنفيذ هذا القرار الإداري؟ قد لا يمكن التراجع عنه.')) return;
    const data: Record<string, unknown> = { id: id.trim(), note: note.trim() };
    if (kind === 'edit') data.name = name.trim();
    if (kind === 'edit' || kind === 'approve_registration') data.commission_percent = Number(commission);
    setBusy(true);
    try {
      const { error: rpcError } = await stagingBackend.rpc('phase4_agency_action', { p_action: kind, p_data: data, p_request_id: crypto.randomUUID() });
      if (rpcError) throw rpcError;
      setMessage('تم تنفيذ القرار وتسجيله في سجل التدقيق');
      setId(''); setNote(''); setName(''); setCommission('');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className="bg-white border border-amber-200 rounded-2xl p-4 mb-5">
    <h2 className="font-black text-lg mb-2">إجراءات إدارة الوكالات</h2>
    <p className="text-xs text-slate-500 mb-3">القرارات تخضع لصلاحيات الخادم وتُسجّل في التدقيق. استخدم معرّف السجل من تبويبات الوكالات والطلبات أعلاه.</p>
    <select className="w-full border rounded-xl p-3 mb-3" value={kind} onChange={e => setKind(e.target.value as typeof kind)}>
      <option value="approve_registration">الموافقة على تسجيل وكالة</option>
      <option value="reject_registration">رفض تسجيل وكالة</option>
      <option value="edit">تعديل وكالة</option>
      <option value="close">إغلاق وكالة</option>
      <option value="reject_join">رفض طلب انضمام</option>
      <option value="exception_transfer">نقل استثنائي بعد مراجعة</option>
    </select>
    <input dir="ltr" className="w-full border rounded-xl p-3 mb-3" value={id} onChange={e => setId(e.target.value)} placeholder="UUID" />
    {kind === 'edit' && <input className="w-full border rounded-xl p-3 mb-3" value={name} onChange={e => setName(e.target.value)} placeholder="اسم الوكالة الجديد" />}
    {(kind === 'edit' || kind === 'approve_registration') && <input type="number" min={0} max={100} step="0.01" className="w-full border rounded-xl p-3 mb-3" value={commission} onChange={e => setCommission(e.target.value)} placeholder="نسبة العمولة %" />}
    <textarea className="w-full border rounded-xl p-3 mb-3" rows={2} maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="سبب القرار / ملاحظة المراجعة" />
    <button type="button" disabled={busy} onClick={() => void submit()} className="bg-amber-700 text-white rounded-xl px-4 py-3 disabled:opacity-40">{busy ? 'جاري التنفيذ...' : 'تنفيذ القرار'}</button>
    {error && <p role="alert" className="text-red-700 mt-2">{error}</p>}
    {message && <p role="status" className="text-green-700 mt-2">{message}</p>}
  </section>;
};
