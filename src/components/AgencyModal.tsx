import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Database,
  Gift,
  ArrowUpDown,
  Calendar,
  Clock,
  HelpCircle,
  Crown,
  BellRing,
  RotateCcw,
  Send,
  MessageCircle,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const AgencyModal: React.FC = () => {
  const {
    openAgencyModal,
    setOpenAgencyModal,
    currentUser,
    joinAgency,
    updateUserProfile,
    agencyMemberCount,
    setAgencyMemberCount,
  } = useApp();

  // Role:
  // 'user'  -> مستخدم عادي: تظهر له فقط شاشة "لا توجد بيانات"
  // 'host'  -> مضيف منضم: تظهر له بطاقة "مركز البيانات" وبيانات المضيف فقط
  // 'agent' -> وكيل مفعّل: تظهر له بطاقات الوكيل الثلاث (اعضاء الوكالة، مركز البيانات، المكافأة)
  const [role, setRole] = useState<'user' | 'host' | 'agent'>(() => {
    if (currentUser.agencyRole === 'وكيل') return 'agent';
    if (currentUser.agencyRole === 'مضيف' || currentUser.isHost) return 'host';
    return 'user';
  });

  // Keep role in sync with currentUser when modal opens or profile changes
  useEffect(() => {
    if (currentUser.agencyRole === 'وكيل') {
      setRole('agent');
    } else if (currentUser.agencyRole === 'مضيف' || currentUser.isHost) {
      setRole('host');
    } else {
      setRole('user');
    }
  }, [currentUser.agencyRole, currentUser.isHost]);

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
  } | null>({
    id: 'req-iraq-state',
    agencyId: 'agency-4',
    agencyName: 'دولة العراق...',
    agencyIdNumber: '1133812',
    agentName: 'دولة العراق',
  });

  // Expandable host rows in Agent Data Center
  const [expandedHostIndex, setExpandedHostIndex] = useState<number | null>(0);

  // Date Filter in Agent Data Details
  const [selectedDateFilter, setSelectedDateFilter] = useState<'2026/1' | 'هذا الشهر' | 'اليوم'>('2026/1');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Agency Members List for Agent
  const [membersList, setMembersList] = useState([
    {
      id: '1331',
      name: 'دولة العراق',
      role: 'مدير الوكالة 👑',
      score: '0 🪙',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '2044',
      name: 'قيصر بغداد',
      role: 'مشرف رسمي 🛡️',
      score: '0 🪙',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '3088',
      name: 'نور الرافدين',
      role: 'مضيف مميز ⭐',
      score: '0 🪙',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '4112',
      name: 'صقر بابل',
      role: 'مضيف صوتي 🎙️',
      score: '0 🪙',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    },
  ]);

  // New member ID input in Agent Members
  const [newMemberId, setNewMemberId] = useState('');

  // Agent Withdrawable Balance
  const [agentBalance, setAgentBalance] = useState('0.00');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!openAgencyModal) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch role and apply it directly to currentUser profile in AppContext
  const handleSwitchAndApplyRole = (newRole: 'user' | 'host' | 'agent') => {
    sounds.playClick();
    setRole(newRole);
    setActiveSubView(null);

    if (newRole === 'user') {
      updateUserProfile({
        agencyRole: 'مستخدم',
        isHost: false,
        agencyName: '',
      });
      showToast('تم تطبيق دور: مستخدم عادي (تظهر شاشة لا توجد بيانات فقط) 👤');
    } else if (newRole === 'host') {
      updateUserProfile({
        agencyRole: 'مضيف',
        isHost: true,
        agencyName: currentUser.agencyName || 'دولة العراق...',
      });
      showToast('تم تطبيق دور: مضيف معتمد (تظهر شاشة مركز البيانات وبيانات المضيف فقط) 🎙️');
    } else if (newRole === 'agent') {
      updateUserProfile({
        agencyRole: 'وكيل',
        isHost: false,
        agencyName: currentUser.agencyName || 'وكالة كينج الملكية',
      });
      showToast('تم تطبيق دور: وكيل مفعّل (تظهر بطاقات أعضاء الوكالة، البيانات، المكافأة) 👑');
    }
  };

  // User accepts agency invite -> Becomes Host and applies changes immediately!
  const handleUserAcceptInvite = () => {
    if (!pendingAgencyInvite) return;
    sounds.playLevelUp();
    joinAgency(pendingAgencyInvite.agencyId);
    updateUserProfile({
      agencyRole: 'مضيف',
      isHost: true,
      agencyName: pendingAgencyInvite.agencyName,
    });
    setPendingAgencyInvite(null);
    setRole('host');
    setActiveSubView(null);
    showToast(`🎉 مبارك! تم قبول الانضمام إلى ${pendingAgencyInvite.agencyName} وتم تطبيق دور مضيف معتمد! 🎙️`);
  };

  // User rejects agency invite -> Stays as pure No Data
  const handleUserRejectInvite = () => {
    sounds.playClick();
    showToast('تم رفض طلب الانضمام للوكالة.');
    setPendingAgencyInvite(null);
  };

  // Simulate new incoming invite for testing
  const handleSimulateNewInvite = () => {
    sounds.playClick();
    setPendingAgencyInvite({
      id: `req-${Date.now()}`,
      agencyId: 'agency-4',
      agencyName: 'دولة العراق...',
      agencyIdNumber: '1133812',
      agentName: 'دولة العراق',
    });
    showToast('وصلك طلب انضمام جديد من وكيل! 📩');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4 select-none font-['Cairo',sans-serif]"
      dir="rtl"
    >
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
          <div className="relative z-30 w-full h-full flex flex-col bg-[#F6F7F9] text-slate-800 animate-in fade-in duration-200 overflow-hidden">
            {/* Header with Back button */}
            <div className="w-full bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveSubView(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                title="رجوع لصفحة المضيف"
              >
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              </button>

              <h2 className="text-base font-black text-slate-900 tracking-wide">
                تفاصيل بيانات المضيف
              </h2>

              <div className="w-8" />
            </div>

            {/* Host Specific Metrics (Zeroed Out) */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3">
              {/* Card 1: مركز البيانات */}
              <div
                onClick={() => {
                  sounds.playClick();
                  showToast('ساعات البث وأيام الفعالية يتم احتسابها تلقائياً أثناء البث المباشر.');
                }}
                className="w-full bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 space-y-2.5 cursor-pointer active:scale-[0.99] transition"
              >
                <h3 className="text-xs font-bold text-slate-800 text-right">مركز البيانات</h3>

                <div className="w-full bg-[#F8FAFC] border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">ايام فعالية</span>
                    <span className="text-base font-black text-[#00BFA5]">0 يوم</span>
                  </div>

                  <div className="w-[1px] h-8 bg-slate-200" />

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي الوقت</span>
                    <span className="text-base font-black text-[#00BFA5]">0.00 ساعة</span>
                  </div>

                  <ChevronLeft className="w-4 h-4 text-[#00BFA5]" />
                </div>
              </div>

              {/* Card 2: الرواتب */}
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('إجمالي الرواتب المحتسبة للمضيف: $0');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <span className="text-[10px] text-slate-400 font-bold block">الرواتب الاجمالية</span>
                  <span className="text-base font-black text-[#00BFA5] font-mono mt-0.5 block">$0</span>
                </div>

                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('رواتب الكونز يتم تحويلها دورياً حسب الدعم المستلم.');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <div className="flex items-center justify-center gap-0.5 text-[10px] text-slate-400 font-bold">
                    <span>رواتب الكونز</span>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                  <span className="text-base font-black text-[#00BFA5] font-mono mt-0.5 block">$0</span>
                </div>

                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('رواتب الماس تتاح عند الوصول للهدف الشهري.');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <div className="flex items-center justify-center gap-0.5 text-[10px] text-slate-400 font-bold">
                    <span>رواتب الماس</span>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                  <span className="text-base font-bold text-slate-400 font-mono mt-0.5 block">~</span>
                </div>
              </div>

              {/* Card 3: الكونزات المستلمة */}
              <div
                onClick={() => {
                  sounds.playClick();
                  showToast('الهدف الحالي: Lv0 (0/550,000 كوينز).');
                }}
                className="w-full bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 space-y-2 cursor-pointer active:scale-[0.99] transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>الكونزات المستلمة</span>
                  </span>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#00BFA5] font-black">Lv0</span>
                  <span className="text-amber-500 font-mono flex items-center gap-1">
                    <span>🪙</span>
                    <span>0/550000</span>
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#00BFA5] rounded-full w-[0%]" />
                </div>
              </div>

              {/* Card 4: بطاقات الماس */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">مستوى رواتب الماس</span>
                  <span className="text-base font-bold text-slate-400 font-mono mt-0.5 block">~</span>
                </div>

                <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">عدد الالماس تم مسح</span>
                  <span className="text-base font-bold text-slate-400 font-mono mt-0.5 block">~</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeSubView === 'agent_data_details' ? (
          /* =========================================================================
              DETAILED SUB-PAGE 2: AGENT DATA CENTER (بيانات الوكيل الشاملة)
              يظهر فقط عند النقر على مركز البيانات في شاشة الوكيل
              ========================================================================= */
          <div className="relative z-30 w-full h-full flex flex-col bg-[#F6F7F9] text-slate-800 animate-in fade-in duration-200 overflow-hidden">
            {/* Header with Back button */}
            <div className="w-full bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveSubView(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                title="رجوع لصفحة الوكيل"
              >
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              </button>

              <h2 className="text-base font-black text-slate-900 tracking-wide">
                مركز بيانات الوكالة
              </h2>

              <div className="w-8" />
            </div>

            {/* Agent Detailed Metrics */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3">
              {/* Date Filter Dropdown */}
              <div className="relative w-full bg-white rounded-2xl p-3 shadow-xs border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">الوقت</span>
                <button
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 transition"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">{selectedDateFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showDateDropdown && (
                  <div className="absolute top-12 left-3 z-40 bg-white rounded-xl shadow-xl border border-slate-200 p-1 flex flex-col w-32 animate-in fade-in zoom-in-95">
                    {(['2026/1', 'هذا الشهر', 'اليوم'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedDateFilter(d);
                          setShowDateDropdown(false);
                          showToast(`تم تغيير فلتر الوقت إلى: ${d}`);
                        }}
                        className={`px-3 py-1.5 text-right text-xs rounded-lg font-bold transition ${
                          selectedDateFilter === d ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Data Center Card with Timer */}
              <div className="w-full bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">مركز البيانات</h3>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#00BFA5]">
                    <span>00:00:00:00</span>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="w-full bg-[#F8FAFC] border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">ايام فعالية</span>
                    <span className="text-base font-black text-[#00BFA5]">0 يوم</span>
                  </div>

                  <div className="w-[1px] h-8 bg-slate-200" />

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي الوقت</span>
                    <span className="text-base font-black text-[#00BFA5]">0.00 ساعة</span>
                  </div>

                  <ChevronLeft className="w-4 h-4 text-[#00BFA5]" />
                </div>
              </div>

              {/* Grid of 6 Cards for Agency */}
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('إجمالي رواتب الوكالة للشهر: $0');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <span className="text-[10px] text-slate-400 font-bold block">رواتب الوكالة</span>
                  <span className="text-base font-black text-[#00BFA5] font-mono mt-0.5 block">$0</span>
                </div>

                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('رواتب الوكيل المباشرة: $0');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <span className="text-[10px] text-slate-400 font-bold block">رواتب الوكيل</span>
                  <span className="text-base font-black text-[#00BFA5] font-mono mt-0.5 block">$0</span>
                </div>

                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('مجموع رواتب المضيفين التابعين للوكالة: $0');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <span className="text-[10px] text-slate-400 font-bold block">رواتب المضيفين</span>
                  <span className="text-base font-black text-[#00BFA5] font-mono mt-0.5 block">$0</span>
                </div>

                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('نسبة عمولة الوكيل الرسمية: 0%');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <div className="flex items-center justify-center gap-0.5 text-[10px] text-slate-400 font-bold">
                    <span>نسبة الوكيل</span>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                  <span className="text-base font-black text-[#00BFA5] font-mono mt-0.5 block">$0</span>
                </div>

                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('رواتب الكونز المستحقة: $0');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <div className="flex items-center justify-center gap-0.5 text-[10px] text-slate-400 font-bold">
                    <span>رواتب الكونز</span>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                  <span className="text-base font-black text-[#00BFA5] font-mono mt-0.5 block">$0</span>
                </div>

                <div
                  onClick={() => {
                    sounds.playClick();
                    showToast('رواتب الماس الخاصة بالوكالة: لا توجد');
                  }}
                  className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-slate-100 cursor-pointer active:scale-95 transition"
                >
                  <div className="flex items-center justify-center gap-0.5 text-[10px] text-slate-400 font-bold">
                    <span>رواتب الماس</span>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                  <span className="text-base font-bold text-slate-400 font-mono mt-0.5 block">~</span>
                </div>
              </div>

              {/* Agency Coins Target */}
              <div className="w-full bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🎁</span>
                    <span>الكونزات المستلمة</span>
                  </span>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#00BFA5] font-black">Lv0</span>
                  <span className="text-amber-500 font-mono flex items-center gap-1">
                    <span>🪙</span>
                    <span>0/2500000</span>
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#00BFA5] rounded-full w-[0%]" />
                </div>
              </div>

              {/* Diamond Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">مستوى رواتب الماس</span>
                  <span className="text-base font-bold text-slate-400 font-mono mt-0.5 block">~</span>
                </div>

                <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">عدد الالماس تم مسح</span>
                  <span className="text-base font-bold text-slate-400 font-mono mt-0.5 block">~</span>
                </div>
              </div>

              {/* Hosts Breakdown List */}
              <div className="space-y-2 pt-1">
                <h4 className="text-sm font-bold text-slate-900 pr-1">
                  تفاصيل البيانات
                </h4>

                {/* Host 1 */}
                <div className="w-full bg-white rounded-2xl p-3 shadow-xs border border-slate-100 space-y-2">
                  <div
                    onClick={() => setExpandedHostIndex(expandedHostIndex === 0 ? null : 0)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-slate-600 font-mono">1</span>

                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                          alt="دولة العراق"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="text-right">
                        <h5 className="text-xs font-black text-slate-900 flex items-center gap-1">
                          <span>✗»دولة العراق...</span>
                        </h5>
                        <p className="text-[10px] text-slate-400 font-mono">ID: 1331</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="text-amber-500">🪙</span>
                      <span className="font-mono font-black">0.0k</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          expandedHostIndex === 0 ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {expandedHostIndex === 0 && (
                    <div className="w-full bg-[#F0FDF9] border border-teal-100 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in fade-in">
                      <span className="text-[#0D9488] font-bold">إجمالي الوقت: 0.00 ساعة</span>
                      <div className="w-[1px] h-4 bg-teal-200" />
                      <div className="flex items-center gap-1 text-[#0D9488] font-bold">
                        <span>ايام فعالية: 0 يوم</span>
                        <ChevronLeft className="w-3.5 h-3.5 text-[#0D9488]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Host 2 */}
                <div className="w-full bg-white rounded-2xl p-3 shadow-xs border border-slate-100 space-y-2">
                  <div
                    onClick={() => setExpandedHostIndex(expandedHostIndex === 1 ? null : 1)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-slate-600 font-mono">2</span>

                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                          alt="نور الرافدين"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="text-right">
                        <h5 className="text-xs font-black text-slate-900 flex items-center gap-1">
                          <span>نور الرافدين</span>
                        </h5>
                        <p className="text-[10px] text-slate-400 font-mono">ID: 3088</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="text-amber-500">🪙</span>
                      <span className="font-mono font-black">0.0k</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          expandedHostIndex === 1 ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {expandedHostIndex === 1 && (
                    <div className="w-full bg-[#F0FDF9] border border-teal-100 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in fade-in">
                      <span className="text-[#0D9488] font-bold">إجمالي الوقت: 0.00 ساعة</span>
                      <div className="w-[1px] h-4 bg-teal-200" />
                      <div className="flex items-center gap-1 text-[#0D9488] font-bold">
                        <span>ايام فعالية: 0 يوم</span>
                        <ChevronLeft className="w-3.5 h-3.5 text-[#0D9488]" />
                      </div>
                    </div>
                  )}
                </div>
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
                {/* 1. دور المستخدم */}
                <button
                  onClick={() => handleSwitchAndApplyRole('user')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                    role === 'user'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="تطبيق دور: مستخدم عادي (لا توجد بيانات فقط)"
                >
                  <span>👤</span>
                  <span>مستخدم</span>
                </button>

                {/* 2. دور المضيف */}
                <button
                  onClick={() => handleSwitchAndApplyRole('host')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                    role === 'host'
                      ? 'bg-cyan-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="تطبيق دور: مضيف معتمد (مركز البيانات فقط)"
                >
                  <span>🎙️</span>
                  <span>مضيف</span>
                </button>

                {/* 3. دور الوكيل */}
                <button
                  onClick={() => handleSwitchAndApplyRole('agent')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                    role === 'agent'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="تطبيق دور: وكيل مفعّل (أعضاء الوكالة، البيانات، المكافأة)"
                >
                  <span>👑</span>
                  <span>وكيل</span>
                </button>
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

                      {/* Simulation Trigger button to test receiving an invite */}
                      <button
                        onClick={handleSimulateNewInvite}
                        className="mt-8 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-amber-400/40 text-amber-300 text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-lg"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>محاكاة استلام طلب انضمام من وكيل 📩</span>
                      </button>
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
                    onClick={() => {
                      if (!newMemberId.trim()) return;
                      sounds.playLevelUp();
                      setMembersList((prev) => {
                        const next = [
                          ...prev,
                          {
                            id: newMemberId.trim(),
                            name: `مضيف جديد (#${newMemberId.trim()})`,
                            role: 'مضيف معتمد 🎙️',
                            score: '0 🪙',
                            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                          },
                        ];
                        setAgencyMemberCount(next.length);
                        return next;
                      });
                      showToast(`تم إرسال دعوة انضمام وإضافة ID: ${newMemberId} بنجاح! 📨`);
                      setNewMemberId('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    إرسال دعوة
                  </button>
                </div>

                {/* Quick Add / Remove Test Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      sounds.playLevelUp();
                      const randomId = Math.floor(1000 + Math.random() * 9000).toString();
                      setMembersList((prev) => {
                        const next = [
                          ...prev,
                          {
                            id: randomId,
                            name: `مضيف #${randomId}`,
                            role: 'مضيف معتمد 🎙️',
                            score: '0 🪙',
                            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                          },
                        ];
                        setAgencyMemberCount(next.length);
                        return next;
                      });
                      showToast('تمت إضافة عضو جديد للوكالة وارتفع عدد الأعضاء! 📈');
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>+ إضافة عضو تجريبي (يرتفع)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (membersList.length <= 1) {
                        showToast('لا يمكن حذف مدير الوكالة!');
                        return;
                      }
                      sounds.playClick();
                      setMembersList((prev) => {
                        const next = prev.slice(0, prev.length - 1);
                        setAgencyMemberCount(next.length);
                        return next;
                      });
                      showToast('تمت إزالة عضو وقل عدد الأعضاء! 📉');
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-300 text-[11px] font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>- إزالة عضو (يقل)</span>
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
                    <span className="text-sm font-black text-emerald-400">1 مضيف 🟢</span>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">قائمة المضيفين وصناع المحتوى:</span>
                  {membersList.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover border border-amber-300"
                        />
                        <div className="text-right">
                          <h5 className="font-black text-white">{m.name}</h5>
                          <span className="text-[10px] text-amber-300 font-bold block">{m.role}</span>
                          <span className="text-[9px] text-slate-400 font-mono">ID: {m.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            showToast(`تم إرسال رسالة تنبيه للمضيف ${m.name}`);
                          }}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center cursor-pointer transition active:scale-95"
                          title="مراسلة"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        {idx !== 0 && (
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setMembersList((prev) => {
                                const next = prev.filter((_, i) => i !== idx);
                                setAgencyMemberCount(next.length);
                                return next;
                              });
                              showToast(`تم إزالة العضو ${m.name}`);
                            }}
                            className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center cursor-pointer transition active:scale-95"
                            title="إزالة العضو"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="font-mono font-bold text-amber-400 text-xs mr-1">{m.score}</span>
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
                  <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400 flex items-center justify-center text-yellow-300">
                    <Gift className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-black text-yellow-200">سجل الأرباح والمكافآت</h4>
                </div>

                <button
                  onClick={() => setActiveSubView(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-950/40 to-slate-900 border border-amber-400/40 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-300">رصيد أرباح وعمولات الوكيل المتاحة</span>
                  <h3 className="text-3xl font-black text-emerald-400 font-mono tracking-tight">$ {agentBalance}</h3>
                  <p className="text-[11px] text-amber-300 font-bold">نسبة عمولة الوكالة الحالية: 0% من دعم المضيفين</p>
                  <button
                    onClick={() => {
                      sounds.playLevelUp();
                      showToast('تم تقديم طلب سحب الأرباح إلى المحفظة الإلكترونية بنجاح! 💳');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md active:scale-95 transition mt-2 cursor-pointer"
                  >
                    سحب الأرباح الآن
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-right">
                  <h5 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    <span>مكافآت التميز الشهرية:</span>
                  </h5>
                  <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-300">مكافأة أفضل 3 وكالات في العراق</span>
                    <span className="font-bold text-amber-400 font-mono">+$ 0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-300">بونص ساعات البث الإضافية</span>
                    <span className="font-bold text-emerald-400 font-mono">+$ 0.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
