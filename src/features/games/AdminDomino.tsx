import { useCallback, useEffect, useState } from 'react';
import { loadDominoAdmin, type DominoAdminSnapshot } from './api';

const statuses = { waiting: 'انتظار', playing: 'جارية', finished: 'مكتملة', cancelled: 'ملغاة' };

export function AdminDomino() {
  const [report, setReport] = useState<DominoAdminSnapshot>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async (enabled?: boolean) => {
    setBusy(true);
    try {
      setReport(await loadDominoAdmin(enabled));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return <section dir="rtl" className="space-y-3 rounded-xl border border-amber-300 p-3">
    <h3 className="font-bold">إدارة الدومينو</h3>
    <button type="button" disabled={busy} className="underline" onClick={() => void refresh()}>تحديث الطاولات</button>
    {error && <p role="alert">تعذر تحميل طاولات الدومينو أو تأكيد العملية.</p>}
    {report && <>
      <button type="button" disabled={busy} className="block rounded bg-emerald-900 px-3 py-2 text-white"
        onClick={() => void refresh(!report.enabled)}>{report.enabled ? 'إيقاف إنشاء الطاولات والانضمام' : 'تفعيل الطاولات'}</button>
      <p>بانتظار لاعب {report.waiting} · جارية {report.playing} · مكتملة {report.finished}</p>
      <details><summary>أحدث الطاولات والنتائج</summary>
        {!report.recent.length && <p>لا توجد طاولات.</p>}
        {report.recent.map(table => <p key={table.id} className="break-words py-1">
          {new Date(table.updated_at).toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' })}
          {' · '}{statuses[table.status]} · {table.private ? 'خاصة' : 'عامة'}
          {' · '}{table.host.name} ({table.host.public_id ?? '—'})
          {table.guest && ` · ${table.guest.name} (${table.guest.public_id ?? '—'})`}
          {table.status === 'finished' && (table.winner ? ` · الفائز ${table.winner.name}` : ' · تعادل')}
        </p>)}
      </details>
    </>}
  </section>;
}
