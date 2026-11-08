import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Database,
  ArrowUpDown,
  Crown,
  BellRing,
  Send,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { imageUrl } from '../services/imageUrl';

export const AgencyModal: React.FC = () => {
  const {
    openAgencyModal,
    setOpenAgencyModal,
    currentUser,
    agencyMemberCount,
    setAgencyMemberCount,
  } = useApp();

  // Role:
  // 'user'  -> مستخدم عادي: تظهر له فقط شاشة "لا توجد بيانات"
  // 'host'  -> مضيف منضم: تظهر له بطاقة "مركز البيانات" وبيانات المضيف فقط
  // 'agent' -> وكيل مفعّل: تظهر له بطاقات الوكيل الثلاث (اعضاء الوكالة، مركز البيانات، المكافأة)
  const [hasApprovedAgency, setHasApprovedAgency] = useState(false);
  const [agencyRoleLoading, setAgencyRoleLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'host' | 'agent'>('user');

  // Resolve the approved agency from the authenticated backend, not a stale local role.
  useEffect(() => {
    if (!openAgencyModal) return;
    let active = true;
    setHasApprovedAgency(false);
    setRole('user');
    setActiveSubView(null);
    setAgencyRoleLoading(true);
    void (async () => {
      const { stagingBackend } = await import('../services/stagingBackend');
      if (!stagingBackend) return;
      const { data: auth, error: authError } = await stagingBackend.auth.getUser();
      if (authError || !auth.user) return;
      const { data, error } = await stagingBackend.rpc('staging_profile_agency', { p_user_id: auth.user.id });
      if (error || !active || !data) return;
      setHasApprovedAgency(
        (String(data.role ?? '').includes('مالك') || String(data.role ?? '').includes('وكيل')) &&
        Number(data.public_id) > 0
      );
      const verifiedRole = String(data.role ?? '');
      if (verifiedRole.includes('مالك') || verifiedRole.includes('وكيل')) setRole('agent');
      else if (verifiedRole.includes('مضيف')) setRole('host');
      else setRole('user');
    })().catch(error => console.error('Agency role lookup failed:', error)).finally(() => {
      if (active) setAgencyRoleLoading(false);
    });
    return () => { active = false; };
  }, [openAgencyModal, currentUser.id]);

  // Sub-views for Host and Agent:
  // null: Main view for the selected role
  // 'host_data_details': Host Data Center details (بيانات المضيف فقط)
  // 'agent_data_details': Agent Data Center details (مركز بيانات الوكالة)
  // 'agent_members': Agent Members management modal (أعضاء الوكالة)
  // 'agent_rewards': Agent Rewards modal (سجل الأرباح والمكافأة)
  const [activeSubView, setActiveSubView] = useState<
    'host_data_details' | 'agent_data_details' | 'agent_members' | 'agent_rewards' | null
  >(null);

  // Incoming Join Request from an Agent (Available for User role)
  const [pendingAgencyInvite, setPendingAgencyInvite] = useState<{
    id: string;
    agencyId: string;
    agencyName: string;
    agencyIdNumber: string;
    agentName: string;
  } | null>(null);

  // Expandable host rows in Agent Data Center
  const [expandedHostIndex, setExpandedHostIndex] = useState<number | null>(0);

  // Date Filter in Agent Data Details

  // Agency Members List for Agent
  const [membersList, setMembersList] = useState<Array<{ id: string; publicId: number | null; name: string; role: string; avatar: string }>>([]);

  const [agencyJoinRequests, setAgencyJoinRequests] = useState<Array<{ id: string; agency_id: string; user_id: string; status: string }>>([]);
  const [ownedAgencyIds, setOwnedAgencyIds] = useState<string[]>([]);
  const [agencyActionBusy, setAgencyActionBusy] = useState(false);
  const [agencyMembersError, setAgencyMembersError] = useState('');
  const [agencyMembersLoading, setAgencyMembersLoading] = useState(false);
  const refreshAgencyMembers = async () => {
    setAgencyMembersLoading(true);
    setAgencyMembersError('');
    const { stagingBackend } = await import('../services/stagingBackend');
    if (!stagingBackend) throw new Error('خادم الوكالات غير متصل');
    const { data, error } = await stagingBackend.rpc('phase4_agency_state');
    if (error) throw error;
    const owned = (data?.agencies ?? []).filter((agency: { owner_id: string; is_active: boolean }) => agency.owner_id === currentUser.id && agency.is_active);
    const ids = owned.map((agency: { id: string }) => agency.id);
    setOwnedAgencyIds(ids);
    setAgencyJoinRequests((data?.requests ?? []).filter((request: { agency_id: string; status: string }) => ids.includes(request.agency_id) && request.status === 'pending_new'));
    const activeMembers = (data?.members ?? []).filter((member: { agency_id: string }) => ids.includes(member.agency_id)) as Array<{ user_id: string; agency_id: string }>;
    const memberIds = [...new Set(activeMembers.map(member => member.user_id).filter(Boolean))];
    const { data: profiles, error: profilesError } = memberIds.length
      ? await stagingBackend.from('profiles').select('id,public_id,display_name,avatar_url').in('id', memberIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));
    setMembersList(activeMembers.map(member => {
      const profile = profileById.get(member.user_id);
      const publicId = Number(profile?.public_id);
      return {
        id: member.user_id,
        publicId: Number.isSafeInteger(publicId) && publicId > 0 ? publicId : null,
        name: typeof profile?.display_name === 'string' && profile.display_name.trim() ? profile.display_name.trim() : 'الاسم غير متاح',
        role: 'مضيف',
        avatar: imageUrl(profile?.avatar_url),
      };
    }));
    setAgencyMembersLoading(false);
  };
  useEffect(() => {
    if (openAgencyModal && activeSubView === 'agent_members' && role === 'agent') {
      void refreshAgencyMembers().catch(error => { setAgencyMembersLoading(false); setAgencyMembersError(error instanceof Error ? error.message : 'تعذر تحميل بيانات الوكالة'); console.error('Agency member load failed:', error); });
    }
  }, [openAgencyModal, activeSubView, role, currentUser.id]);
  const decideAgencyRequest = async (id: string, action: 'accept_join' | 'reject_join') => {
    if (agencyActionBusy) return;
    setAgencyActionBusy(true);
    try {
      const { stagingBackend } = await import('../services/stagingBackend');
      if (!stagingBackend) throw new Error('خادم الوكالات غير متصل');
      const { error } = await stagingBackend.rpc('phase4_agency_action', {
        p_action: action,
        p_data: { id },
        p_request_id: crypto.randomUUID(),
      });
      if (error) throw error;
      await refreshAgencyMembers();
      showToast(action === 'accept_join' ? 'تم قبول المضيف وربطه بالوكالة' : 'تم رفض طلب الانضمام');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'تعذر معالجة الطلب');
    } finally { setAgencyActionBusy(false); }
  };

  // New member ID input in Agent Members
  const [newMemberId, setNewMemberId] = useState('');

  // Agent Withdrawable Balance

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [applicationKind, setApplicationKind] = useState<'host' | 'recharge'>('host');
  const [applicationName, setApplicationName] = useState('');
  const [applicationContact, setApplicationContact] = useState('');
  const [applicationReason, setApplicationReason] = useState('');
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [applicationBusy, setApplicationBusy] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('');
  const submitAgencyApplication = async () => {
    if (applicationBusy) return;
    if (applicationName.trim().length < 2 || applicationName.trim().length > 80 ||
        applicationContact.trim().length < 3 || applicationContact.trim().length > 100 ||
        applicationReason.trim().length < 3 || applicationReason.trim().length > 500) {
      setApplicationStatus('أدخل اسم الوكالة ووسيلة التواصل وسبب الطلب بصورة صحيحة.');
      return;
    }
    setApplicationBusy(true);
    setApplicationStatus('');
    try {
      const { stagingBackend } = await import('../services/stagingBackend');
      if (!stagingBackend) throw new Error('الاتصال بخادم الوكالات غير مهيأ');
      const { data, error } = await stagingBackend.rpc('phase4_agency_action', {
        p_action: 'register',
        p_data: {
          kind: applicationKind,
          name: applicationName.trim(),
          contact: applicationContact.trim(),
          reason: applicationReason.trim(),
        },
        p_request_id: crypto.randomUUID(),
      });
      if (error) throw error;
      if (!data?.id || data.status !== 'pending') throw new Error('لم يؤكد الخادم استلام الطلب');
      setApplicationStatus('تم استلام الطلب على الخادم، وحالته: بانتظار مراجعة الإدارة.');
      setApplicationName('');
      setApplicationContact('');
      setApplicationReason('');
    } catch (error) {
      setApplicationStatus(error instanceof Error ? error.message : 'تعذر تقديم الطلب');
    } finally {
      setApplicationBusy(false);
    }
  };

  if (!openAgencyModal) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // The server must approve membership; never grant host status locally.
  const handleUserAcceptInvite = async () => {
    if (!pendingAgencyInvite) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pendingAgencyInvite.agencyId)) {
      showToast('معرّف الوكالة غير صالح؛ لا يمكن اعتماد بيانات تجريبية');
      return;
    }
    try {
      const { stagingBackend } = await import('../services/stagingBackend');
      if (!stagingBackend) throw new Error('خادم الوكالات غير متصل');
      const { error } = await stagingBackend.rpc('phase4_agency_action', {
        p_action: 'join',
        p_data: { agency_id: pendingAgencyInvite.agencyId, reason: 'طلب انضمام مقدم من التطبيق' },
        p_request_id: crypto.randomUUID(),
      });
      if (error) throw error;
      setPendingAgencyInvite(null);
      showToast('تم إرسال طلب الانضمام للمراجعة. لا تُمنح صفة مضيف قبل موافقة الوكالة.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'فشل إرسال الطلب'); }
  };

  // User rejects agency invite -> Stays as pure No Data
  const handleUserRejectInvite = () => {
    sounds.playClick();
    showToast('تم رفض طلب الانضمام للوكالة.');
    setPendingAgencyInvite(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4 select-none font-['Cairo',sans-serif]"
      dir="rtl"
    >
      {applicationOpen && (
        <div className="absolute inset-0 z-[90] bg-[#060c1b] flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-[#111b30] p-5 space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-lg text-amber-300">طلب فتح وكالة</h2>
              <button onClick={() => setApplicationOpen(false)} aria-label="إغلاق الطلب"><X size={22}/></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className={`rounded-xl p-3 text-sm font-bold ${applicationKind === 'host' ? 'bg-amber-500 text-black' : 'bg-slate-700'}`} onClick={() => setApplicationKind('host')}>وكالة مضيفين</button>
              <button className={`rounded-xl p-3 text-sm font-bold ${applicationKind === 'recharge' ? 'bg-amber-500 text-black' : 'bg-slate-700'}`} onClick={() => setApplicationKind('recharge')}>وكالة شحن</button>
            </div>
            <input value={applicationName} onChange={e => setApplicationName(e.target.value)} maxLength={80} placeholder="اسم الوكالة" className="w-full rounded-xl bg-slate-800 p-3 text-sm outline-none border border-slate-600" />
            <input value={applicationContact} onChange={e => setApplicationContact(e.target.value)} maxLength={100} placeholder="رقم الهاتف أو وسيلة التواصل" className="w-full rounded-xl bg-slate-800 p-3 text-sm outline-none border border-slate-600" />
            <textarea value={applicationReason} onChange={e => setApplicationReason(e.target.value)} maxLength={500} rows={3} placeholder="سبب طلب فتح الوكالة" className="w-full rounded-xl bg-slate-800 p-3 text-sm outline-none border border-slate-600" />
            <p className="text-xs text-slate-300">إرسال الطلب لا يمنح صلاحيات الوكالة تلقائياً. يجب موافقة الإدارة.</p>
            {applicationStatus && <p role="status" className="text-sm text-amber-200">{applicationStatus}</p>}
            <button disabled={applicationBusy} onClick={() => void submitAgencyApplication()} className="w-full rounded-xl bg-amber-500 text-black font-black p-3 disabled:opacity-50">{applicationBusy ? 'جاري الإرسال...' : 'إرسال طلب الوكالة'}</button>
          </div>
        </div>
      )}
      {!agencyRoleLoading && !hasApprovedAgency && <button onClick={() => { setApplicationStatus(''); setApplicationOpen(true); }} className="absolute z-[85] bottom-5 left-5 rounded-full bg-amber-500 text-black px-4 py-3 text-xs font-black shadow-xl border-2 border-amber-200">+ طلب فتح وكالة</button>}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 z-50 px-5 py-2.5 rounded-full bg-slate-900/95 border border-amber-400 text-amber-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 max-w-[90%] text-center">
          {toastMessage}
        </div>
      )}

      {/* Main Screen Container */}
      <div className="relative w-full max-w-[390px] h-full sm:h-[92vh] sm:max-h-[820px] sm:rounded-[36px] overflow-hidden shadow-[0_12px_50px_rgba(0,0,0,0.95)] border-0 sm:border border-[#C59B27]/40 flex flex-col justify-between bg-[#040814]">

        {/* =========================================================================
            DETAILED SUB-PAGE 1: HOST DATA CENTER (بيانات المضيف فقط)
            يظهر فقط عند النقر على مركز البيانات في شاشة المضيف
            ========================================================================= */}
        {activeSubView === 'host_data_details' ? (
          <div className="relative z-30 flex h-full w-full flex-col overflow-hidden bg-[#F6F7F9] text-slate-800 animate-in fade-in duration-200">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
              <button type="button" onClick={() => { sounds.playClick(); setActiveSubView(null); }} aria-label="العودة إلى مركز الوكالة" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"><ChevronRight className="h-6 w-6" /></button>
              <h2 className="text-base font-black text-slate-900">تفاصيل بيانات المضيف</h2>
              <span className="w-9" />
            </div>
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xs" role="status">
                <Database className="mx-auto h-8 w-8 text-amber-600" aria-hidden="true" />
                <p className="mt-3 text-sm font-black text-slate-800">بيانات البث والرواتب غير متاحة حالياً</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">لم يوفّر الخادم قيماً موثقة لهذه الشاشة، لذلك لا نعرض ساعات أو أرصدة أو مستويات تقديرية.</p>
              </div>
            </div>
          </div>
        ) : activeSubView === 'agent_data_details' ? (
          <div className="relative z-30 flex h-full w-full flex-col overflow-hidden bg-[#F6F7F9] text-slate-800 animate-in fade-in duration-200">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
              <button type="button" onClick={() => { sounds.playClick(); setActiveSubView(null); }} aria-label="العودة إلى مركز الوكالة" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"><ChevronRight className="h-6 w-6" /></button>
              <h2 className="text-base font-black text-slate-900">مركز بيانات الوكالة</h2>
              <span className="w-9" />
            </div>
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xs" role="status">
                <Database className="mx-auto h-8 w-8 text-amber-600" aria-hidden="true" />
                <p className="mt-3 text-sm font-black text-slate-800">إحصاءات الوكالة غير متاحة حالياً</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">لا توجد بيانات موثقة عن الرواتب أو الأهداف أو ساعات النشاط من الخادم. ستبقى هذه الشاشة بلا أرقام حتى يتوفر مصدر بيانات موثوق.</p>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              MAIN SCREEN WITH ROYAL CREST BACKGROUND
              STRICTLY SEPARATED PER ROLE:
              - USER: ONLY "لا توجد بيانات"
              - HOST: ONLY "مركز البيانات"
              - AGENT: ONLY 3 CARDS (أعضاء الوكالة، مركز البيانات، المكافأة)
              ========================================================================= */
          <>
            {/* Background: Lion & Eagle Royal Crest */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <img
                src="/agency-no-data-bg.jpg"
                alt="خلفية الوكالة الملكية"
                className="w-full h-full object-cover object-center"
              />

              <div className="absolute inset-0 bg-radial from-transparent via-[#040814]/10 to-[#02040a]/40 pointer-events-none" />

              <div className="absolute top-16 left-12 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#facc15] animate-pulse" />
              <div className="absolute top-36 right-10 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#facc15] animate-ping" />
              <div className="absolute top-64 left-8 w-1 h-1 rounded-full bg-yellow-200 shadow-[0_0_6px_#fde047]" />
              <div className="absolute bottom-60 right-14 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#facc15] animate-pulse" />
              <div className="absolute bottom-32 left-16 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#facc15] animate-pulse" />
            </div>

            {/* Top Control Bar: Role Selector (For testing & applying roles) & Close Button */}
            <div className="relative z-30 flex items-center justify-between px-3 pt-3 pb-1">
              {/* Role Switcher Pill Bar (فرق ونسق كذالك اجعل قابل للنقر والتطبيق) */}
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-full border border-amber-400/30 shadow-lg">
                <span className="px-3 py-1 text-xs font-bold text-amber-200" aria-label="الدور المعتمد">
                  {role === 'agent' ? '👑 وكيل' : role === 'host' ? '🎙️ مضيف' : '👤 مستخدم'}
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setOpenAgencyModal(false);
                }}
                className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition active:scale-95 shadow-sm cursor-pointer backdrop-blur-md"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* =========================================================================
                ROLE 1: USER VIEW (اذا كنت مستخدم يضهر لي فقط لا توجد بيانات)
                تظهر له فقط لا توجد بيانات أو بطاقة قبول/رفض طلب انضمام وكيل
                ========================================================================= */}
            {role === 'user' && (
              <div className="relative z-20 flex-1 flex flex-col justify-between px-4 pb-6 pt-0 animate-in fade-in duration-200">
                {/* Spacer for Crest at top */}
                <div className="w-full h-48 sm:h-52 pointer-events-none" />

                {/* Center Content: ONLY No Data OR Join Request */}
                <div className="flex-1 flex flex-col items-center justify-center text-center -mt-4">
                  {pendingAgencyInvite ? (
                    /* Join Request Card from Agent */
                    <div className="w-full max-w-[350px] mx-auto animate-in zoom-in-95 duration-200">
                      <div className="w-full rounded-[26px] p-[2.5px] bg-gradient-to-r from-[#DFB748] via-[#FFF2B2] to-[#B8860B] shadow-[0_0_22px_rgba(245,158,11,0.55),0_4px_16px_rgba(0,0,0,0.8)]">
                        <div className="w-full rounded-[24px] bg-[#070D1A]/95 p-3 sm:p-3.5 backdrop-blur-md flex flex-col gap-2.5 border border-white/10">
                          <div className="flex items-center justify-between gap-2">
                            {/* Agency Flag & Info */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-11 h-11 rounded-full p-[1.5px] bg-gradient-to-b from-[#FFF2B2] via-[#DFB748] to-[#9A6C11] shadow-[0_2px_8px_rgba(212,175,55,0.4)] flex items-center justify-center shrink-0">
                                <div className="w-full h-full rounded-full bg-[#111827] flex items-center justify-center overflow-hidden border border-black/40">
                                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                                    <div className="w-full h-1/3 bg-[#CE1126]" />
                                    <div className="w-full h-1/3 bg-white flex items-center justify-center">
                                      <span className="text-[7px] font-black text-[#007A3D] font-mono leading-none tracking-tighter">
                                        الله أكبر
                                      </span>
                                    </div>
                                    <div className="w-full h-1/3 bg-black" />
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <h4 className="text-sm font-black text-white tracking-wide">
                                  {pendingAgencyInvite.agencyName}
                                </h4>
                                <p className="text-[11px] font-bold text-slate-300 font-mono tracking-wider mt-0.5">
                                  ID:{pendingAgencyInvite.agencyIdNumber}
                                </p>
                              </div>
                            </div>

                            {/* Accept (يوافق) and Reject (يرفض) Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={handleUserAcceptInvite}
                                className="px-3.5 py-1.5 rounded-full bg-gradient-to-b from-[#22C55E] to-[#15803D] hover:brightness-110 text-white font-black text-xs shadow-[0_2px_12px_rgba(34,197,94,0.4)] border border-emerald-300/40 flex items-center gap-1 active:scale-95 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                <span>يوافق</span>
                              </button>

                              <button
                                onClick={handleUserRejectInvite}
                                className="px-3.5 py-1.5 rounded-full bg-gradient-to-b from-[#EF4444] to-[#B91C1C] hover:brightness-110 text-white font-black text-xs shadow-[0_2px_12px_rgba(239,68,68,0.4)] border border-rose-300/40 flex items-center gap-1 active:scale-95 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 text-white stroke-[3]" />
                                <span>يرفض</span>
                              </button>
                            </div>
                          </div>

                          <div className="w-full py-1.5 rounded-xl bg-black/45 border border-white/10 text-slate-300 text-[11px] font-bold text-center select-none shadow-inner">
                            الانضمام إلى الوكالة
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Pure "لا توجد بيانات" screen */
                    <div className="select-none animate-in fade-in duration-300 flex flex-col items-center">
                      <h2 className="text-[30px] sm:text-[34px] font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2B2] via-[#E5B842] to-[#B8860B] drop-shadow-[0_2px_14px_rgba(212,175,55,0.75)] leading-tight">
                        لا توجد بيانات
                      </h2>

                      <div className="flex items-center justify-center gap-3 w-48 mt-2.5">
                        <div className="flex-1 h-[1.5px] bg-gradient-to-l from-[#E5B842] via-[#E5B842]/80 to-transparent" />
                        <span className="text-xl leading-none filter drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]">
                          👑
                        </span>
                        <div className="flex-1 h-[1.5px] bg-gradient-to-r from-[#E5B842] via-[#E5B842]/80 to-transparent" />
                      </div>


                    </div>
                  )}
                </div>

                <div className="h-14" />
              </div>
            )}

            {/* =========================================================================
                ROLE 2: HOST VIEW (واذا كنت مضيف يضهر لي مركز البيانات وبياناتي فقط ك مضيف)
                تظهر له فقط بطاقة مركز البيانات الفاخرة بدون أي بطاقات أخرى
                ========================================================================= */}
            {role === 'host' && (
              <div className="relative z-20 flex-1 flex flex-col justify-between px-4 pb-6 pt-0 animate-in fade-in duration-200">
                {/* Spacer for Crest at top */}
                <div className="w-full h-48 sm:h-52 pointer-events-none" />

                {/* SINGLE GLOWING "مركز البيانات" CARD FOR HOST ONLY */}
                <div className="w-full max-w-[350px] mx-auto my-auto animate-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      sounds.playLevelUp();
                      setActiveSubView('host_data_details');
                    }}
                    className="group relative w-full h-[155px] rounded-[30px] p-[2.5px] bg-gradient-to-r from-[#DFB748] via-[#38BDF8] to-[#0284C7] shadow-[0_0_30px_rgba(14,165,233,0.7),0_8px_25px_rgba(0,0,0,0.9)] transition-all active:scale-[0.98] cursor-pointer overflow-hidden block"
                  >
                    <div className="w-full h-full rounded-[28px] bg-gradient-to-r from-[#021329]/95 via-[#032042]/90 to-[#010C1B]/95 backdrop-blur-md flex items-center justify-between px-5 border border-[#38BDF8]/60">
                      {/* Left: "مركز البيانات" Text + Golden Crown Line */}
                      <div className="text-right">
                        <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2B2] via-[#E5B842] to-[#B8860B] drop-shadow-[0_2px_12px_rgba(212,175,55,0.75)] tracking-wide">
                          مركز البيانات
                        </h3>

                        <div className="flex items-center gap-2 w-36 mt-2">
                          <div className="flex-1 h-[1.5px] bg-gradient-to-l from-[#E5B842] to-transparent" />
                          <span className="text-sm leading-none filter drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]">
                            👑
                          </span>
                          <div className="flex-1 h-[1.5px] bg-gradient-to-r from-[#E5B842] to-transparent" />
                        </div>

                        <span className="inline-block mt-2.5 text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                          انقر لعرض بيانات المضيف 🎙️
                        </span>
                      </div>

                      {/* Right: 3D Cyan Podium with Cyber Servers & Glowing Cloud */}
                      <div className="relative w-28 h-28 flex items-center justify-center shrink-0 pointer-events-none">
                        <div className="absolute bottom-1 w-24 h-6 rounded-full bg-gradient-to-r from-[#0369A1] via-[#38BDF8] to-[#0284C7] shadow-[0_0_20px_rgba(14,165,233,1)] border border-cyan-300/80" />
                        <div className="absolute bottom-3 w-20 h-4 rounded-full border border-cyan-300 shadow-[0_0_12px_#38bdf8] animate-pulse" />

                        <div className="relative z-10 flex flex-col items-center mb-1">
                          <div className="w-12 h-9 rounded-2xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] shadow-[0_0_18px_#38bdf8] flex items-center justify-center text-white mb-1.5">
                            <ArrowUpDown className="w-5 h-5 text-white stroke-[2.5]" />
                          </div>

                          <div className="w-14 h-3 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-around px-1 shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          </div>
                          <div className="w-14 h-3 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-around px-1 mt-0.5 shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="h-14" />
              </div>
            )}

            {/* =========================================================================
                ROLE 3: AGENT VIEW (واذا كنت وكيل تضهر لي صفحة الوكيل: أعضاء الوكالة، البيانات، مكافأة)
                تظهر له فقط البطاقات الثلاث الملكية التفاعلية
                ========================================================================= */}
            {role === 'agent' && (
              <div className="relative z-20 flex-1 flex flex-col justify-between px-3.5 sm:px-4 pb-4 pt-0 animate-in fade-in duration-200">
                {/* Spacer for Crest at top */}
                <div className="w-full h-44 sm:h-48 pointer-events-none" />

                {/* THE 3 LUXURY ACTION CARDS EXCLUSIVELY FOR AGENT */}
                <div className="flex flex-col gap-3 w-full my-auto">
                  {/* 1. أعضاء الوكالة */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setActiveSubView('agent_members');
                    }}
                    className="group relative w-full h-[104px] sm:h-[110px] rounded-[24px] p-[2px] bg-gradient-to-r from-[#DFB748] via-[#FFF2B2] to-[#B8860B] shadow-[0_0_20px_rgba(245,158,11,0.5),0_8px_20px_rgba(0,0,0,0.8)] transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
                  >
                    <div className="w-full h-full rounded-[22px] bg-gradient-to-r from-[#171004]/95 via-[#1E1405]/90 to-[#0A0702]/95 backdrop-blur-md flex items-center justify-between px-4 border border-[#F5C451]/30">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center text-[#F5C451] group-hover:-translate-x-1 transition-transform">
                          <ChevronLeft className="w-6 h-6 stroke-[3]" />
                        </div>

                        <div className="text-right">
                          <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2B2] via-[#E5B842] to-[#B8860B] drop-shadow-[0_2px_8px_rgba(212,175,55,0.7)] tracking-wide">
                            اعضاء الوكالة
                          </h3>

                          <div className="flex items-center gap-1.5 w-32 mt-1">
                            <div className="flex-1 h-[1.5px] bg-gradient-to-l from-[#E5B842] to-transparent" />
                            <span className="text-xs leading-none filter drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]">
                              👑
                            </span>
                            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-[#E5B842] to-transparent" />
                          </div>
                        </div>
                      </div>

                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0 pointer-events-none">
                        <div className="absolute bottom-1 w-20 h-5 rounded-full bg-gradient-to-r from-[#9B6D12] via-[#FCE38A] to-[#B8860B] shadow-[0_0_14px_rgba(245,158,11,0.8)] border border-amber-300/60" />
                        <div className="absolute bottom-3 w-16 h-3 rounded-full bg-gradient-to-r from-[#B8860B] via-[#FFF2B2] to-[#9B6D12] shadow-xs" />

                        <div className="relative z-10 flex items-end justify-center mb-1">
                          <div className="w-6 h-10 rounded-t-full bg-gradient-to-b from-[#FFF2B2] via-[#E5B842] to-[#9B6D12] shadow-md -mr-1.5 scale-90 opacity-90" />

                          <div className="relative w-8 h-12 rounded-t-full bg-gradient-to-b from-[#FFF9D2] via-[#F5C451] to-[#8E6310] shadow-[0_0_12px_rgba(245,158,11,0.7)] z-20 flex flex-col items-center">
                            <span className="text-[10px] -mt-2.5 filter drop-shadow-[0_0_4px_#facc15]">👑</span>
                            <div className="w-4 h-4 rounded-full bg-gradient-to-b from-[#FFF9D2] to-[#C89626] mt-0.5 shadow-inner" />
                          </div>

                          <div className="w-6 h-10 rounded-t-full bg-gradient-to-b from-[#FFF2B2] via-[#E5B842] to-[#9B6D12] shadow-md -ml-1.5 scale-90 opacity-90" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* 2. مركز البيانات */}
                  <button
                    onClick={() => {
                      sounds.playLevelUp();
                      setActiveSubView('agent_data_details');
                    }}
                    className="group relative w-full h-[104px] sm:h-[110px] rounded-[24px] p-[2px] bg-gradient-to-r from-[#0EA5E9] via-[#7DD3FC] to-[#0369A1] shadow-[0_0_20px_rgba(14,165,233,0.55),0_8px_20px_rgba(0,0,0,0.8)] transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
                  >
                    <div className="w-full h-full rounded-[22px] bg-gradient-to-r from-[#03152B]/95 via-[#04244B]/90 to-[#010C1B]/95 backdrop-blur-md flex items-center justify-between px-4 border border-[#38BDF8]/40">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center text-[#38BDF8] group-hover:-translate-x-1 transition-transform">
                          <ChevronLeft className="w-6 h-6 stroke-[3]" />
                        </div>

                        <div className="text-right">
                          <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#E0F2FE] via-[#7DD3FC] to-[#0284C7] drop-shadow-[0_2px_8px_rgba(56,189,248,0.7)] tracking-wide">
                            مركز البيانات
                          </h3>

                          <div className="flex items-center gap-1.5 w-32 mt-1">
                            <div className="flex-1 h-[1.5px] bg-gradient-to-l from-[#38BDF8] to-transparent" />
                            <div className="w-3.5 h-3.5 rounded-sm border border-[#38BDF8] bg-[#0284C7]/40 flex flex-col items-center justify-around p-0.5 shadow-[0_0_6px_#38bdf8]">
                              <div className="w-full h-[1px] bg-[#7DD3FC]" />
                              <div className="w-full h-[1px] bg-[#7DD3FC]" />
                            </div>
                            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-[#38BDF8] to-transparent" />
                          </div>
                        </div>
                      </div>

                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0 pointer-events-none">
                        <div className="absolute bottom-1 w-20 h-5 rounded-full bg-gradient-to-r from-[#0369A1] via-[#38BDF8] to-[#0284C7] shadow-[0_0_16px_rgba(14,165,233,0.9)] border border-cyan-300/70" />
                        <div className="absolute bottom-3 w-16 h-3 rounded-full border border-cyan-300 shadow-[0_0_8px_#38bdf8] animate-pulse" />

                        <div className="relative z-10 flex flex-col items-center mb-1">
                          <div className="w-10 h-7 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] shadow-[0_0_14px_#38bdf8] flex items-center justify-center text-white mb-1">
                            <ArrowUpDown className="w-4 h-4 text-white stroke-[2.5]" />
                          </div>

                          <div className="w-12 h-2.5 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-around px-1 shadow-xs">
                            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                            <div className="w-1 h-1 rounded-full bg-cyan-300" />
                            <div className="w-1 h-1 rounded-full bg-cyan-400" />
                          </div>
                          <div className="w-12 h-2.5 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-around px-1 mt-0.5 shadow-xs">
                            <div className="w-1 h-1 rounded-full bg-cyan-300" />
                            <div className="w-1 h-1 rounded-full bg-cyan-400" />
                            <div className="w-1 h-1 rounded-full bg-cyan-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* 3. المكافأة */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setActiveSubView('agent_rewards');
                    }}
                    className="group relative w-full h-[104px] sm:h-[110px] rounded-[24px] p-[2px] bg-gradient-to-r from-[#DFB748] via-[#FDE047] to-[#B8860B] shadow-[0_0_20px_rgba(245,158,11,0.5),0_8px_20px_rgba(0,0,0,0.8)] transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
                  >
                    <div className="w-full h-full rounded-[22px] bg-gradient-to-r from-[#1E0826]/95 via-[#2B0C39]/90 to-[#100316]/95 backdrop-blur-md flex items-center justify-between px-4 border border-[#F5C451]/30">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center text-[#F5C451] group-hover:-translate-x-1 transition-transform">
                          <ChevronLeft className="w-6 h-6 stroke-[3]" />
                        </div>

                        <div className="text-right">
                          <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2B2] via-[#E5B842] to-[#B8860B] drop-shadow-[0_2px_8px_rgba(212,175,55,0.7)] tracking-wide">
                            المكافأة
                          </h3>

                          <div className="flex items-center gap-1.5 w-32 mt-1">
                            <div className="flex-1 h-[1.5px] bg-gradient-to-l from-[#E5B842] to-transparent" />
                            <span className="text-xs leading-none filter drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]">
                              🎁
                            </span>
                            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-[#E5B842] to-transparent" />
                          </div>
                        </div>
                      </div>

                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0 pointer-events-none">
                        <div className="absolute bottom-1 w-20 h-5 rounded-full bg-gradient-to-r from-[#9B6D12] via-[#FCE38A] to-[#B8860B] shadow-[0_0_14px_rgba(245,158,11,0.8)] border border-amber-300/60" />

                        <div className="relative z-10 flex flex-col items-center mb-1">
                          <div className="w-7 h-4 -mb-1 flex items-center justify-center relative">
                            <div className="w-3 h-3 rounded-full border-2 border-amber-300 rotate-45 -mr-1 shadow-[0_0_6px_#fde047]" />
                            <div className="w-3 h-3 rounded-full border-2 border-amber-300 -rotate-45 -ml-1 shadow-[0_0_6px_#fde047]" />
                            <div className="absolute w-2 h-2 rounded-full bg-gradient-to-b from-[#FFF9D2] to-[#B8860B]" />
                          </div>

                          <div className="relative w-11 h-10 rounded-lg bg-gradient-to-b from-[#232733] to-[#0B0D13] border border-amber-400/50 shadow-xl overflow-hidden flex items-center justify-center">
                            <div className="absolute w-full h-2 bg-gradient-to-r from-[#DFB748] via-[#FFF2B2] to-[#B8860B] shadow-xs" />
                            <div className="absolute h-full w-2 bg-gradient-to-b from-[#DFB748] via-[#FFF2B2] to-[#B8860B] shadow-xs" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="h-8" />
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            AGENT SUB-MODAL 1: إدارة أعضاء الوكالة
            ========================================================================= */}
        {activeSubView === 'agent_members' && (
          <div
            onClick={() => setActiveSubView(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[380px] rounded-t-[32px] sm:rounded-[32px] bg-gradient-to-b from-[#0E1526] to-[#060A14] border-t sm:border border-amber-400/50 p-4 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-300">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-black text-amber-200">إدارة أعضاء الوكالة</h4>
                </div>

                <button
                  onClick={() => setActiveSubView(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                {/* Send invite by ID */}
                <div className="p-3 rounded-2xl bg-white/5 border border-amber-400/30 flex items-center gap-2">
                  <input
                    type="text"
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    placeholder="إدخال ID المضيف لإرسال دعوة..."
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none text-right font-mono"
                  />
                  <button
                    onClick={() => showToast('للانضمام، يقدم المستخدم طلباً من قائمة الوكالات؛ بعدها يظهر هنا للموافقة. لا يمكن إضافة حساب دون موافقته.')}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    إرسال دعوة
                  </button>
                </div>


                {/* Counts */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20">
                    <span className="text-[10px] text-slate-400 block">إجمالي الأعضاء</span>
                    <span className="text-sm font-black text-amber-300">{agencyMemberCount || membersList.length} مضيف</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                    <span className="text-[10px] text-slate-400 block">المضيفين النشطين اليوم</span>
                    <span className="text-sm font-black text-emerald-400">غير متوفر حالياً</span>
                  </div>
                </div>

                {ownedAgencyIds.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
                    <h5 className="text-xs font-bold text-amber-200">طلبات الانضمام بانتظار موافقتك ({agencyJoinRequests.length})</h5>
                    {agencyMembersLoading && <p className="text-xs text-slate-300">جارٍ جلب الطلبات من الخادم...</p>}
                    {agencyMembersError && <p className="text-xs text-rose-300">{agencyMembersError}</p>}
                    <button type="button" onClick={() => void refreshAgencyMembers().catch(error => { setAgencyMembersLoading(false); setAgencyMembersError(error instanceof Error ? error.message : 'تعذر التحديث'); })} className="text-[11px] text-cyan-300 underline">تحديث الطلبات والأعضاء</button>
                    {agencyJoinRequests.map(request => (
                      <div key={request.id} className="rounded-xl bg-white/5 p-2 text-xs text-white">
                        <p className="mb-2 font-mono text-[10px] break-all">معرّف المستخدم: {request.user_id}</p>
                        <div className="flex gap-2">
                          <button disabled={agencyActionBusy} onClick={() => void decideAgencyRequest(request.id, 'accept_join')} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold disabled:opacity-50">قبول</button>
                          <button disabled={agencyActionBusy} onClick={() => void decideAgencyRequest(request.id, 'reject_join')} className="rounded-lg bg-rose-700 px-3 py-2 font-bold disabled:opacity-50">رفض</button>
                        </div>
                      </div>
                    ))}
                    {agencyJoinRequests.length === 0 && <p className="text-[11px] text-slate-400">لا توجد طلبات جديدة حالياً</p>}
                  </div>
                )}

                {/* Members List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">قائمة المضيفين وصناع المحتوى:</span>
                  {membersList.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {m.avatar ? <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover border border-amber-300" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-400/10 text-amber-200"><Users className="h-4 w-4" /></div>}
                        <div className="text-right">
                          <h5 className="font-black text-white">{m.name}</h5>
                          <span className="text-[10px] text-amber-300 font-bold block">{m.role}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{m.publicId ? `ID: ${m.publicId}` : 'رقم الحساب غير متاح'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            showToast('مراسلة المضيفين غير متاحة حتى ربطها بخدمة الرسائل الحقيقية');
                          }}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center cursor-pointer transition active:scale-95"
                          title="مراسلة"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        {idx !== 0 && (
                          <button
                            onClick={() => showToast('إزالة أعضاء الوكالة غير متاحة حتى ربطها بالخادم')}
                            className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center cursor-pointer transition active:scale-95"
                            title="إزالة العضو"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            AGENT SUB-MODAL 2: المكافأة والأرباح
            ========================================================================= */}
        {activeSubView === 'agent_rewards' && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="سجل الأرباح والمكافآت">
            <div className="w-full max-w-sm rounded-t-3xl border border-amber-400/40 bg-[#0E1526] p-5 text-center text-white shadow-2xl sm:rounded-3xl">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-amber-200">الأرباح والمكافآت</h4>
                <button type="button" onClick={() => setActiveSubView(null)} aria-label="إغلاق" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-200"><X className="h-4 w-4" /></button>
              </div>
              <Database className="mx-auto mt-5 h-8 w-8 text-amber-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-white">سجل الأرباح والعمولات غير متاح من الخادم حالياً</p>
              <p className="mt-2 text-xs leading-6 text-slate-300">لا توجد بيانات موثقة عن الرصيد أو النسبة أو المكافآت، لذلك أُخفيت القيم التجريبية وتعطّل السحب حتى ربطه بعملية مالية آمنة.</p>
              <button type="button" disabled className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-xs font-black text-slate-400" aria-disabled="true">السحب غير متاح</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
