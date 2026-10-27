import React, { useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

export const AdminSpecialIdPanel: React.FC = () => {
  const [target, setTarget] = useState('');
  const [specialId, setSpecialId] = useState('');
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const grant = async () => {
    setError(''); setNotice('');
    if (!stagingBackend) { setError('خادم Staging غير متصل'); return; }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.trim())) { setError('أدخل معرّف الحساب UUID الصحيح'); return; }
    if (!/^[1-9][0-9]{3,9}$/.test(specialId)) { setError('الآيدي المميز يجب أن يكون 4 إلى 10 أرقام ولا يبدأ بصفر'); return; }
    if (reason.trim().length < 10 || reason.trim().length > 300) { setError('سبب المنح يجب أن يكون من 10 إلى 300 حرف'); return; }
    if (!confirmation) { setError('يجب تأكيد أن المنح نهائي'); return; }
    setBusy(true);
    try {
      const { error: rpcError } = await stagingBackend.rpc('phase5_special_id_grant', {
        p_target: target.trim(), p_public_id: specialId, p_reason: reason.trim(), p_request_id: crypto.randomUUID()
      });
      if (rpcError) throw rpcError;
      setNotice('تم منح الآيدي المميز بنجاح وتسجيل العملية في سجل التدقيق');
      setSpecialId(''); setReason(''); setConfirmation(false);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-amber-200 bg-white p-4 mb-5">
    <h2 className="font-black text-lg mb-2">منح آيدي مميز</h2>
    <p className="text-sm text-slate-500 mb-4">للمالك فقط. المنح نهائي لحساب موثق ولا يمكن تغيير الآيدي بعد تخصيصه. لا يتم استبدال رقم الحساب الأصلي.</p>
    <label className="block text-sm mb-1">معرّف المستخدم UUID</label>
    <input className="w-full border rounded-xl p-3 mb-3" dir="ltr" value={target} onChange={e => setTarget(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
    <label className="block text-sm mb-1">الآيدي المميز المطلوب</label>
    <input className="w-full border rounded-xl p-3 mb-3" dir="ltr" inputMode="numeric" maxLength={10} value={specialId} onChange={e => setSpecialId(e.target.value)} placeholder="12345" />
    <label className="block text-sm mb-1">سبب المنح (إلزامي للتدقيق)</label>
    <textarea className="w-full border rounded-xl p-3 mb-3" maxLength={300} rows={2} value={reason} onChange={e => setReason(e.target.value)} />
    <label className="flex gap-2 text-sm mb-3"><input type="checkbox" checked={confirmation} onChange={e => setConfirmation(e.target.checked)} /> أؤكد أن هذا الآيدي سيُمنح بشكل نهائي</label>
    <button type="button" disabled={busy || !confirmation} onClick={() => void grant()} className="rounded-xl bg-amber-700 text-white px-4 py-3 disabled:opacity-40">{busy ? 'جاري التحقق...' : 'منح الآيدي المميز'}</button>
    {error && <p role="alert" className="text-red-700 mt-3">{error}</p>}
    {notice && <p role="status" className="text-green-700 mt-3">{notice}</p>}
  </section>;
};
