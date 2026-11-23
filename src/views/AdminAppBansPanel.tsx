import { useEffect, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

type AppBan = { id: number; name: string; until: string };
const pageSize = 25;

export function AdminAppBansPanel() {
  const [rows, setRows] = useState<AppBan[]>([]);
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppBan | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setRows([]);
    if (!stagingBackend) { setLoading(false); setNotice('الخادم غير متصل'); return; }
    void Promise.resolve(stagingBackend.rpc('admin_app_bans', { p_action: 'list', p_offset: offset }))
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setNotice('تعذر تحميل المحظورين');
        else setRows(Array.isArray(data) ? data : []);
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset, revision]);

  const lift = async () => {
    if (!selected || busy || !stagingBackend || reason.trim().length < 5) return;
    setBusy(true);
    try {
      const { error } = await stagingBackend.rpc('admin_app_bans', {
        p_action: 'lift', p_public_id: selected.id, p_expected_until: selected.until, p_reason: reason.trim(),
      });
      setNotice(error ? 'تعذر رفع الحظر. راجع حالة الحساب وحاول مجدداً' : 'تم رفع الحظر وتسجيل القرار');
      setSelected(null);
      if (rows.length === 1 && offset > 0) setOffset(value => value - pageSize);
      setRevision(value => value + 1);
    } finally { setBusy(false); }
  };

  return <section className="space-y-3">
    {notice && <p role="status">{notice}</p>}
    {loading && <p>جاري التحميل…</p>}
    {!loading && rows.length === 0 && <p>ماكو حسابات محظورة بهذه الصفحة.</p>}
    {rows.map(row => <article key={row.id} className="rounded-2xl border border-amber-200 bg-white p-4">
      <p className="font-bold">{row.name} · <bdi>{row.id}</bdi></p>
      <p className="text-sm text-slate-600">{Date.parse(row.until) < 8.64e15
        ? new Date(row.until).toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' }) : 'دائم'}</p>
      {selected?.id === row.id ? <div className="mt-2 space-y-2">
        <label className="block text-sm">سبب رفع الحظر
          <textarea value={reason} maxLength={500} onChange={event => setReason(event.target.value)}
            className="mt-1 w-full rounded-xl border p-2" />
        </label>
        <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void lift()}
          className="rounded-xl bg-emerald-800 px-4 py-2 text-white disabled:opacity-40">تأكيد رفع الحظر</button>
        <button type="button" disabled={busy} onClick={() => setSelected(null)} className="px-4 py-2">إلغاء</button>
      </div> : <button type="button" disabled={busy} className="mt-2 rounded-xl border px-3 py-2"
        onClick={() => { setSelected(row); setReason(''); }}>رفع الحظر</button>}
    </article>)}
    <div className="flex gap-3">
      <button type="button" disabled={offset === 0 || loading || busy} onClick={() => { setSelected(null); setOffset(offset - pageSize); }} className="disabled:opacity-40">السابق</button>
      <button type="button" disabled={rows.length < pageSize || loading || busy} onClick={() => { setSelected(null); setOffset(offset + pageSize); }} className="disabled:opacity-40">التالي</button>
    </div>
  </section>;
}
