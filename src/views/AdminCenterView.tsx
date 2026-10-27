import React, { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw, ShieldCheck, Users, Building2, Radio, LockKeyhole } from 'lucide-react';
import { fetchMyAdminAccess, fetchOwnerDashboardCounts, type AdminAccess, type OwnerDashboardCounts } from '../services/stagingBackend';

type Props = { onClose: () };
export const AdminCenterView: React.FC<Props> = ({ onClose }) => {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [counts, setCounts] = useState<OwnerDashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = async () => {
    setLoading(true); setError(null); setAccess(null); setCounts(null);
    try {
      const verified = await fetchMyAdminAccess();
      if (!verified) throw new Error('ليس لديك تصريح لدخول مركز الإدارة');
      setAccess(verified);
      if (verified.role === 'owner') setCounts(await fetchOwnerDashboardCounts());
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
          <section className="rounded-2xl border border-amber-200 bg-white p-5">
            <h2 className="font-black mb-3">أقسام الإدارة</h2>
            <p className="text-sm text-slate-500 mb-4">الإحصائيات أعلاه حقيقية. العمليات التي تحتاج موافقات وتدقيقاً لم تُفعّل بعد.</p>
            {['إدارة المستخدمين','إدارة الوكالات','إدارة الغرف','الشحن والمحفظة','الصلاحيات','التقارير'].map(label=><div key={label} className="border-t border-amber-100 py-3 flex items-center justify-between text-sm"><span>{label}</span><span className="text-slate-400 flex items-center gap-1"><LockKeyhole size={14}/> قيد الربط الآمن</span></div>)}
          </section>
        </>}
      </main>
    </div>
  );
};
