import { useEffect, useState } from 'react';
import { stagingBackend } from '../../../services/stagingBackend';

type Report = {
  enabled: boolean;
  release_approved: boolean;
  rounds: { starts_at: string; resolved_at: string | null; result: { outcome?: number; refunded?: boolean } | null;
    players: number; entries: number; staked: string; payouts: string }[];
  audit: { id: number; public_id: number | null; enabled: boolean; changed_at: string }[];
};

const date = new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Baghdad' });
const coins = (value: string) => BigInt(value).toLocaleString('en-US');
const foods = ['البرغر', 'البيتزا', 'الدجاج', 'اللحم', 'البطاطا', 'السلطة', 'السوشي', 'الكعكة'];

async function readAdmin(enabled?: boolean, signal?: AbortSignal): Promise<Report> {
  if (!stagingBackend) throw new Error('GAMES_SERVER_UNAVAILABLE');
  const request = stagingBackend.rpc('totichat_food_admin', enabled === undefined ? {} : { p_enabled: enabled });
  const { data, error } = await (signal ? request.abortSignal(signal) : request);
  if (error || !data) throw error ?? new Error('GAMES_SERVER_UNAVAILABLE');
  return data as Report;
}

export function AdminTotiFood() {
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void readAdmin(undefined, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setReport(data);
      setError('');
    }).catch(() => {
      if (!controller.signal.aborted) setError('تعذر تحميل حالة توتي للمأكولات');
    });
    return () => controller.abort();
  }, [revision]);

  async function toggle() {
    if (!report || busy) return;
    setBusy(true);
    setError('');
    try {
      setReport(await readAdmin(!report.enabled));
    } catch (failure) {
      setError((failure as { message?: string })?.message === 'GAMES_RELEASE_APPROVAL_REQUIRED'
        ? 'المشاركة المالية بانتظار اعتماد الإطلاق' : 'تعذر تأكيد تغيير حالة اللعبة. حدّث الحالة للتحقق');
    } finally {
      setBusy(false);
    }
  }

  return <section dir="rtl" className="space-y-3 rounded-xl border border-amber-300 p-3">
    <h3 className="font-bold">إدارة توتي للمأكولات</h3>
    <button type="button" className="underline" disabled={busy} onClick={() => setRevision(value => value + 1)}>تحديث</button>
    {error && <p role="alert">{error}</p>}
    {!report && !error && <p role="status">جارٍ تحميل حالة اللعبة…</p>}
    {report && <>
      <p>{report.enabled ? 'المشاركات مفعّلة' : 'المشاركات متوقفة'}</p>
      <button type="button" className="rounded border px-3 py-2" disabled={busy || (!report.enabled && !report.release_approved)}
        onClick={() => void toggle()}>{report.enabled ? 'إيقاف قبول المشاركات' : 'تفعيل قبول المشاركات'}</button>
      {!report.release_approved && <p>المشاركة المالية بانتظار اعتماد الإطلاق.</p>}
      <details>
        <summary>آخر عشر جولات</summary>
        {!report.rounds.length && <p>لا توجد جولات مسجلة.</p>}
        {report.rounds.map(round => <div key={round.starts_at} className="border-b py-2">
          <p><bdi>{date.format(new Date(round.starts_at))}</bdi> · {round.result?.refunded ? 'مستردة'
            : round.result?.outcome != null ? foods[round.result.outcome] : 'قيد التسوية'}</p>
          <p>{round.players} لاعب · {round.entries} مشاركة · {coins(round.staked)} كوينز مشاركات · {coins(round.payouts)} كوينز جوائز</p>
        </div>)}
      </details>
      <details>
        <summary>سجل التفعيل والإيقاف</summary>
        {!report.audit.length && <p>لا توجد إجراءات مسجلة.</p>}
        {report.audit.map(item => <p key={item.id} className="border-b py-2">
          {item.enabled ? 'تفعيل' : 'إيقاف'} · ID <bdi>{item.public_id ?? '—'}</bdi> · <bdi>{date.format(new Date(item.changed_at))}</bdi>
        </p>)}
      </details>
    </>}
  </section>;
}
