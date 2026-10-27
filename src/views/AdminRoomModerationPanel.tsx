import React, { useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

type Person = { user_id: string; seat_no?: number | null; reason?: string | null };
type State = { roomId: string; members: Person[]; banned: Person[] };
export const AdminRoomModerationPanel: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [state, setState] = useState<State | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = async () => {
    setBusy(true); setError(''); setState(null);
    try {
      if (!stagingBackend) throw new Error('الخادم غير متصل');
      const { data, error: rpcError } = await stagingBackend.rpc('phase6_admin_room_state', { p_room_id: roomId.trim() });
      if (rpcError) throw rpcError;
      setState(data as State);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const act = async (person: Person, action: 'ban' | 'unban') => {
    if (!stagingBackend) return;
    const why = reason.trim();
    if (why.length < 10 || why.length > 300) { setError('اكتب سبباً من 10 إلى 300 حرف'); return; }
    if (!window.confirm(action === 'ban' ? 'تأكيد حظر هذا المستخدم من الغرفة فقط؟' : 'تأكيد رفع حظر هذا المستخدم من الغرفة؟')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: rpcError } = await stagingBackend.rpc('phase6_admin_room_action', {
        p_room_id: roomId.trim(), p_target: person.user_id, p_action: action, p_reason: why, p_request_id: crypto.randomUUID()
      });
      if (rpcError) throw rpcError;
      setNotice('تم تنفيذ العملية وتسجيلها في سجل التدقيق');
      setReason('');
      const { data, error: stateError } = await stagingBackend.rpc('phase6_admin_room_state', { p_room_id: roomId.trim() });
      if (stateError) throw stateError;
      setState(data as State);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className="bg-white border border-amber-200 rounded-2xl p-4 mb-5">
    <h2 className="font-black text-lg mb-2">إشراف الغرف</h2>
    <p className="text-xs text-slate-500 mb-3">الحظر ورفع الحظر داخل الغرفة فقط. يتطلب صلاحية الإدارة وسبباً مسجلاً.</p>
    <div className="flex gap-2 mb-3"><input dir="ltr" className="border rounded-xl p-2 flex-1 min-w-0" value={roomId} onChange={e => { setRoomId(e.target.value); setState(null); }} placeholder="Room UUID" /><button disabled={busy || !roomId.trim()} onClick={() => void load()} className="border border-amber-400 rounded-xl px-3">عرض الغرفة</button></div>
    {state && <>
      <textarea rows={2} maxLength={300} className="w-full border rounded-xl p-3 mb-3" placeholder="سبب الإجراء (10 أحرف على الأقل)" value={reason} onChange={e => setReason(e.target.value)} />
      <h3 className="font-bold mb-2">الأعضاء ({state.members.length})</h3>
      {state.members.map(p => <div key={p.user_id} className="flex items-center justify-between gap-2 py-2 border-b"><span dir="ltr" className="text-xs break-all">{p.user_id}</span><button disabled={busy} className="rounded-lg border border-red-300 text-red-700 px-3 py-2 shrink-0" onClick={() => void act(p,'ban')}>حظر</button></div>)}
      <h3 className="font-bold mt-4 mb-2">المحظورون ({state.banned.length})</h3>
      {state.banned.map(p => <div key={p.user_id} className="flex items-center justify-between gap-2 py-2 border-b"><span dir="ltr" className="text-xs break-all">{p.user_id}</span><button disabled={busy} className="rounded-lg border border-amber-400 px-3 py-2 shrink-0" onClick={() => void act(p,'unban')}>رفع الحظر</button></div>)}
    </>}
    {busy && <p className="text-slate-500">جاري المعالجة...</p>}
    {error && <p role="alert" className="text-red-700 mt-2">{error}</p>}
    {notice && <p role="status" className="text-green-700 mt-2">{notice}</p>}
  </section>;
};
