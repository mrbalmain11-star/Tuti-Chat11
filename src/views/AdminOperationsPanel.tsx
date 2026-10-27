import React, { useEffect, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

const tabs = [
  { key: 'users', label: 'المستخدمون', rpc: 'phase6_admin_directory' },
  { key: 'rooms', label: 'الغرف', rpc: 'phase6_admin_directory' },
  { key: 'host_agencies', label: 'وكالات المضيفين', rpc: 'phase6_admin_management_page' },
  { key: 'recharge_agencies', label: 'وكالات الشحن', rpc: 'phase6_admin_management_page' },
  { key: 'registrations', label: 'طلبات الوكالات', rpc: 'phase6_admin_management_page' },
  { key: 'agency_transfers', label: 'طلبات الانضمام', rpc: 'phase6_admin_management_page' },
  { key: 'staff', label: 'الصلاحيات', rpc: 'phase6_admin_management_page' },
  { key: 'audit', label: 'سجل التدقيق', rpc: 'phase6_admin_management_page' },
] as const;
type Key = typeof tabs[number]['key'];
type Entry = Record<string, unknown>;
export const AdminOperationsPanel: React.FC = () => {
  const [tab, setTab] = useState<Key>('users');
  const [rows, setRows] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setBusy(true); setError(''); setRows([]);
      try {
        if (!stagingBackend) throw new Error('الخادم غير متصل');
        const isDirectory = tab === 'users' || tab === 'rooms';
        const { data, error: rpcError } = isDirectory
          ? await stagingBackend.rpc('phase6_admin_directory', { p_kind: tab, p_query: appliedQuery, p_offset: offset, p_limit: 20 })
          : await stagingBackend.rpc('phase6_admin_management_page', { p_kind: tab, p_offset: offset, p_limit: 20 });
        if (rpcError) throw rpcError;
        if (!data || !Array.isArray(data.rows)) throw new Error('استجابة غير صالحة من الخادم');
        if (active) { setRows(data.rows as Entry[]); setTotal(Number(data.total) || 0); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : String(e)); }
      finally { if (active) setBusy(false); }
    };
    void load();
    return () => { active = false; };
  }, [tab, offset, appliedQuery, revision]);
  const switchTab = (key: Key) => { setTab(key); setOffset(0); setQuery(''); setAppliedQuery(''); };
  return <section className="bg-white border border-amber-200 rounded-2xl p-4 mb-5">
    <h2 className="font-black text-lg mb-3">إدارة التطبيق — بيانات مباشرة</h2>
    <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
      {tabs.map(t => <button key={t.key} type="button" onClick={() => switchTab(t.key)} className={`shrink-0 rounded-xl border px-3 py-2 text-sm ${tab === t.key ? 'bg-amber-100 border-amber-500 font-bold' : 'border-slate-200'}`}>{t.label}</button>)}
    </div>
    {(tab === 'users' || tab === 'rooms') && <form onSubmit={e => { e.preventDefault(); setOffset(0); setAppliedQuery(query.trim()); }} className="flex gap-2 mb-3">
      <input className="border rounded-xl p-2 flex-1 min-w-0" value={query} maxLength={60} onChange={e => setQuery(e.target.value)} placeholder="بحث بالاسم" />
      <button type="submit" className="border border-amber-400 rounded-xl px-3">بحث</button>
    </form>}
    <div className="flex justify-between items-center mb-2 text-sm"><span>النتائج: {total}</span><button type="button" onClick={() => setRevision(x => x + 1)} className="text-amber-700">تحديث</button></div>
    {busy && <p className="text-slate-500">جاري تحميل البيانات...</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!busy && !error && rows.length === 0 && <p className="text-slate-500">لا توجد سجلات.</p>}
    <div className="divide-y divide-slate-100">{rows.map((row, index) => <div key={String(row.id ?? row.user_id ?? index)} className="py-3">
      <p className="font-bold text-sm break-words">{String(row.display_name ?? row.title ?? row.name ?? row.action ?? row.role ?? row.status ?? 'سجل')}</p>
      <div className="text-xs text-slate-500 mt-1 break-all" dir="ltr">{String(row.id ?? row.user_id ?? row.actor_id ?? '')}</div>
      {row.status != null && <p className="text-xs text-slate-500 mt-1">الحالة: {String(row.status)}</p>}
      {row.is_active != null && <p className="text-xs text-slate-500 mt-1">{row.is_active ? 'فعّال' : 'غير فعّال'}</p>}
    </div>)}</div>
    <div className="flex justify-between items-center mt-4">
      <button type="button" disabled={busy || offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))} className="border rounded-lg px-3 py-2 disabled:opacity-30">السابق</button>
      <span className="text-sm text-slate-500">{total ? `${offset + 1}–${Math.min(total, offset + 20)} من ${total}` : '0'}</span>
      <button type="button" disabled={busy || offset + 20 >= total} onClick={() => setOffset(offset + 20)} className="border rounded-lg px-3 py-2 disabled:opacity-30">التالي</button>
    </div>
    <p className="text-xs text-slate-500 mt-4">هذه الأقسام تعرض سجلات الخادم الحقيقية. التغييرات الحساسة تحتاج إجراءات معتمدة ومراجعة صلاحيات منفصلة.</p>
  </section>;
};
