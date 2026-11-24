import { adminSections } from '../services/adminPermissions';
import { AdminAppBansPanel } from './AdminAppBansPanel';
import React, { useEffect, useState } from 'react';
import { AdminDecorationsPanel } from './AdminDecorationsPanel';
import { AdminBannersPanel } from './AdminBannersPanel';
import { AdminOffersPanel } from './AdminOffersPanel';
import { AdminOperationsPanel } from './AdminOperationsPanel';
import { AdminSpecialIdPanel } from './AdminSpecialIdPanel';
import { AdminRoomModerationPanel } from './AdminRoomModerationPanel';
import { AdminRoomAppealsPanel } from './AdminRoomAppealsPanel';
import { AdminCustomerServicePanel } from './AdminCustomerServicePanel';
import { AdminAgencyActionsPanel } from './AdminAgencyActionsPanel';
import { AdminAgencyRegistrationRequestsPanel } from './AdminAgencyRegistrationRequestsPanel';
import { AdminReportsPanel } from './AdminReportsPanel';
import { AdminUserReportsPanel } from './AdminUserReportsPanel';
import { AdminRechargePanel } from './AdminRechargePanel';
import { AdminStaffPanel } from './AdminStaffPanel';
import { AdminTesterBadgesPanel } from './AdminTesterBadgesPanel';
import { ArrowRight, RefreshCw, ShieldCheck, Users, Building2, Radio, Gift } from 'lucide-react';
import { fetchMyAdminAccess, fetchOwnerDashboardCounts, fetchOwnerDashboardRecent, type OwnerDashboardRecent, type AdminAccess, type OwnerDashboardCounts } from '../services/stagingBackend';

const AdminDailyRewardsReadOnly: React.FC = () => {
  const [schedule, setSchedule] = useState<number[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refreshInFlight = React.useRef(false);
  const refresh = async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setLoading(true);
    setError('');
    try {
      const { stagingBackend } = await import('../services/stagingBackend');
      if (!stagingBackend) throw new Error('الخادم غير متاح');
      const { data, error: rpcError } = await stagingBackend.rpc('daily_reward_status');
      if (rpcError) throw rpcError;
      const value = data as { schedule?: number[]; day?: number; coins?: number } | null;
      if (!value || !Array.isArray(value.schedule) || value.schedule.length !== 7 ||
          !value.schedule.every(n => Number.isSafeInteger(n) && n >= 0) ||
          !Number.isInteger(value.day) || value.day! < 1 || value.day! > 7 ||
          value.schedule[value.day! - 1] !== value.coins) throw new Error('بيانات المكافآت غير صالحة');
      setSchedule(value.schedule);
    } catch (cause) {
      setSchedule(null);
      setError(cause instanceof Error ? cause.message : 'تعذر تحميل المكافآت');
    } finally { refreshInFlight.current = false; setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    const onReturn = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onReturn);
    return () => document.removeEventListener('visibilitychange', onReturn);
  }, []);
  return <section className="space-y-3">
    <p className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">القيم الفعلية من الخادم، للعرض فقط. تعديل المكافآت غير مفعّل.</p>
    <button type="button" disabled={loading} onClick={() => void refresh()} className="rounded-xl bg-emerald-800 px-4 py-2 text-white disabled:opacity-50">{loading ? 'جارٍ التحميل...' : 'تحديث القيم'}</button>
    {loading && !schedule && <p role="status" className="text-slate-600">جارٍ قراءة القيم المعتمدة من الخادم...</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {schedule && <p role="status" className="text-xs text-emerald-800">تم تحميل جدول المكافآت من الخادم بنجاح.</p>}
    {schedule && <div className="grid grid-cols-2 gap-3">{schedule.map((coins, i) => <div key={i} className="rounded-xl border border-amber-200 bg-white p-3 text-center"><strong className="block text-emerald-900">اليوم {i + 1}</strong><span className="font-bold text-amber-800">{coins.toLocaleString('ar-IQ')} عملة</span></div>)}</div>}
  </section>;
};

type Props = { onClose: () => void };
export const AdminCenterView: React.FC<Props> = ({ onClose }) => {
  const [adminPage, setAdminPage] = useState<string | null>(null);
  useEffect(() => {
    const onBack = (event: Event) => {
      event.preventDefault();
      if (adminPage) setAdminPage(null);
      else onClose();
    };
    window.addEventListener('totichat:back:admin', onBack);
    return () => window.removeEventListener('totichat:back:admin', onBack);
  }, [adminPage, onClose]);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [counts, setCounts] = useState<OwnerDashboardCounts | null>(null);
  const [recent, setRecent] = useState<OwnerDashboardRecent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardErrors, setDashboardErrors] = useState({ counts: false, recent: false });
  const reload = async () => {
    setLoading(true); setError(null); setAccess(null); setCounts(null); setRecent(null);
    setDashboardErrors({ counts: false, recent: false });
    try {
      const verified = await fetchMyAdminAccess();
      if (!verified) throw new Error('ليس لديك تصريح لدخول مركز الإدارة');
      setAccess(verified);
      const all = verified.role === 'owner';
      const [totals, records] = await Promise.allSettled([
        all || verified.permissions.includes('stats.read') ? fetchOwnerDashboardCounts() : null,
        all || ['users.manage','agencies.read','rooms.read'].some(key => verified.permissions.includes(key))
          ? fetchOwnerDashboardRecent() : null,
      ]);
      if (totals.status === 'fulfilled') setCounts(totals.value);
      else console.warn('Admin dashboard totals unavailable:', totals.reason);
      if (records.status === 'fulfilled') setRecent(records.value);
      else console.warn('Admin dashboard recent records unavailable:', records.reason);
      setDashboardErrors({ counts: totals.status === 'rejected', recent: records.status === 'rejected' });
    } catch (err) {
      console.warn('Admin access verification failed:', err);
      setError(err instanceof Error ? err.message : 'تعذر التحقق من صلاحيات مركز الإدارة');
    } finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);
  useEffect(() => {
    const recheck = () => { if (document.visibilityState === 'visible') void reload(); };
    document.addEventListener('visibilitychange', recheck);
    return () => document.removeEventListener('visibilitychange', recheck);
  }, []);
  useEffect(() => {
    if (!access || access.role === 'owner') return;
    let active = true;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void fetchMyAdminAccess().then(verified => {
        if (!active) return;
        if (!verified || verified.role !== access.role ||
          verified.permissions.length !== access.permissions.length ||
          verified.permissions.some(permission => !access.permissions.includes(permission))) {
          void reload();
        }
      }).catch(() => {
        if (active) {
          setAccess(null);
          setAdminPage(null);
          setError('تعذر إعادة التحقق من صلاحياتك');
        }
      });
    }, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [access]);
  return (
    <div className="fixed inset-0 z-[100] bg-[#FDFBF7] text-slate-900 overflow-y-auto font-['Cairo',sans-serif]" dir="rtl">
      <header className="sticky top-0 bg-white/95 border-b border-amber-200 px-5 py-4 flex items-center justify-between z-10">
        <h1 className="font-black text-xl flex items-center gap-2"><ShieldCheck className="text-amber-700" /> مركز الإدارة</h1>
        <button type="button" onClick={onClose} className="rounded-xl border border-amber-200 px-3 py-2 flex items-center gap-2"><ArrowRight size={18}/> رجوع</button>
      </header>
      <main className="p-3 sm:p-5 max-w-3xl mx-auto pb-20">
        {loading && <p className="text-slate-500">جاري التحقق من صلاحياتك وقراءة البيانات...</p>}
        {error && <div role="alert" className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">{error}</div>}
        {!loading && access && <>
          {(() => {
            const tiles = adminSections.filter(item => access.role === 'owner' ||
              (!('ownerOnly' in item) && (!('superOnly' in item) || access.role === 'super_admin') &&
                access.permissions.includes(item.permission)))
              .map(item => ({ ...item, Icon: item.id === 'decorations' ? Gift : ShieldCheck }));
            return <div className="space-y-5">
              {!adminPage || !tiles.some(tile => tile.id === adminPage) ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tiles.map(({id,label,Icon}) => <button key={id} type="button" onClick={() => setAdminPage(id)}
                  className="rounded-2xl bg-white border border-amber-200 p-3 sm:p-4 min-h-24 sm:min-h-28 min-w-0 shadow-sm flex flex-col items-center justify-center gap-2 sm:gap-3 active:bg-amber-50">
                  <Icon size={28} className="text-amber-700" />
                  <span className="text-xs sm:text-sm font-bold text-center leading-snug break-words max-w-full">{label}</span>
                </button>)}
              </div> : <>
                <button type="button" onClick={() => setAdminPage(null)} className="rounded-xl bg-white border border-amber-200 px-4 py-2 text-amber-800 font-bold">رجوع للأقسام</button>
                <h2 className="font-black text-xl">{tiles.find(t => t.id === adminPage)?.label}</h2>
                {((adminPage === 'stats' && dashboardErrors.counts) ||
                  (['users', 'agencies', 'rooms'].includes(adminPage) && dashboardErrors.recent)) && (
                  <div role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
                    تعذر تحميل بيانات هذا القسم.
                    <button type="button" onClick={() => void reload()} className="ms-2 font-bold underline">إعادة المحاولة</button>
                  </div>
                )}
                {adminPage === 'stats' && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{([{label:'المستخدمون',value:counts?.users_count,Icon:Users},{label:'الوكالات',value:counts?.agencies_count,Icon:Building2},{label:'الغرف',value:counts?.rooms_count,Icon:Radio}]).map(({label,value,Icon}) => <div key={label} className="rounded-2xl bg-white border border-amber-200 p-3 text-center"><Icon className="mx-auto text-amber-700"/><strong className="block text-xl">{value ?? '—'}</strong><span className="text-xs">{label}</span></div>)}</div>}
                {['users','agencies','rooms'].includes(adminPage) && recent && <div className="rounded-2xl bg-white border border-amber-200 p-4 space-y-3">{recent[adminPage as 'users'|'agencies'|'rooms'].map((item,index) => <div key={item.id ?? index} className="flex justify-between border-b border-slate-100 py-2"><span>{item.display_name ?? item.name ?? item.title ?? 'بدون اسم'}</span><span dir="ltr">{item.public_id ?? '—'}</span></div>)}</div>}
                {adminPage === 'operations' && <AdminOperationsPanel />}
                {adminPage === 'ids' && <AdminSpecialIdPanel />}
                {adminPage === 'moderation' && <AdminRoomModerationPanel />}
                {adminPage === 'roomAppeals' && <AdminRoomAppealsPanel />}
                {adminPage === 'customerServiceAppeals' && <AdminCustomerServicePanel isOwner={access.role === 'owner'} canDecide={access.role === 'owner' || (access.role === 'super_admin' && access.permissions.includes('app_bans.manage'))} />}
                {adminPage === 'agencyActions' && <AdminAgencyActionsPanel />}
                {adminPage === 'agencyRegistrations' && <AdminAgencyRegistrationRequestsPanel />}
                {adminPage === 'reports' && <AdminUserReportsPanel />}
                {adminPage === 'financeReports' && <AdminReportsPanel />}
                {adminPage === 'recharge' && <AdminRechargePanel />}
                {adminPage === 'appBans' && <AdminAppBansPanel />}
                {adminPage === 'staff' && <AdminStaffPanel />}
                {adminPage === 'banners' && <AdminBannersPanel />}
                {adminPage === 'decorations' && <AdminDecorationsPanel />}
                {adminPage === 'offers' && <AdminOffersPanel />}
                {adminPage === 'dailyRewards' && <AdminDailyRewardsReadOnly />}
                {adminPage === 'testerBadges' && <AdminTesterBadgesPanel />}
              </>}
            </div>;
          })()}
        </>}
      </main>
    </div>
  );
};
