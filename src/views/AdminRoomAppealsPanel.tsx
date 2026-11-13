import React, { useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

type Appeal = {
  id: string;
  roomId: string;
  targetId: string;
  submittedBy: string;
  reason: string;
  status: 'pending_owner' | 'owner_accepted' | 'owner_rejected' | 'escalated' | 'admin_accepted' | 'admin_rejected';
  createdAt: string;
  ownerDecisionReason?: string | null;
};

export const AdminRoomAppealsPanel: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!stagingBackend) { setError('الخادم غير متصل'); return; }
    setBusy(true); setError(''); setNotice(''); setAppeals([]);
    try {
      const { data, error: rpcError } = await stagingBackend.rpc('phase2_room_ban_appeal_action', {
        p_action: 'list', p_room_id: roomId.trim(),
      });
      if (rpcError) throw rpcError;
      const rows = (data as { rows?: Appeal[] } | null)?.rows;
      if (!Array.isArray(rows)) throw new Error('استجابة الاعتراضات غير صالحة');
      setAppeals(rows);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحميل الاعتراضات');
    } finally { setBusy(false); }
  };

  const decide = async (appeal: Appeal, decision: 'lift' | 'uphold') => {
    if (!stagingBackend) return;
    const decisionReason = reason.trim();
    if (decisionReason.length < 5 || decisionReason.length > 500) {
      setError('اكتب سبب القرار بين 5 و500 حرف'); return;
    }
    const action = appeal.status === 'escalated' ? 'admin_decide' : 'owner_decide';
    const prompt = decision === 'lift' ? 'تأكيد قبول الاعتراض ورفع حظر الغرفة؟' : 'تأكيد رفض الاعتراض والإبقاء على الحظر؟';
    if (!window.confirm(prompt)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: rpcError } = await stagingBackend.rpc('phase2_room_ban_appeal_action', {
        p_action: action, p_appeal_id: appeal.id, p_decision: decision,
        p_reason: decisionReason, p_request_id: crypto.randomUUID(),
      });
      if (rpcError) throw rpcError;
      setReason(''); setNotice('تم تسجيل القرار في سجل الاعتراضات');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تسجيل القرار');
    } finally { setBusy(false); }
  };

  const statusLabel: Record<Appeal['status'], string> = {
    pending_owner: 'بانتظار مالك الغرفة', owner_accepted: 'قُبل ورفع الحظر',
    owner_rejected: 'رفضه مالك الغرفة', escalated: 'مصعّد إلى الإدارة',
    admin_accepted: 'قُبل إدارياً', admin_rejected: 'رُفض إدارياً',
  };

  return <section className="rounded-2xl border border-amber-200 bg-white p-4 mb-5">
    <h2 className="font-black text-lg mb-2">اعتراضات باند الغرف</h2>
    <p className="text-xs text-slate-500 mb-3">مالك الغرفة يراجع الاعتراض أولاً. الإدارة تراجع الاعتراض المصعّد. كل قرار يتحقق منه الخادم ويسجل.</p>
    <div className="flex gap-2 mb-3">
      <input dir="ltr" className="border rounded-xl p-2 flex-1 min-w-0" value={roomId} onChange={e => { setRoomId(e.target.value); setAppeals([]); }} placeholder="Room UUID" />
      <button disabled={busy || !roomId.trim()} onClick={() => void load()} className="rounded-xl border border-amber-400 px-3">عرض</button>
    </div>
    {appeals.map(appeal => <article key={appeal.id} className="rounded-xl border border-slate-200 p-3 mb-3">
      <p className="font-bold">{statusLabel[appeal.status] ?? appeal.status}</p>
      <p className="text-xs text-slate-500 break-all">رقم الاعتراض: {appeal.id}</p>
      <p className="text-xs text-slate-500 break-all">حساب مقدّم الاعتراض: {appeal.submittedBy}</p>
      <p className="text-xs text-slate-500 break-all">الحساب المستهدف: {appeal.targetId}</p>
      <p className="mt-2 whitespace-pre-wrap">{appeal.reason}</p>
      {appeal.ownerDecisionReason && <p className="mt-2 text-sm text-slate-600">سبب قرار المالك: {appeal.ownerDecisionReason}</p>}
      {['pending_owner','escalated'].includes(appeal.status) && <div className="mt-3">
        <textarea rows={2} maxLength={500} className="w-full rounded-xl border p-2" value={reason} onChange={e => setReason(e.target.value)} placeholder="سبب القرار" />
        <div className="flex gap-2 mt-2">
          <button disabled={busy} onClick={() => void decide(appeal,'lift')} className="rounded-lg bg-emerald-700 px-3 py-2 text-white">قبول ورفع الحظر</button>
          <button disabled={busy} onClick={() => void decide(appeal,'uphold')} className="rounded-lg bg-red-700 px-3 py-2 text-white">رفض الاعتراض</button>
        </div>
      </div>}
    </article>)}
    {!busy && appeals.length===0 && roomId && <p className="text-sm text-slate-500">لا توجد اعتراضات ظاهرة لهذا الحساب/الغرفة.</p>}
    {busy && <p role="status" className="text-slate-500">جارٍ التحميل...</p>}
    {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-2 text-emerald-700">{notice}</p>}
  </section>;
};
