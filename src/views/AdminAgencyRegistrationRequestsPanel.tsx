import React, { useCallback, useEffect, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

type Registration = { id: string; applicant_id: string; kind: string; name: string; details: Record<string, unknown> | null; status: string; created_at: string; review_note: string | null };
export const AdminAgencyRegistrationRequestsPanel: React.FC = () => {
  const [requests,setRequests] = useState<Registration[]>([]);
  const [busy,setBusy] = useState<string | null>(null);
  const [error,setError] = useState('');
  const [note,setNote] = useState<Record<string,string>>({});
  const [commission,setCommission] = useState<Record<string,string>>({});
  const load = useCallback(async () => {
    if (!stagingBackend) throw new Error('الخادم غير متصل');
    const {data,error:rpcError} = await stagingBackend.rpc('phase4_agency_state');
    if (rpcError) throw rpcError;
    setRequests(Array.isArray(data?.registrations) ? data.registrations as Registration[] : []);
  },[]);
  useEffect(() => { void load().catch(e => setError(String(e))); },[load]);
  const decide = async (item: Registration,approve: boolean) => {
    if (!stagingBackend) return;
    const reason = (note[item.id] ?? '').trim();
    if (reason.length < 3) { setError('اكتب سبب القرار (3 أحرف على الأقل)'); return; }
    const percent = Number(commission[item.id] ?? '');
    if (approve && ((commission[item.id] ?? '').trim() === '' || !Number.isFinite(percent) || percent < 0 || percent > 100)) { setError('حدد نسبة عمولة من 0 إلى 100'); return; }
    if (!window.confirm(approve ? 'تأكيد الموافقة على فتح الوكالة؟' : 'تأكيد رفض الطلب؟')) return;
    setBusy(item.id);setError('');
    try {
      const {error:rpcError} = await stagingBackend.rpc('phase4_agency_action',{
        p_action: approve ? 'approve_registration' : 'reject_registration',
        p_data: {id:item.id,note:reason,...(approve ? {commission_percent:percent} : {})},
        p_request_id:crypto.randomUUID()
      });
      if (rpcError) throw rpcError;
      await load();
    } catch(e) {setError(e instanceof Error ? e.message : String(e));}
    finally {setBusy(null);}
  };
  return <section className="space-y-4">
    <button type="button" onClick={() => void load().catch(e => setError(String(e)))} className="border border-amber-300 rounded-xl px-4 py-2 text-sm">تحديث الطلبات</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {requests.filter(r => r.status === 'pending').length === 0 && <p className="text-slate-500">لا توجد طلبات فتح وكالة معلقة حالياً.</p>}
    {requests.filter(r => r.status === 'pending').map(item => <article key={item.id} className="bg-white border border-amber-200 rounded-2xl p-4 space-y-3">
      <h3 className="font-black">{item.name}</h3>
      <p className="text-sm">النوع: {item.kind === 'host' ? 'وكالة مضيفين' : item.kind === 'recharge' ? 'وكالة شحن' : item.kind}</p>
      <p className="text-xs text-slate-600" dir="ltr">Applicant: {item.applicant_id}</p>
      <p className="text-xs text-slate-600">{new Date(item.created_at).toLocaleString('ar-IQ')}</p>
      {item.details && Object.entries(item.details).map(([key,value]) => <p key={key} className="text-xs break-words">{key}: {typeof value === 'string' || typeof value === 'number' ? String(value) : '—'}</p>)}
      <input className="w-full border rounded-xl p-3" placeholder="سبب القرار" value={note[item.id] ?? ''} onChange={e => setNote(n => ({...n,[item.id]:e.target.value}))}/>
      <input className="w-full border rounded-xl p-3" type="number" min="0" max="100" placeholder="نسبة العمولة % للموافقة" value={commission[item.id] ?? ''} onChange={e => setCommission(n => ({...n,[item.id]:e.target.value}))}/>
      <div className="flex gap-2">
        <button type="button" disabled={busy !== null} onClick={() => void decide(item,true)} className="bg-emerald-700 text-white rounded-xl px-4 py-2 disabled:opacity-50">موافقة</button>
        <button type="button" disabled={busy !== null} onClick={() => void decide(item,false)} className="border border-red-300 text-red-700 rounded-xl px-4 py-2 disabled:opacity-50">رفض</button>
      </div>
    </article>)}
  </section>;
};
