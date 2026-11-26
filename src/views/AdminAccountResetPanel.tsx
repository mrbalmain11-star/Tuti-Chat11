import { useRef, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';
import { integerDigits } from '../utils/digits';

type Preview = {
  id: string; public_id: number; name: string; coins: number; diamonds: number;
  wealth_xp: number; charm_xp: number; frames: number;
};
type Intent = { p_target: string; p_public_id: number; p_preview: Preview; p_reason: string; p_request: string };
const format = new Intl.NumberFormat('en-US');
const errors: Record<string, string> = {
  ACCOUNT_RESET_OWNER_REQUIRED: 'التصفير متاح للمالك بعد التحقق من الجلسة.',
  ACCOUNT_RESET_PREVIEW_CHANGED: 'تغيّرت بيانات الحساب. حمّل المعاينة من جديد.',
  ACCOUNT_RESET_PENDING_GAME: 'الحساب عنده مشاركة ألعاب معلّقة. انتظر تسويتها.',
  ACCOUNT_RESET_CONFLICT: 'بيانات الطلب المحفوظ غير مطابقة.',
  ACCOUNT_RESET_INPUT: 'تأكد من ID الحساب وسبب التصفير.',
  ACCOUNT_RESET_TREASURY_MISSING: 'خزينة المالك غير متاحة.',
};

export function AdminAccountResetPanel() {
  const [id, setId] = useState('');
  const [preview, setPreview] = useState<Preview>();
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [intent, setIntent] = useState<Intent>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);

  async function load() {
    if (lock.current || id.length !== 6 || !stagingBackend) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setPreview(undefined);
    setConfirmation('');
    try {
      const { data, error: failure } = await stagingBackend.rpc('owner_account_reset_preview', { p_public_id: Number(id) });
      if (failure) throw failure;
      if (!data) { setError('ما لقينا حساب بمحفظة بهذا الرقم.'); return; }
      setPreview(data as Preview);
    } catch (failure) {
      setError(errors[(failure as Error).message] ?? 'تعذر تحميل معاينة الحساب.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function reset() {
    if (lock.current || !preview || !stagingBackend) return;
    if (!intent && (confirmation !== String(preview.public_id) || reason.trim().length < 10)) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const request = intent ?? {
      p_target: preview.id, p_public_id: preview.public_id, p_preview: preview,
      p_reason: reason.trim(), p_request: crypto.randomUUID(),
    };
    setIntent(request);
    try {
      const { data, error: failure } = await stagingBackend.rpc('owner_reset_test_account', request);
      if (failure) throw failure;
      if (data?.status !== 'completed' || data?.target !== request.p_target) throw new Error('Unmatched reset receipt');
      setIntent(undefined);
      setPreview(undefined);
      setConfirmation('');
      setReason('');
      setNotice('تم تصفير الحساب. رقم العملية: ' + data.id);
      window.dispatchEvent(new Event('totichat:wallet-changed'));
      window.dispatchEvent(new Event('totichat:profile-decoration-changed'));
    } catch (failure) {
      const message = (failure as Error).message;
      if (errors[message]) {
        setIntent(undefined);
        if (message === 'ACCOUNT_RESET_PREVIEW_CHANGED') setPreview(undefined);
        setError(errors[message]);
      } else {
        setError('تعذر تأكيد النتيجة. أعد التحقق بنفس الطلب.');
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return <section dir="rtl" className="space-y-3 rounded-2xl border border-amber-200 bg-white p-4">
    <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); void load(); }}>
      <label className="min-w-0 flex-1">ID الحساب
        <input dir="ltr" inputMode="numeric" className="block w-full rounded-xl border p-2"
          value={id} maxLength={6} disabled={busy || !!intent}
          onChange={event => { setId(integerDigits(event.target.value)); setPreview(undefined); setNotice(''); setError(''); }} />
      </label>
      <button disabled={busy || !!intent || id.length !== 6} className="rounded-xl bg-emerald-800 px-4 py-2 font-bold text-white disabled:opacity-50">معاينة</button>
    </form>
    {preview && <>
      <h3 className="font-bold">{preview.name} · <bdi>{preview.public_id}</bdi></h3>
      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-emerald-50 p-3 text-sm">
        {([['كوينز',preview.coins],['ماس',preview.diamonds],['خبرة الثروة',preview.wealth_xp],
          ['خبرة السحر',preview.charm_xp],['الإطارات',preview.frames]] as const).map(([label,value]) =>
          <div key={label}><dt>{label}</dt><dd className="font-bold"><bdi>{format.format(value)}</bdi></dd></div>)}
      </dl>
      <p className="text-sm">التصفير يرجّع الكوينز لخزينة التطبيق، ويشطب الماس وخبرة المستويات الشخصية والإطارات الشخصية.</p>
      <label className="block">سبب التصفير
        <textarea className="block w-full rounded-xl border p-2" value={reason} maxLength={500}
          disabled={busy || !!intent} onChange={event => setReason(event.target.value)} />
      </label>
      <label className="block">أعد كتابة ID الحساب للتأكيد
        <input dir="ltr" inputMode="numeric" maxLength={6} className="block w-full rounded-xl border p-2"
          value={confirmation} disabled={busy || !!intent} onChange={event => setConfirmation(integerDigits(event.target.value))} />
      </label>
      <button type="button" className="w-full rounded-xl bg-rose-800 p-2 font-bold text-white disabled:opacity-50"
        disabled={busy || (!intent && (confirmation !== String(preview.public_id) || reason.trim().length < 10))}
        onClick={() => void reset()}>{intent ? 'التحقق من طلب التصفير' : 'تصفير الحساب'}</button>
    </>}
    {notice && <p role="status" className="break-words text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="text-rose-800">{error}</p>}
  </section>;
}
