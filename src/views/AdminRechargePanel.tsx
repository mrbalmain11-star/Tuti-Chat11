import React, { useCallback, useEffect, useRef, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';
import { completedResult, documentedReason, integerInput, rpcForIntent, STAGING_ISSUANCE, STAGING_ISSUANCE_REFERENCE } from '../services/treasuryProtocol';
import type { TreasuryIntent } from '../services/treasuryProtocol';

type Row = Record<string, unknown>;
type Agency = { id: string; name: string; is_active: boolean; is_own_treasury: boolean; treasury: number | null };
type Recharge = { treasury: number; issued: number | null; agencies: Agency[]; requests: Row[]; ledger: Row[]; isOwner: boolean };
const storageKey = (actor: string) => `totichat:staging:treasury:pending:${actor}`;
const message = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
const money = (value: number) => value.toLocaleString('ar-EG');
const inputClass = 'w-full border border-slate-300 rounded-xl p-3 bg-white';
const buttonClass = 'rounded-xl px-4 py-3 bg-amber-700 text-white font-bold disabled:opacity-50';

function rechargeState(value: unknown): Recharge {
  const row = value as Recharge | null;
  if (!row || typeof row.isOwner !== 'boolean' || !Number.isSafeInteger(row.treasury) || row.treasury < 0 ||
    (row.issued !== null && (!Number.isSafeInteger(row.issued) || row.issued < 0)) ||
    !Array.isArray(row.agencies) || !Array.isArray(row.requests) || !Array.isArray(row.ledger) ||
    row.agencies.some(a => typeof a.id !== 'string' || typeof a.name !== 'string' ||
      (row.isOwner && (!Number.isSafeInteger(a.treasury) || Number(a.treasury) < 0)))) {
    throw new Error('تعذر التحقق من بيانات الخزينة');
  }
  return row;
}

export const AdminRechargePanel: React.FC = () => {
  const [state, setState] = useState<Recharge | null>(null);
  const [history, setHistory] = useState<Row[]>([]);
  const [actor, setActor] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState<TreasuryIntent | null>(null);
  const [confirmation, setConfirmation] = useState<TreasuryIntent | null>(null);
  const [typedAmount, setTypedAmount] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueNote, setIssueNote] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipient, setRecipient] = useState<{ public_id: number; display_name: string } | null>(null);
  const [coins, setCoins] = useState('');
  const [note, setNote] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [allocation, setAllocation] = useState('');
  const [allocationNote, setAllocationNote] = useState('');

  const refresh = useCallback(async () => {
    if (!stagingBackend) throw new Error('الخادم غير متصل');
    const { data: auth, error: authError } = await stagingBackend.auth.getUser();
    if (authError) throw authError;
    if (!auth.user) throw new Error('يرجى تسجيل الدخول');
    const saved = localStorage.getItem(storageKey(auth.user.id));
    setActor(auth.user.id);
    setPending(saved ? JSON.parse(saved) as TreasuryIntent : null);
    const { data, error: rpcError } = await stagingBackend.rpc('phase4_recharge_state');
    if (rpcError) throw rpcError;
    const next = rechargeState(data);
    setState(next);
    if (next.isOwner) {
      const operations = await stagingBackend.from('financial_operations')
        .select('id,request_id,operation,payload,result,status,created_at')
        .eq('actor_id', auth.user.id).in('operation', ['recharge_action', 'owner_topup_by_id'])
        .order('created_at', { ascending: false }).limit(100);
      if (operations.error) throw operations.error;
      setHistory(operations.data ?? []);
    } else setHistory([]);
  }, []);

  const read = useCallback(async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await refresh(); }
    catch (e) { setState(null); setError(message(e)); }
    finally { lock.current = false; setBusy(false); }
  }, [refresh]);

  useEffect(() => {
    void read(); // Read only. Money movement is exclusively in confirmed event handlers.
    const subscription = stagingBackend?.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT' && event !== 'SIGNED_IN') return;
      setState(null); setActor(''); setRecipient(null); setConfirmation(null); setHistory([]); setPending(null);
    });
    return () => subscription?.data.subscription.unsubscribe();
  }, [read]);

  const clearPending = (id: string) => {
    localStorage.removeItem(storageKey(id));
    setPending(null);
  };

  const execute = async (intent: TreasuryIntent, retry = false) => {
    if (lock.current || !state?.isOwner) return;
    if (retry && !window.confirm(`إعادة إرسال نفس الطلب فقط: ${intent.label} — ${money(intent.coins)} عملة؟`)) return;
    lock.current = true; setBusy(true); setError(''); setStatus('جاري التحقق والإرسال…');
    let dispatched = false;
    try {
      if (!stagingBackend) throw new Error('الخادم غير متصل');
      const { data: auth, error: authError } = await stagingBackend.auth.getUser();
      if (authError) throw authError;
      if (!auth.user || auth.user.id !== intent.actorId || intent.actorId !== actor) throw new Error('تغير الحساب؛ أعد تحميل البيانات');
      const saved = localStorage.getItem(storageKey(actor));
      if (saved && (!retry || saved !== JSON.stringify(intent))) throw new Error('يوجد طلب محفوظ؛ تحقق من حالته أولاً');
      if (retry && !saved) throw new Error('الطلب المحفوظ غير متاح؛ أعد تحميل البيانات');
      // Persist BEFORE sending. Storage errors prevent dispatch. Uncertain outcomes retain the exact intent.
      localStorage.setItem(storageKey(actor), JSON.stringify(intent));
      setPending(intent); setConfirmation(null);
      const rpc = rpcForIntent(intent);
      dispatched = true;
      const response = await stagingBackend.rpc(rpc.name, rpc.args);
      if (response.error) {
        // These are explicit transactional database rejections, not network/transport failures.
        if (['P0001', '42501', '22P02', '23514', '22003', '23505'].includes(response.error.code)) clearPending(actor);
        throw response.error;
      }
      const result = completedResult(response.data);
      if (result.coins !== intent.coins) throw new Error('نتيجة العملية لا تطابق التأكيد');
      setStatus(`اكتملت العملية: ${intent.label} — ${money(result.coins)} عملة. المرجع: ${result.id}`);
      clearPending(actor);
      setIssueOpen(false); setTypedAmount(''); setCoins(''); setNote(''); setAllocation(''); setAllocationNote('');
      try { await refresh(); }
      catch (e) { setState(null); setError(`العملية مكتملة، لكن تحديث الأرصدة فشل: ${message(e)}`); }
    } catch (e) {
      setStatus(dispatched ? 'راجع حالة الطلب المحفوظ؛ لا تنشئ طلباً بديلاً عند انقطاع الاتصال.' : 'لم يتم إرسال عملية جديدة.');
      setError(message(e));
    } finally { lock.current = false; setBusy(false); }
  };

  const reconcile = async () => {
    if (!pending || !stagingBackend || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await stagingBackend.from('financial_operations').select('id,status,result')
        .eq('actor_id', actor).eq('request_id', pending.requestId).maybeSingle();
      if (response.error) throw response.error;
      if (!response.data) {
        setStatus('لم يظهر الطلب في السجل بعد. يمكن إعادة إرسال نفس الطلب المحفوظ يدوياً؛ لن يتم إنشاء معرّف جديد.');
        return;
      }
      if (response.data.status === 'completed') {
        const result = completedResult({ ...response.data.result, id: response.data.id });
        if (result.coins !== pending.coins) throw new Error('مبلغ السجل لا يطابق الطلب');
        setStatus(`اكتملت العملية المحفوظة. المرجع: ${result.id}`);
        clearPending(actor);
        await refresh();
      } else if (response.data.status === 'failed') {
        clearPending(actor); setStatus('أكد السجل فشل العملية'); await refresh();
      } else setStatus('العملية ما زالت قيد المعالجة. لا تنشئ طلباً بديلاً.');
    } catch (e) { setError(message(e)); }
    finally { lock.current = false; setBusy(false); }
  };

  const prepare = (action: TreasuryIntent['action']) => {
    if (!state?.isOwner || busy || pending) return;
    try {
      let amount: number, reason: string, label: string;
      const agency = state.agencies.find(a => a.id === agencyId && a.is_active && !a.is_own_treasury);
      if (action === 'issue') {
        amount = STAGING_ISSUANCE; reason = documentedReason(issueNote); label = 'إصدار للخزينة';
      } else if (action === 'topup') {
        if (!recipient || integerInput(recipientId, 2147483647) !== recipient.public_id) throw new Error('ابحث عن المستلم وتحقق من اسمه أولاً');
        amount = integerInput(coins, 1000000000); reason = documentedReason(note);
        label = `${recipient.display_name} — ID ${recipient.public_id}`;
      } else {
        if (!agency) throw new Error('اختر وكالة شحن فعالة مؤهلة');
        amount = integerInput(allocation); reason = documentedReason(allocationNote); label = agency.name;
      }
      if (action !== 'issue' && amount > state.treasury) throw new Error('رصيد الخزينة غير كافٍ');
      setError(''); setTypedAmount('');
      setConfirmation({ action, actorId: actor, requestId: crypto.randomUUID(), coins: amount, note: reason,
        label, ...(action === 'topup' ? { recipient: recipient!.public_id } : {}),
        ...(action === 'allocate' ? { agencyId: agency!.id } : {}) });
    } catch (e) { setError(message(e)); }
  };

  const findRecipient = async () => {
    if (!stagingBackend || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setRecipient(null);
    try {
      const id = integerInput(recipientId, 2147483647);
      const response = await stagingBackend.rpc('phase4_owner_recipient', { p_public_id: id });
      if (response.error) throw response.error;
      if (response.data?.public_id !== id || typeof response.data?.display_name !== 'string') throw new Error('لم يتم العثور على مستلم مؤهل');
      setRecipient(response.data);
    } catch (e) { setError(message(e)); }
    finally { lock.current = false; setBusy(false); }
  };

  const blocked = busy || !!pending || !!confirmation;
  return <section dir="rtl" aria-label="الشحن والخزينة" className="bg-white border border-amber-200 rounded-2xl p-4 mb-5 space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-black text-lg">الشحن والخزينة</h2><p className="text-xs text-slate-500">بيئة الاختبار • أرصدة وسجلات فعلية</p></div>
      <button type="button" disabled={busy || !!confirmation} className={buttonClass} onClick={() => void read()}>{busy ? 'جاري المعالجة…' : 'تحديث الأرصدة والسجل'}</button>
    </header>
    {error && <p role="alert" className="text-red-700 bg-red-50 rounded-xl p-3 break-words">{error}</p>}
    {status && <p role="status" className="text-slate-800 bg-slate-50 rounded-xl p-3 break-words">{status}</p>}
    {pending && <div className="border border-amber-500 rounded-xl p-3 space-y-2">
      <p>طلب محفوظ: {pending.label} — {money(pending.coins)} عملة</p>
      <p className="text-xs break-all" dir="ltr">{pending.requestId}</p>
      <button type="button" className={buttonClass} disabled={busy} onClick={() => void reconcile()}>التحقق من حالة الطلب</button>{' '}
      <button type="button" className={buttonClass} disabled={busy || !state?.isOwner} onClick={() => void execute(pending, true)}>إعادة إرسال نفس الطلب بعد التأكيد</button>
    </div>}
    {state && <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-amber-50 border rounded-xl p-4"><p className="text-sm">رصيد {state.isOwner ? 'خزينة المالك' : 'الخزينة'}</p><p className="text-2xl font-black break-words">{money(state.treasury)}</p></div>
        {state.isOwner && <div className="bg-slate-50 border rounded-xl p-4"><p className="text-sm">إجمالي العملات المصدرة</p><p className="text-2xl font-black break-words">{state.issued === null ? 'غير متاح' : money(state.issued)}</p></div>}
      </div>
      {state.isOwner && <>
        <div className="border rounded-xl p-3 space-y-3">
          <h3 className="font-black">إصدار عملات للخزينة</h3>
          <button type="button" className={buttonClass} disabled={blocked} onClick={() => setIssueOpen(!issueOpen)}>إصدار العملات</button>
          {issueOpen && <fieldset disabled={blocked} className="space-y-3">
            <p>الإصدار الاختباري: <strong>{money(STAGING_ISSUANCE)}</strong> عملة</p>
            <p className="text-xs break-all">مرجع الإصدار: {STAGING_ISSUANCE_REFERENCE}</p>
            <label className="block">سبب الإصدار<textarea className={inputClass} value={issueNote} maxLength={500} onChange={e => setIssueNote(e.target.value)} /></label>
            <button type="button" className={buttonClass} onClick={() => prepare('issue')}>مراجعة الإصدار</button>
          </fieldset>}
        </div>
        <fieldset disabled={blocked} className="border rounded-xl p-3 space-y-3">
          <legend className="font-black px-2">شحن مستخدم بواسطة ID</legend>
          <label className="block">ID المستخدم<input className={inputClass} inputMode="numeric" value={recipientId} onChange={e => { setRecipientId(e.target.value); setRecipient(null); }} /></label>
          <button type="button" className={buttonClass} onClick={() => void findRecipient()}>البحث والتحقق من المستلم</button>
          {recipient && <p role="status">المستلم: <strong>{recipient.display_name}</strong> — ID {recipient.public_id}</p>}
          <label className="block">عدد العملات<input className={inputClass} inputMode="numeric" value={coins} onChange={e => setCoins(e.target.value)} /></label>
          <label className="block">سبب الشحن<textarea className={inputClass} value={note} maxLength={500} onChange={e => setNote(e.target.value)} /></label>
          <p className="text-xs">من 1 إلى مليار عملة؛ تخصم من خزينة المالك.</p>
          <button type="button" className={buttonClass} disabled={!recipient} onClick={() => prepare('topup')}>مراجعة شحن المستخدم</button>
        </fieldset>
        <fieldset disabled={blocked} className="border rounded-xl p-3 space-y-3">
          <legend className="font-black px-2">تخصيص عملات لوكالة شحن</legend>
          <label className="block">الوكالة<select className={inputClass} value={agencyId} onChange={e => setAgencyId(e.target.value)}>
            <option value="">اختر وكالة فعالة</option>
            {state.agencies.filter(a => a.is_active && !a.is_own_treasury).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select></label>
          <label className="block">عدد العملات<input className={inputClass} inputMode="numeric" value={allocation} onChange={e => setAllocation(e.target.value)} /></label>
          <label className="block">سبب التخصيص<textarea className={inputClass} value={allocationNote} maxLength={500} onChange={e => setAllocationNote(e.target.value)} /></label>
          <button type="button" className={buttonClass} onClick={() => prepare('allocate')}>مراجعة تخصيص الوكالة</button>
        </fieldset>
        <div className="border rounded-xl p-3"><h3 className="font-black mb-2">أرصدة وكالات الشحن</h3>
          {!state.agencies.length && <p>لا توجد وكالات شحن متاحة</p>}
          {state.agencies.map(a => <div key={a.id} className="border-b py-2"><strong>{a.name}</strong> — {a.is_active ? 'فعالة' : 'متوقفة'}<p>رصيد خزينة مالك الوكالة: {a.treasury === null ? 'غير متاح' : money(a.treasury)}</p></div>)}
          <p className="text-xs mt-2">الوكالات التابعة لنفس المالك تستخدم خزينة مشتركة.</p>
        </div>
      </>}
      <div><h3 className="font-black">طلبات الشحن</h3>
        {!state.requests.length && <p className="text-sm">لا توجد طلبات</p>}
        {state.requests.map((r, i) => <p key={String(r.id ?? i)} className="border-b py-2 text-sm">{String(r.status)} — {String(r.coins)} عملة</p>)}
      </div>
      <div><h3 className="font-black">حركة الخزينة — آخر 100 قيد</h3>
        {!state.ledger.length && <p className="text-sm">لا توجد قيود</p>}
        {state.ledger.map((r, i) => <div key={String(r.id ?? i)} className="border-b py-2 text-sm">{String(r.amount)} — الرصيد: {String(r.balance_after)}<p className="text-xs break-all">مرجع العملية: {String(r.operation_id)}</p></div>)}
      </div>
      {state.isOwner && <div><h3 className="font-black">سجل العمليات — آخر 100 عملية</h3>
        {!history.length && <p className="text-sm">لا توجد عمليات</p>}
        {history.map(r => <div key={String(r.id)} className="border-b py-2 text-sm"><p>{String(r.operation)} — {String(r.status)} — {String(r.created_at)}</p><p className="text-xs break-all">المرجع: {String(r.id)}</p></div>)}
      </div>}
    </>}
    {confirmation && <div role="dialog" aria-modal="true" aria-labelledby="treasury-confirm-title" className="fixed inset-0 z-[100] bg-black/60 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-5 w-full max-w-lg space-y-4 max-h-[90vh] overflow-auto">
        <h3 id="treasury-confirm-title" className="font-black text-lg">تأكيد العملية المالية</h3>
        <p>{confirmation.label}</p><p className="text-xl font-black">{money(confirmation.coins)} عملة</p>
        <p className="break-words">السبب: {confirmation.note}</p>
        <p>{confirmation.action === 'issue' ? 'سيزيد رصيد الخزينة وإجمالي الإصدار.' : 'سيخصم المبلغ من خزينة المالك ويضاف إلى المستلم.'} لا يمكن التراجع عن العملية.</p>
        {confirmation.action === 'issue' && <label className="block">اكتب 900000000000 للتأكيد<input autoFocus className={inputClass} inputMode="numeric" value={typedAmount} onChange={e => setTypedAmount(e.target.value)} /></label>}
        <div className="flex gap-3"><button type="button" className={buttonClass} disabled={busy || (confirmation.action === 'issue' && typedAmount !== String(STAGING_ISSUANCE))} onClick={() => void execute(confirmation)}>تأكيد وتنفيذ</button>
          <button type="button" className="border rounded-xl p-3" disabled={busy} onClick={() => setConfirmation(null)}>إلغاء</button></div>
      </div>
    </div>}
  </section>;
};
