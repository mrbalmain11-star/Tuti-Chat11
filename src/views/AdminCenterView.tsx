import { createPortal } from 'react-dom';
import { EpicGiftArtwork } from '../components/EpicGiftArtwork';
import './royal-admin.css';
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
import { AdminFinance } from '../features/finance/AdminFinance';
import { SupplyReview } from '../features/rechargeAgent/SupplyReview';
import { AdminAccountResetPanel } from './AdminAccountResetPanel';
import { AdminTotiFood } from '../features/games/toti-food/AdminTotiFood';
import { AdminDomino } from '../features/games/AdminDomino';
import { AdminEmbeddedGamesPanel } from './AdminEmbeddedGamesPanel';
import { AdminGamesTreasuryPanel } from './AdminGamesTreasuryPanel';
import { AdminStaffPanel } from './AdminStaffPanel';
import { AdminTesterBadgesPanel } from './AdminTesterBadgesPanel';
import { ArrowRight, RefreshCw, ShieldCheck, Users, Building2, Radio, Gift, BarChart3, UserCog,
  ScrollText, BadgeCheck, Gavel, ClipboardCheck, Ban, Handshake, UserPlus, Flag, Wallet, Coins, Gamepad2,
  KeyRound, Image, Sparkles, CalendarCheck, Award } from 'lucide-react';
import { fetchMyAdminAccess, fetchOwnerDashboardRecent, type OwnerDashboardRecent, type AdminAccess, stagingBackend } from '../services/stagingBackend';

const sectionIcons = {
  stats: BarChart3, users: Users, accountReset: UserCog, agencies: Building2, rooms: Radio,
  operations: ScrollText, ids: BadgeCheck, moderation: ShieldCheck, roomAppeals: Gavel,
  customerServiceAppeals: ClipboardCheck, appBans: Ban, agencyActions: Handshake,
  agencyRegistrations: UserPlus, reports: Flag, financeReports: Wallet, agencySupplyRequests: Coins,
  gamesTreasury: Gamepad2, staff: KeyRound, banners: Image, decorations: Gift, offers: Sparkles,
  dailyRewards: CalendarCheck, testerBadges: Award,
} satisfies Record<(typeof adminSections)[number]['id'], typeof ShieldCheck>;

const statistics = [
  ['users','المستخدمون',Users,'users'],['online','المتصلون الآن',Users,null],
  ['banned','المحظورون',Ban,'appBans'],['rooms','الغرف',Radio,'rooms'],
  ['activeRooms','الغرف التي فيها أعضاء',Radio,null],['agencies','الوكالات',Building2,'agencies'],
  ['agents','وكلاء الشحن المعتمدون',Handshake,'agencies'],['gifts','عمليات الإهداء المكتملة',Gift,null],
  ['recharges','عمليات الشحن المكتملة',Coins,null],['financial','العمليات المالية المكتملة',Wallet,'financeReports'],
  ['audit','السجلات الإدارية والأمنية',ScrollText,'operations'],
] as const;
type StatKey = (typeof statistics)[number][0];

async function loadActivitySummary(): Promise<Record<StatKey, number>> {
  if (!stagingBackend) throw new Error('الخادم غير متاح');
  const { data,error } = await stagingBackend.rpc('totichat_admin_activity_summary');
  if (error || !data || !statistics.every(([key])=>Number.isSafeInteger(data[key]) && data[key]>=0)) {
    throw error ?? new Error('تعذر قراءة الإحصائيات');
  }
  return data;
}

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
    {schedule && <div className="grid grid-cols-2 gap-3">{schedule.map((coins, i) => <div key={i} className="rounded-xl border border-amber-200 bg-white p-3 text-center"><strong className="block text-emerald-900">اليوم {i + 1}</strong><span className="font-bold text-amber-800">{coins.toLocaleString('ar-IQ-u-nu-latn')} عملة</span></div>)}</div>}
  </section>;
};

function AdminRecentRecords({ items }: { items: OwnerDashboardRecent['rooms'] }) {
  if (items.length === 0) return <p role="status" className="text-slate-600">لا توجد سجلات في هذا القسم.</p>;
  return <section className="rounded-2xl border border-amber-200 bg-white p-4">
    <h3 className="mb-2 text-sm font-bold text-slate-700">أحدث السجلات</h3>
    {items.map((item, index) => <div key={item.id ?? index} className="flex gap-2 justify-between border-b border-slate-100 py-2 last:border-0">
      <div className="min-w-0">
        <strong className="break-words">{item.display_name ?? item.name ?? item.title ?? 'بدون اسم'}</strong>
        {typeof item.is_private === 'boolean' && <p className="text-xs text-slate-500">{item.is_private ? 'غرفة خاصة' : 'غرفة عامة'}</p>}
        {typeof item.is_active === 'boolean' && <p className="text-xs text-slate-500">{item.is_active ? 'فعّالة' : 'غير فعّالة'}</p>}
      </div>
      {item.public_id != null && <bdi className="shrink-0 tabular-nums">ID: {item.public_id}</bdi>}
    </div>)}
  </section>;
}

type Props = { onClose: () => void };
export const AdminCenterView: React.FC<Props> = ({ onClose }) => {
  const [financeActor, setFinanceActor] = useState<string>();
  const [adminPage, setAdminPage] = useState<string | null>(null);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [counts, setCounts] = useState<Record<StatKey,number> | null>(null);
  const reloadVersion = React.useRef(0);
  const [recent, setRecent] = useState<OwnerDashboardRecent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardErrors, setDashboardErrors] = useState({ counts: false, recent: false });
  const reload = async () => {
    const version=++reloadVersion.current;
    setLoading(true); setError(null); setAccess(null); setCounts(null); setRecent(null);
    setDashboardErrors({ counts: false, recent: false });
    try {
      const verified = await fetchMyAdminAccess();
      if (version!==reloadVersion.current) return;
      if (!verified) throw new Error('ليس لديك تصريح لدخول مركز الإدارة');
      setAccess(verified);
      void stagingBackend?.auth.getUser().then(({data})=>{if(version===reloadVersion.current)setFinanceActor(data.user?.id);});
      const all = verified.role === 'owner';
      const [totals, records] = await Promise.allSettled([
        all || verified.permissions.includes('stats.read') ? loadActivitySummary() : null,
        all || ['users.manage','agencies.read','rooms.read'].some(key => verified.permissions.includes(key))
          ? fetchOwnerDashboardRecent() : null,
      ]);
      if (version!==reloadVersion.current) return;
      if (totals.status === 'fulfilled') setCounts(totals.value);
      else console.warn('Admin dashboard totals unavailable:', totals.reason);
      if (records.status === 'fulfilled') setRecent(records.value);
      else console.warn('Admin dashboard recent records unavailable:', records.reason);
      setDashboardErrors({ counts: totals.status === 'rejected' || ((all || verified.permissions.includes('stats.read')) && !totals.value), recent: records.status === 'rejected' });
    } catch (err) {
      console.warn('Admin access verification failed:', err);
      if (version!==reloadVersion.current) return;
      setError(err instanceof Error ? err.message : 'تعذر التحقق من صلاحيات مركز الإدارة');
    } finally { if(version===reloadVersion.current)setLoading(false); }
  };
  useEffect(() => { void reload(); return ()=>{++reloadVersion.current;}; }, []);
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
  const [navHeight,setNavHeight] = useState(72);
  useEffect(()=>{
    const nav = document.querySelector('nav.fixed.bottom-0');
    if (!nav) return;
    const resize = () => setNavHeight(Math.ceil(nav.getBoundingClientRect().height));
    const observer = new ResizeObserver(resize);
    resize(); observer.observe(nav);
    return ()=>observer.disconnect();
  },[]);
  return createPortal(
    <div style={{bottom:navHeight}} className="royal-admin fixed inset-x-0 top-0 z-[39] overflow-y-auto font-['Cairo',sans-serif]" dir="rtl">
      <header className="royal-admin-header">
        <button type="button" onClick={onClose} className="royal-admin-back"><ArrowRight size={16}/> رجوع</button>
        <div className="royal-admin-emblem" aria-hidden="true"><EpicGiftArtwork kind="falcon"/></div>
        <h1>مركز الإدارة</h1><p>TotiChat</p>
      </header>
      <main className="p-3 sm:p-5 max-w-3xl mx-auto pb-20">
        {loading && <p className="text-slate-500">جاري التحقق من صلاحياتك وقراءة البيانات...</p>}
        {error && <div role="alert" className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">{error}</div>}
        {!loading && access && <>
          {(() => {
            const tiles = adminSections.filter(item => access.role === 'owner' ||
              (!('ownerOnly' in item) && (!('superOnly' in item) || access.role === 'super_admin') &&
                access.permissions.includes(item.permission)))
              .map(item => ({ ...item, Icon: sectionIcons[item.id] }));
            return <div className="space-y-5">
              {!adminPage || !tiles.some(tile => tile.id === adminPage) ? <>
                {financeActor && <AdminFinance key={financeActor} accountId={financeActor}/>}
                <div className="royal-admin-tiles">
                {tiles.map(({id,label,Icon}) => <button key={id} type="button" onClick={() => setAdminPage(id)}
                  className="royal-admin-tile">
                  <Icon size={24} aria-hidden="true"/>
                  <span className="text-xs sm:text-sm font-bold text-center leading-snug break-words max-w-full">{label}</span>
                </button>)}
              </div></> : <>
                <button type="button" onClick={() => setAdminPage(null)} className="rounded-xl bg-white border border-amber-200 px-4 py-2 text-amber-800 font-bold">رجوع للأقسام</button>
                <h2 className="font-black text-xl">{tiles.find(t => t.id === adminPage)?.label}</h2>
                {((adminPage === 'stats' && dashboardErrors.counts) ||
                  (['users', 'agencies', 'rooms'].includes(adminPage) && dashboardErrors.recent)) && (
                  <div role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
                    تعذر تحميل بيانات هذا القسم.
                    <button type="button" onClick={() => void reload()} className="ms-2 font-bold underline">إعادة المحاولة</button>
                  </div>
                )}
                {adminPage==='stats' && counts && <div className="royal-admin-tiles">
                  {statistics.map(([key,label,Icon,target])=><button type="button" key={key} className="royal-admin-tile royal-admin-stat"
                    disabled={!target||!tiles.some(tile=>tile.id===target)} onClick={()=>target&&setAdminPage(target)}>
                    <Icon size={22} aria-hidden="true"/><strong><bdi>{counts[key].toLocaleString('en-US')}</bdi></strong><span>{label}</span>
                  </button>)}
                </div>}
                {recent && (adminPage === 'users' || adminPage === 'agencies' || adminPage === 'rooms') &&
                  <AdminRecentRecords items={recent[adminPage]} />}
                {adminPage === 'operations' && <AdminOperationsPanel />}
                {adminPage === 'ids' && <AdminSpecialIdPanel />}
                {adminPage === 'moderation' && <AdminRoomModerationPanel />}
                {adminPage === 'roomAppeals' && <AdminRoomAppealsPanel />}
                {adminPage === 'customerServiceAppeals' && <AdminCustomerServicePanel isOwner={access.role === 'owner'} canDecide={access.role === 'owner' || (access.role === 'super_admin' && access.permissions.includes('app_bans.manage'))} />}
                {adminPage === 'agencyActions' && <AdminAgencyActionsPanel />}
                {adminPage === 'agencyRegistrations' && <AdminAgencyRegistrationRequestsPanel />}
                {adminPage === 'reports' && <AdminUserReportsPanel />}
                {adminPage === 'financeReports' && <AdminReportsPanel />}
                {adminPage === 'agencySupplyRequests' && <SupplyReview />}
                {adminPage === 'accountReset' && <AdminAccountResetPanel />}
                {adminPage === 'gamesTreasury' && <><AdminEmbeddedGamesPanel /><AdminGamesTreasuryPanel /><AdminTotiFood /><AdminDomino /></>}
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
    </div>, document.body
  );
};
