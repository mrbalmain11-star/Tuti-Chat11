import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';

type Account = { id: number; name: string | null; until: string | null };
type Decision = { account: Account; action: 'ban' | 'lift' };
const pageSize = 25;
const durations = [
  [1, 'ساعة'], [6, '٦ ساعات'], [24, 'يوم'], [72, '٣ أيام'],
  [168, '٧ أيام'], [336, '١٤ يوم'], [720, '٣٠ يوم'], [2160, '٩٠ يوم'], [0, 'دائم'],
] as const;

function banExpiry(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() >= 9999) return 'باند دائم';
  return 'الباند ينتهي ' + date.toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' });
}

export function AdminAppBansPanel() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Account[]>([]);
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(24);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(false);
      setRows([]);
      try {
        if (!stagingBackend) throw new Error('Backend unavailable');
        const { data, error } = query
          ? await stagingBackend.rpc('search_app_ban_accounts', { p_query: query, p_offset: offset })
          : await stagingBackend.rpc('admin_app_bans', { p_action: 'list', p_offset: offset });
        if (error || !Array.isArray(data)) throw error ?? new Error('Invalid account list');
        if (active) setRows(data);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [query, offset, revision]);

  function startSearch(value: string) {
    setNotice('');
    setSelected(null);
    setOffset(0);
    setQuery(value);
    setRevision(count => count + 1);
  }

  async function confirmDecision() {
    if (!selected || busy || !stagingBackend || reason.trim().length < 5) return;
    const { account, action } = selected;
    setBusy(true);
    try {
      const args = { p_public_id: account.id, p_reason: reason.trim() };
      const { error } = action === 'ban'
        ? await stagingBackend.rpc('issue_app_ban', { ...args, p_duration_hours: duration })
        : await stagingBackend.rpc('admin_app_bans', {
          ...args, p_action: 'lift', p_expected_until: account.until,
        });
      if (error) throw error;
      setNotice(action === 'ban' ? 'تم حظر المستخدم من التطبيق وتسجيل القرار' : 'تم فك الباند وتسجيل القرار');
      setSelected(null);
      if (action === 'lift' && !query && rows.length === 1 && offset > 0) setOffset(value => value - pageSize);
      setRevision(value => value + 1);
    } catch (error) {
      const code = (error as { message?: string }).message;
      setNotice(code === 'PROTECTED_BAN_ACCOUNT' ? 'هذا الحساب محمي من الحظر'
        : code === 'BAN_CHANGED' ? 'تغيّرت حالة الحساب. حدّثت النتائج، اختار الإجراء مجدداً'
        : 'تعذر تنفيذ القرار');
      if (code === 'BAN_CHANGED') { setSelected(null); setRevision(value => value + 1); }
    } finally { setBusy(false); }
  }

  const button = 'rounded-xl border px-3 py-2 text-sm font-bold disabled:opacity-40';
  return <section className="space-y-3">
    <form className="space-y-2 rounded-2xl border border-amber-200 bg-white p-4" onSubmit={event => {
      event.preventDefault();
      const value = input.trim().replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) % 16));
      if (value.length >= 2) startSearch(value);
    }}>
      <label htmlFor="app-ban-account-search" className="text-sm font-bold">ابحث عن مستخدم</label>
      <div className="flex flex-wrap gap-2">
        <input id="app-ban-account-search" value={input} onChange={event => setInput(event.target.value)}
          dir="auto" placeholder="اسم المستخدم أو ID" maxLength={60}
          className="min-w-0 flex-1 rounded-xl border p-2" />
        <button className={button + ' inline-flex items-center gap-1'} disabled={busy || input.trim().length < 2}>
          <Search size={16} aria-hidden="true" /> بحث
        </button>
      </div>
      {query && <button type="button" className={button} disabled={busy}
        onClick={() => { setInput(''); startSearch(''); }}>عرض المحظورين</button>}
    </form>
    {notice && <p role="status">{notice}</p>}
    {loading && <p role="status">جاري التحميل…</p>}
    {loadError && <div role="alert">تعذر تحميل الحسابات <button type="button" className={button}
      onClick={() => setRevision(value => value + 1)}>إعادة المحاولة</button></div>}
    {!loading && !loadError && !rows.length && <p>{query ? 'ماكو نتائج مطابقة' : 'ماكو حسابات محظورة بهذه الصفحة'}</p>}
    {rows.map(row => <article key={row.id} className="rounded-2xl border border-amber-200 bg-white p-4">
      <p className="font-bold">{row.name || 'مستخدم'} · <bdi>{row.id}</bdi></p>
      <p className="text-sm text-slate-600">{row.until ? banExpiry(row.until) : 'الحساب غير محظور'}</p>
      {selected?.account.id === row.id ? <div className="mt-2 space-y-2">
        {selected.action === 'ban' && <label className="block text-sm">مدة الباند من التطبيق
          <select value={duration} onChange={event => setDuration(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border p-2" disabled={busy}>
            {durations.map(([hours, label]) => <option key={hours} value={hours}>{label}</option>)}
          </select>
        </label>}
        <label className="block text-sm">{selected.action === 'ban' ? 'سبب الحظر' : 'سبب فك الباند'}
          <textarea value={reason} maxLength={500} onChange={event => setReason(event.target.value)}
            className="mt-1 w-full rounded-xl border p-2" disabled={busy} />
        </label>
        <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void confirmDecision()}
          className={button + (selected.action === 'ban' ? ' bg-red-800 text-white' : ' bg-emerald-800 text-white')}>
          {selected.action === 'ban' ? 'تأكيد الباند من التطبيق' : 'تأكيد فك الباند'}
        </button>
        <button type="button" disabled={busy} onClick={() => setSelected(null)} className="px-4 py-2">إلغاء</button>
      </div> : <div className="mt-2 flex gap-2">
        <button type="button" className={button} disabled={busy || Boolean(row.until)}
          onClick={() => { setSelected({ account: row, action: 'ban' }); setReason(''); setDuration(24); }}>حظر المستخدم</button>
        <button type="button" className={button} disabled={busy || !row.until}
          onClick={() => { setSelected({ account: row, action: 'lift' }); setReason(''); }}>فك الحظر</button>
      </div>}
    </article>)}
    <div className="flex gap-3">
      <button type="button" className={button} disabled={offset === 0 || loading || busy}
        onClick={() => { setSelected(null); setOffset(offset - pageSize); }}>السابق</button>
      <button type="button" className={button} disabled={rows.length < pageSize || loading || busy}
        onClick={() => { setSelected(null); setOffset(offset + pageSize); }}>التالي</button>
    </div>
  </section>;
}
