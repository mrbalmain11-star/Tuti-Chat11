import React, { useEffect, useState } from 'react';
import { AdminBannersPanel } from './AdminBannersPanel';
import { AdminOperationsPanel } from './AdminOperationsPanel';
import { AdminSpecialIdPanel } from './AdminSpecialIdPanel';
import { ArrowRight, RefreshCw, ShieldCheck, Users, Building2, Radio, LockKeyhole } from 'lucide-react';
import { fetchMyAdminAccess, fetchOwnerDashboardCounts, fetchOwnerDashboardRecent, type OwnerDashboardRecent, type AdminAccess, type OwnerDashboardCounts } from '../services/stagingBackend';

type Props = { onClose: () => void };
export const AdminCenterView: React.FC<Props> = ({ onClose }) => {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [counts, setCounts] = useState<OwnerDashboardCounts | null>(null);
  const [recent, setRecent] = useState<OwnerDashboardRecent | null>(null);
  const [section, setSection] = useState<'users' | 'agencies' | 'rooms'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = async () => {
    setLoading(true); setError(null); setAccess(null); setCounts(null); setRecent(null);
    try {
      const verified = await fetchMyAdminAccess();
      if (!verified) throw new Error('ليس لديك تصريح لدخول مركز الإدارة');
      setAccess(verified);
      if (verified.role === 'owner') { const [totals, records] = await Promise.all([fetchOwnerDashboardCounts(), fetchOwnerDashboardRecent()]); setCounts(totals); setRecent(records); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الاتصال بالخادم');
    } finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);
  return (
    <div className="fixed inset-0 z-[100] bg-[#FDFBF7] text-slate-900 overflow-y-auto font-['Cairo',sans-serif]" dir="rtl">
      <header className="sticky top-0 bg-white/95 border-b border-amber-200 px-5 py-4 flex items-center justify-between z-10">
        <h1 className="font-black text-xl flex items-center gap-2"><ShieldCheck className="text-amber-700" /> مركز الإدارة</h1>
        <button type="button" onClick={onClose} className="rounded-xl border border-amber-200 px-3 py-2 flex items-center gap-2"><ArrowRight size={18}/> رجوع</button>
      </header>
      <main className="p-5 max-w-3xl mx-auto pb-20">
        {loading && <p className="text-slate-500">جاري التحقق من صلاحياتك وقراءة البيانات...</p>}
        {error && <div role="alert" className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">{error}</div>}
        {!loading && access && <>
          <div className="rounded-2xl bg-white border border-amber-200 p-5 mb-5 shadow-sm">
            <p className="text-sm text-slate-500">الصلاحية المعتمدة من الخادم</p>
            <p className="font-black text-xl">{access.role === 'owner' ? 'المالك' : access.role}</p>
            <button type="button" onClick={() => void reload()} className="text-amber-700 text-sm flex items-center gap-2 mt-3"><RefreshCw size={16}/> تحديث البيانات</button>
          </div>
          {access.role === 'owner' && <section className="grid grid-cols-3 gap-3 mb-6">
            {([{label:'المستخدمون',value:counts?.users_count,Icon:Users},{label:'الوكالات',value:counts?.agencies_count,Icon:Building2},{label:'الغرف',value:counts?.rooms_count,Icon:Radio}]).map(({label,value,Icon})=><div key={label} className="rounded-2xl bg-white border border-amber-200 p-3 text-center shadow-sm"><Icon className="mx-auto mb-2 text-amber-700" size={22}/><div className="font-black text-xl">{value ?? '—'}</div><div className="text-xs text-slate-500">{label}</div></div>)}
          </section>}
          {access.role === 'owner' && recent && <section className="rounded-2xl border border-amber-200 bg-white p-4 mb-5">
            <h2 className="font-black mb-3">السجلات الأخيرة</h2>
            <div className="flex gap-2 mb-4">
              {([{key:'users',label:'المستخدمون'},{key:'agencies',label:'الوكالات'},{key:'rooms',label:'الغرف'}] as const).map(item =>
                <button type="button" key={item.key} onClick={() => setSection(item.key)} className={`rounded-xl px-3 py-2 text-sm border ${section === item.key ? 'bg-amber-100 border-amber-400 font-bold' : 'border-slate-200'}`}>{item.label}</button>
              )}
            </div>
            {recent[section].length === 0 ? <p className="text-sm text-slate-500">لا توجد سجلات في هذا القسم.</p> :
              <div className="divide-y divide-slate-100">{recent[section].map((item,index) =>
                <div key={item.id ?? String(item.public_id ?? index)} className="py-3 flex justify-between items-center gap-3 text-sm">
                  <span className="font-semibold break-words">{item.display_name ?? item.name ?? item.title ?? 'بدون اسم'}</span>
                  <span className="text-slate-500 shrink-0" dir="ltr">{item.public_id ?? item.id?.slice(0,8) ?? '—'}</span>
                </div>
              )}</div>}
          </section>}
          {access.role === 'owner' && <AdminOperationsPanel />}
          {access.role === 'owner' && <AdminSpecialIdPanel />}
          {access.role === 'owner' && <AdminBannersPanel />}
          <section className="rounded-2xl border border-amber-200 bg-white p-5">
            <h2 className="font-black mb-2">مركز العمليات</h2>
            <p className="text-sm text-slate-600">استخدم تبويبات إدارة التطبيق أعلاه لاستعراض المستخدمين والغرف والوكالات والصلاحيات وسجل التدقيق. عمليات الحظر والشحن وتعديل الصلاحيات لن تُفعّل إلا بعد ربطها بإجراءات خادم آمنة.</p>
          </section>
        </>}
      </main>
    </div>
  );
};
