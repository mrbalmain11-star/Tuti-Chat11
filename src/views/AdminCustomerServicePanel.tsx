import React, { useEffect, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

type Case = {
  id: string;
  targetPublicId: number;
  reportedName: string;
  targetName: string;
  supportRoomId: string;
  submittedBy: string;
  details: string;
  status: 'pending_admin' | 'under_review' | 'needs_info' | 'reviewed' | 'dismissed' | 'ban_lifted' | 'ban_upheld';
  reviewerNote?: string | null;
  createdAt: string;
};

type Props = { isOwner: boolean };

export const AdminCustomerServicePanel: React.FC<Props> = ({ isOwner }) => {
  const [roomId, setRoomId] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    if (!stagingBackend) return;
    setBusy(true); setError('');
    try {
      const [config, queue] = await Promise.all([
        stagingBackend.rpc('phase2_customer_service_room'),
        stagingBackend.rpc('phase2_customer_service_appeal_action', { p_action: 'list' }),
      ]);
      if (config.error) throw config.error;
      if (queue.error) throw queue.error;
      setRoomId((config.data as { roomId?: string | null } | null)?.roomId ?? '');
      const rows = (queue.data as { rows?: Case[] } | null)?.rows;
      if (!Array.isArray(rows)) throw new Error('استجابة الطلبات غير صالحة');
      setCases(rows);
    } catch (cause) {
      setCases([]); setError(cause instanceof Error ? cause.message : 'تعذر تحميل الطلبات');
    } finally { setBusy(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const saveRoom = async () => {
    if (!stagingBackend || !isOwner) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId.trim())) {
      setError('أدخل UUID الغرفة الشخصية الصحيح'); return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: rpcError } = await stagingBackend.rpc('phase2_customer_service_room', { p_room_id: roomId.trim() });
      if (rpcError) throw rpcError;
      setNotice('تم تعيين الغرفة. يجب أن يكون موظفو الدعم مشرفين فيها من خلال إعدادات الغرفة.');
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر تعيين الغرفة'); }
    finally { setBusy(false); }
  };

  const decide = async (item: Case, status: 'under_review' | 'needs_info' | 'reviewed' | 'dismissed' | 'lift_ban' | 'uphold_ban') => {
    if (!stagingBackend) return;
    if (status === 'lift_ban' && !window.confirm(`تأكيد رفع الباند العام عن الحساب ${item.targetPublicId}؟`)) return;
    if (status === 'uphold_ban' && !window.confirm(`تأكيد تثبيت الباند العام على الحساب ${item.targetPublicId}؟`)) return;
    const reviewerNote = note.trim();
    if (reviewerNote.length < 5 || reviewerNote.length > 1000) { setError('سبب القرار يجب أن يكون بين 5 و1000 حرف'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: rpcError } = await stagingBackend.rpc('phase2_customer_service_appeal_action', {
        p_action: 'decide', p_appeal_id: item.id, p_decision: status,
        p_reviewer_note: reviewerNote, p_request_id: crypto.randomUUID(),
      });
      if (rpcError) throw rpcError;
      setNote(''); setNotice('تم حفظ مراجعة الإدارة في سجل التدقيق'); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر حفظ المراجعة'); }
    finally { setBusy(false); }
  };

  const statusLabel: Record<Case['status'], string> = {
    pending_admin: 'بانتظار الإدارة', under_review: 'قيد المراجعة',
    needs_info: 'مطلوب استكمال المعلومات', reviewed: 'اكتملت المراجعة', dismissed: 'أُغلق الطلب',
    ban_lifted: 'تم رفع الباند', ban_upheld: 'تم تثبيت الباند',
  };

  return <section className="rounded-2xl border border-amber-200 bg-white p-4 space-y-3">
    <h2 className="font-black text-lg">طلبات اعتراض الباند العام</h2>
    <p className="text-xs text-slate-600">الحساب المحظور يتواصل من حساب آخر داخل غرفة خدمة العملاء. مشرف الغرفة يرفع الطلب، والإدارة تراجع ثم تختار الإجراء. رفع الباند متاح فقط إذا ظل الباند نفسه فعالاً منذ تقديم الاعتراض.</p>
    {isOwner && <div className="rounded-xl border border-slate-200 p-3">
      <label className="block text-sm font-bold">غرفة خدمة العملاء (غرفتك الشخصية)</label>
      <div className="mt-2 flex gap-2"><input dir="ltr" value={roomId} onChange={e => setRoomId(e.target.value)} className="min-w-0 flex-1 rounded-xl border p-2" placeholder="Room UUID"/><button disabled={busy} onClick={() => void saveRoom()} className="rounded-xl bg-emerald-800 px-3 text-white">تعيين</button></div>
    </div>}
    <button disabled={busy} onClick={() => void refresh()} className="rounded-xl border border-amber-300 px-3 py-2">تحديث الطلبات</button>
    {cases.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-3 space-y-1">
      <p className="font-bold">{statusLabel[item.status]}</p>
      <p className="text-xs text-slate-500 break-all">رقم الطلب: {item.id}</p>
      <p className="text-sm">الحساب: {item.targetName} — ID {item.targetPublicId}</p>
      <p className="text-xs text-slate-500">الاسم الذي ذكره المستخدم: {item.reportedName}</p>
      <p className="whitespace-pre-wrap text-sm">{item.details}</p>
      {['pending_admin','under_review','needs_info'].includes(item.status) && <>
        <textarea rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className="w-full rounded-xl border p-2" placeholder="ملاحظة الإدارة"/>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => void decide(item,'under_review')} className="rounded-lg bg-blue-700 px-3 py-2 text-white">بدء المراجعة</button>
          <button disabled={busy} onClick={() => void decide(item,'needs_info')} className="rounded-lg bg-amber-600 px-3 py-2 text-white">طلب معلومات إضافية</button>
          <button disabled={busy} onClick={() => void decide(item,'lift_ban')} className="rounded-lg bg-emerald-700 px-3 py-2 text-white">قبول الاعتراض ورفع الباند</button>
          <button disabled={busy} onClick={() => void decide(item,'uphold_ban')} className="rounded-lg bg-red-700 px-3 py-2 text-white">رفض الاعتراض وتثبيت الباند</button>
          <button disabled={busy} onClick={() => void decide(item,'dismissed')} className="rounded-lg bg-slate-700 px-3 py-2 text-white">إغلاق الطلب</button>
        </div>
      </>}
    </article>)}
    {!busy && cases.length===0 && <p className="text-sm text-slate-500">لا توجد طلبات باند عام مفتوحة حالياً.</p>}
    {busy && <p role="status" className="text-slate-500">جارٍ التحميل...</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {notice && <p role="status" className="text-emerald-700">{notice}</p>}
  </section>;
};
