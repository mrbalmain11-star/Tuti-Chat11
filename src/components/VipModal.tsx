/* V002 staging APK build marker: vvv2 — original VIP layout preserved. */
import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  User,
  Shield,
  Crown,
  Volume2,
  Palette,
  Award,
  Copy,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { VipName } from './VipName';
import { fetchMyProfile, stagingBackend } from '../services/stagingBackend';
import { VipBadge, VIP_BEAST_METADATA } from './VipBadge';

export interface VipTierData {
  level: number;
  name: string;
  beastName: string;
  price: number;
  durationDays: number;
  cardImage: string;
  themeColor: string;
  glowColor: string;
  badgeGradient: string;
  borderClass: string;
  perks: string[];
}

export const VIP_TIERS: VipTierData[] = [
  {
    level: 1,
    name: 'VIP 1',
    beastName: 'غزال الريم الأخضر الأسطوري',
    price: 20000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0038_55a88cbb.jpg',
    themeColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    badgeGradient: 'from-emerald-700 via-green-500 to-emerald-800',
    borderClass: 'border-emerald-500/60',
    perks: [
      'شعار VIP1 الأخضر اللافت للنظر',
      'إطار الصورة الشخصية الذهبي الملكي VIP 1',
      'موجة مايك دائرية خضراء مخصصة للكلام',
      'فقاعة دردشة حصرية في الشاشة العامة للروم',
      'لون اسم ولمعان حصري مميز',
      'استرداد كوينز بنسبة 5% عند الشحن',
    ],
  },
  {
    level: 2,
    name: 'VIP 2',
    beastName: 'الفرس السماوي الأزرق المجنح',
    price: 60000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0037_14e3217b.jpg',
    themeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    badgeGradient: 'from-cyan-600 via-sky-400 to-blue-700',
    borderClass: 'border-cyan-400/60',
    perks: [
      'جميع مميزات وتأثيرات رتبة VIP 1',
      'شعار VIP2 الأزرق السماوي البراق',
      'إطار فرس السماء الجليدي المتلألئ',
      'موجة مايك بلورية زرقاء مخصصة للكلام',
      'فقاعة دردشة سحرية متوهجة',
      'لافتة دخول الغرفة السماوية الفاخرة',
      'لون اسم أزرق وأصفر لامع في كافة القوائم',
    ],
  },
  {
    level: 3,
    name: 'VIP 3',
    beastName: 'الذئب القمري الكوبالت البنفسجي',
    price: 200000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0036_39fcf42e.jpg',
    themeColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    badgeGradient: 'from-purple-700 via-fuchsia-500 to-indigo-900',
    borderClass: 'border-purple-400/60',
    perks: [
      'جميع مميزات ورتب VIP 1 و VIP 2',
      'شعار VIP3 الكوبالت الأرجواني المتوهج',
      'إطار الذئب الأسطوري البنفسجي مع أجنحة كريستالية',
      'موجة مايك بنفسجية متدفقة بأمواج كهرومغناطيسية',
      'فقاعة دردشة أرجوانية مرصعة بالجواهر',
      'لافتة دخول فاخرة مع صواعق سحرية',
      'حصانة ضد الكتم في الرومات العامة',
    ],
  },
  {
    level: 4,
    name: 'VIP 4',
    beastName: 'الصقر الأرجواني والتاج الملكي',
    price: 600000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0039_a41ca8b9.jpg',
    themeColor: '#9333ea',
    glowColor: 'rgba(147, 51, 234, 0.65)',
    badgeGradient: 'from-purple-800 via-violet-600 to-indigo-950',
    borderClass: 'border-purple-300/70',
    perks: [
      'جميع مميزات ورتب VIP 1 إلى VIP 3',
      'شعار VIP4 الملكي الفاخر',
      'إطار التاج الأرجواني الملكي عيار 24 مع أجنحة',
      'موجة مايك أرجوانية ملكية ذات هالة ثلاثية الأبعاد',
      'فقاعة دردشة أرجوانية نيون ملكية',
      'إشعار دخول ملفت للنظر يظهر للغرفة بأكملها',
      'لون اسم مميز يلمع بتدرجات البنفسجي والذهب',
    ],
  },
  {
    level: 5,
    name: 'VIP 5',
    beastName: 'الفهد الذهبي الناري',
    price: 1500000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0040_d3aa3c77.jpg',
    themeColor: '#e11d48',
    glowColor: 'rgba(225, 29, 72, 0.7)',
    badgeGradient: 'from-rose-600 via-amber-500 to-red-800',
    borderClass: 'border-rose-400/70',
    perks: [
      'جميع مميزات ورتب VIP 1 إلى VIP 4',
      'شعار VIP5 الذهبي الناري',
      'إطار الفهد الياقوتي المتوهج بالنيران الذهبية',
      'موجة مايك ياقوتية نارية ثلاثية الأبعاد',
      'فقاعة دردشة ذهبية ياقوتية بنقوش ملكية',
      'موكب دخول فخم مع وميض ناري وألعاب نارية',
      'أولوية الجلوس على مايكات الغرفة',
    ],
  },
  {
    level: 6,
    name: 'VIP 6',
    beastName: 'الأسد البرونزي الزمردي الملكي',
    price: 3500000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0048_ecccc119.jpg',
    themeColor: '#059669',
    glowColor: 'rgba(5, 150, 105, 0.75)',
    badgeGradient: 'from-emerald-600 via-teal-400 to-green-900',
    borderClass: 'border-emerald-300/80',
    perks: [
      'جميع مميزات ورتب VIP 1 إلى VIP 5',
      'شعار VIP6 البرونزي المرصع بالأحجار',
      'إطار الأسد الزمردي عيار 24 مع تاج إمبراطوري',
      'موجة مايك زمردية مشعة بأشعة شمسية حية',
      'فقاعة دردشة خضراء زمردية فائقة الندرة',
      'لافتة دخول إمبراطورية تعبر شاشة الروم',
      'حصانة تامة من الطرد العشوائي',
    ],
  },
  {
    level: 7,
    name: 'VIP 7',
    beastName: 'النمر اللهبي الأزرق الفاخر',
    price: 8000000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0047_a9a12b99.jpg',
    themeColor: '#2563eb',
    glowColor: 'rgba(37, 99, 235, 0.8)',
    badgeGradient: 'from-blue-600 via-sky-400 to-indigo-900',
    borderClass: 'border-blue-300/80',
    perks: [
      'جميع مميزات ورتب VIP 1 إلى VIP 6',
      'شعار VIP7 النمر اللهبي الأزرق الصاعق',
      'إطار الأجنحة الفضية الملكية الماسية',
      'موجة مايك صاعقة متدفقة بنبضات حية',
      'فقاعة دردشة ماسية ببريق النجوم',
      'طيران النمر الأزرق عبر شاشة الروم عند الدخول',
      'أولوية الظهور الدائم في قوائم المتصدرين',
    ],
  },
  {
    level: 8,
    name: 'VIP 8',
    beastName: 'الفيل الملكي الوردي الأسطوري',
    price: 18000000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0046_be379335.jpg',
    themeColor: '#ca8a04',
    glowColor: 'rgba(202, 138, 4, 0.85)',
    badgeGradient: 'from-amber-500 via-yellow-300 to-stone-900',
    borderClass: 'border-yellow-200/90',
    perks: [
      'جميع مميزات ورتب VIP 1 إلى VIP 7',
      'شعار VIP8 الوردي والذهبي الإمبراطوري',
      'تاج وإطار العرش الملكي الماسي والوردي',
      'موجة مايك نادرة بتأثيرات بلورية مشعة',
      'فقاعة دردشة ماسية نادرة منقوشة بالذهب',
      'موكب إمبراطوري كامل ومؤثرات سينمائية عند الدخول',
      'مدير حسابات ودعم عملاء VIP على مدار 24 ساعة',
    ],
  },
  {
    level: 9,
    name: 'VIP 9',
    beastName: 'التنين القرمزي الكوني الناري',
    price: 35000000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0043_a4d1533d.jpg',
    themeColor: '#7c3aed',
    glowColor: 'rgba(124, 58, 237, 0.9)',
    badgeGradient: 'from-purple-900 via-fuchsia-600 to-amber-500',
    borderClass: 'border-purple-200/90',
    perks: [
      'جميع مميزات ورتب VIP 1 إلى VIP 8',
      'شعار VIP9 التنين القرمزي الناري',
      'إطار تنين المجرات الأسطوري المتحرك',
      'موجة مايك كونية ثلاثية الأبعاد لا مثيل لها',
      'فقاعة شات كونية مرصعة بالشهب',
      'موكب تنين ناري ومطر ألعاب نارية عند الدخول لجميع الغرف',
      'حصانة مطلقة من أي كتم أو طرد في التطبيق',
    ],
  },
  {
    level: 10,
    name: 'VIP 10',
    beastName: 'الأسد الإمبراطوري المتوج بالياقوت',
    price: 70000000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0045_5e019064.jpg',
    themeColor: '#be123c',
    glowColor: 'rgba(190, 18, 60, 0.95)',
    badgeGradient: 'from-red-600 via-rose-500 to-amber-500',
    borderClass: 'border-amber-300 ring-1 ring-amber-400',
    perks: [
      'جميع مميزات ورتب VIP 1 إلى VIP 9',
      'شعار VIP10 الإمبراطوري بالذهب والياقوت الأحمر',
      'إطار الأسد المتوج عيار 24 مع ياقوت نقي',
      'موجة مايك ياقوتية ملكية تشع بالطاقة الشمسية',
      'فقاعة شات ملكية منقوشة بالأحجار الكريمة',
      'إعلان عاجل على مستوى التطبيق عند دخول أي غرفة',
      'خدمة كبار الشخصيات المباشرة مع إدارة توتي شات',
    ],
  },
  {
    level: 11,
    name: 'SVIP 11',
    beastName: 'العنقاء الإمبراطورية وأجنحة النور',
    price: 120000000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0041_e4885212.jpg',
    themeColor: '#0d9488',
    glowColor: 'rgba(13, 148, 136, 0.95)',
    badgeGradient: 'from-purple-900 via-fuchsia-600 to-amber-400',
    borderClass: 'border-cyan-300 ring-2 ring-purple-500',
    perks: [
      'جميع مميزات ورتب VIP 1 إلى VIP 10',
      'شارة SVIP11 الأسطورية فائقة التميز',
      'إطار العنقاء الماسي الأزرق والذهبي الإمبراطوري',
      'موجة مايك أسطورية تضيء الغرفة بأمواج النور',
      'فقاعة شات أسطورية بتأثيرات حية',
      'دخولية أسطورية مخصصة تحبس أنفاس الحاضرين',
      'تثبيت غرفتك الخاصة في أعلى قائمة الصفحة الرئيسية',
    ],
  },
  {
    level: 12,
    name: 'SVIP 12',
    beastName: 'عرش السيادة والخلود الأعظم عيار 24',
    price: 200000000,
    durationDays: 30,
    cardImage: '/assets/aistudio/IMG-20261026-WA0042_9d9a2962.jpg',
    themeColor: '#1e3a8a',
    glowColor: 'rgba(245, 158, 11, 1)',
    badgeGradient: 'from-amber-600 via-yellow-400 to-amber-700',
    borderClass: 'border-yellow-200 ring-2 ring-amber-400',
    perks: [
      'الرتبة العظمى المطلقة في توتي شات (SVIP 12)',
      'شارة SVIP12 الخالدة بذهب عيار 24 والياقوت الأزرق',
      'إطار عرش السيادة والخلود الأعظم الأكثر فخامة في العالم',
      'موجة مايك العرش المطلق ثلاثية الأبعاد ببريق الماس',
      'فقاعة دردشة ذهبية ماسية إمبراطورية مطلقة',
      'موكب دخول ملكي عالمي يعلن في جميع غرف التطبيق',
      'لمعان اسم إمبراطوري فائق لا يملكه سواك',
    ],
  },
];

type PopupType = 'badge' | 'nickname' | 'mic' | 'headframe' | null;

export const VipModal: React.FC = () => {
  const {
    openVipModal,
    setOpenVipModal,
    vipModalInitialPopup,
    setVipModalInitialPopup,
    currentUser,
    updateUserProfile,
    setOpenRechargeModal,
    conversations,
  } = useApp();

  const [myPublicId, setMyPublicId] = useState<number | null>(null);
  const [vipPurchaseBusy, setVipPurchaseBusy] = useState(false);
  useEffect(() => {
    if (!openVipModal) { setMyPublicId(null); return; }
    let active = true;
    void fetchMyProfile().then(profile => {
      if (active) setMyPublicId(profile?.public_id ?? null);
    }).catch(error => console.error('Unable to load VIP public ID:', error));
    return () => { active = false; };
  }, [openVipModal, currentUser.id]);

  // Active VIP tier index (0 to 11 for VIP 1 to SVIP 12)
  const [activeTierIdx, setActiveTierIdx] = useState<number>(() => {
    return currentUser.vipLevel > 0 ? Math.max(0, Math.min(11, currentUser.vipLevel - 1)) : 0;
  });
  const activeTier = VIP_TIERS[activeTierIdx];

  // Active detail popup modal (Matching the 4 uploaded screenshots)
  const [activePopup, setActivePopup] = useState<PopupType>(null);

  useEffect(() => {
    if (vipModalInitialPopup) {
      setActivePopup(vipModalInitialPopup);
      setVipModalInitialPopup(null);
    }
  }, [vipModalInitialPopup, setVipModalInitialPopup]);

  // Send to friend modal state
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [targetFriendId, setTargetFriendId] = useState<string>('');
  const [giftSuccessToast, setGiftSuccessToast] = useState<string | null>(null);

  if (!openVipModal) return null;

  // Determine if the user already owns this tier or higher
  const isAlreadyOwned = currentUser.vipLevel >= activeTier.level;
  const isCurrentActive = currentUser.vipLevel === activeTier.level;

  const handleNextTier = () => {
    sounds.playClick();
    setActiveTierIdx((prev) => (prev + 1) % VIP_TIERS.length);
  };

  const handlePrevTier = () => {
    sounds.playClick();
    setActiveTierIdx((prev) => (prev - 1 + VIP_TIERS.length) % VIP_TIERS.length);
  };

  // All VIP purchases are settled atomically by Supabase, never by profile edits.
  const handleAction = async () => {
    if (vipPurchaseBusy) return;
    sounds.playClick();
    if (isAlreadyOwned) {
      setGiftSuccessToast('هذه الرتبة مملوكة بالفعل؛ لا حاجة إلى شراء جديد.');
      return;
    }
    if (!stagingBackend) {
      alert('تعذر الاتصال بخادم الشراء.');
      return;
    }
    setVipPurchaseBusy(true);
    try {
      const { data, error } = await stagingBackend.rpc('staging_purchase_vip', {
        p_tier: activeTier.level,
        p_request_id: crypto.randomUUID(),
      });
      if (error) throw error;
      if (!data?.success) throw new Error('VIP purchase not confirmed');
      window.dispatchEvent(new Event('totichat:wallet-changed'));
      updateUserProfile({ vipLevel: Number(data.tier), vipExpiry: String(data.expiresAt) });
      sounds.playLevelUp();
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 },
        colors: [activeTier.themeColor, '#f59e0b', '#ffd700', '#ffffff'] });
      setGiftSuccessToast(`🎉 تم شراء ${activeTier.name} بنجاح لمدة 30 يوماً!`);
    } catch (error) {
      console.error('VIP purchase rejected:', error);
      alert('فشل شراء VIP. لم يتم تأكيد أي خصم. تحقق من الرصيد والاتصال ثم حاول مجدداً.');
    } finally {
      setVipPurchaseBusy(false);
    }
  };

  const handleSendGift = () => {
    alert('إهداء VIP متوقف مؤقتاً حتى ربطه بعملية شراء آمنة على الخادم. لم يتم خصم أي عملات.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none overflow-hidden font-['Cairo',sans-serif]"
      dir="rtl"
    >
      <div className="relative w-full max-w-md h-full min-h-0 flex flex-col justify-between overflow-hidden shadow-2xl bg-[#030107] text-white">
        {/* ========================================================================= */}
        {/* CELESTIAL BACKGROUND WITH SPOTLIGHT                                       */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-35 transition-all duration-700"
            style={{ backgroundColor: activeTier.themeColor }}
          />
          <div className="absolute inset-0 bg-radial from-white/5 via-black/85 to-black opacity-70" />
        </div>

        {/* ========================================================================= */}
        {/* HEADER: Close Button + Title + Coins Balance                             */}
        {/* ========================================================================= */}
        <header className="relative z-20 pt-3 pb-2 px-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
          {/* Right in RTL: Close / Back Arrow */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenVipModal(false);
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-200 transition active:scale-90 cursor-pointer shadow-md"
            title="إغلاق"
          >
            <ChevronRight className="w-5 h-5 text-amber-200 stroke-[2.5]" />
          </button>

          {/* Center: VIP Title */}
          <div className="text-center">
            <h2 className="text-base font-black text-amber-100 tracking-wide flex items-center justify-center gap-1.5">
              <span>👑 مركز كبار الشخصيات VIP</span>
            </h2>
            <span className="text-[10px] text-amber-400/90 font-bold block">
              {activeTier.name} - {activeTier.beastName}
            </span>
          </div>

          {/* Left in RTL: Current Coins Balance */}
          <div
            onClick={() => {
              sounds.playClick();
              setOpenRechargeModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-900 transition active:scale-95"
            title="انقر للشحن"
          >
            <span className="font-mono font-black">{(currentUser.coins ?? 0).toLocaleString()}</span>
            <span>🪙</span>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* TOP VIP LEVEL SELECTOR (VIP 1 TO SVIP 12)                                 */}
        {/* ========================================================================= */}
        <div className="relative z-20 px-3 py-2 bg-black/60 border-b border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {VIP_TIERS.map((tier, idx) => {
              const isSelected = activeTierIdx === idx;
              const isOwned = currentUser.vipLevel >= tier.level;
              return (
                <button
                  key={tier.level}
                  onClick={() => {
                    sounds.playClick();
                    setActiveTierIdx(idx);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105 border border-yellow-200'
                      : isOwned
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/60'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                  }`}
                >
                  <span>{tier.name}</span>
                  {isOwned && <span className="text-[10px] text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCROLLABLE MAIN CONTENT                                                  */}
        {/* ========================================================================= */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar px-3 sm:px-4 pb-28 space-y-4 pt-2">
          {/* VIP POSTER CARD SHOWCASE WITH NAVIGATION ARROWS */}
          <div className="relative flex items-center justify-center">
            {/* Previous Tier Arrow (<) */}
            <button
              onClick={handlePrevTier}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black border border-white/20 text-amber-300 flex items-center justify-center active:scale-90 transition z-20 cursor-pointer shadow-lg"
              title="السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Poster Card Artwork Image from Uploads */}
            <div
              className="relative w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden border-2 shadow-[0_0_30px_rgba(0,0,0,0.9)] bg-black"
              style={{ borderColor: activeTier.themeColor }}
            >
              <img
                src={activeTier.cardImage}
                alt={activeTier.name}
                className="block w-full h-auto object-contain select-none"
              />

              {/* Status Badge overlay in top left of image */}
              <div className="absolute top-3 left-3 z-20">
                {isAlreadyOwned ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white font-black text-[11px] shadow-lg border border-emerald-300 flex items-center gap-1 backdrop-blur-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>بالفعل تمتلك</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-black/70 text-amber-300 font-mono font-black text-[11px] shadow-lg border border-amber-400/60 backdrop-blur-xs">
                    {activeTier.price.toLocaleString()} 🪙
                  </span>
                )}
              </div>

              {/* Overlaid User Profile on top-right circle and banner of the poster artwork */}
              {/* "بحيث يضهر بلدائره صوره المستخدمين وتحته الإسم ترتيب وتطبيق الإشارات الموجوده بلحساب مثل ماهيه" */}

              {/* 1. Circular User Avatar positioned directly inside the printed golden circular ring */}
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  top: '22%',
                  left: '82%',
                  transform: 'translate(-50%, -50%)',
                  width: '17.8%',
                  aspectRatio: '1 / 1',
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.7)] bg-slate-900 relative isolate">
                  {currentUser.avatar ? (
                    <img
                      key={currentUser.avatar}
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      onLoad={(event) => {
                        const image = event.currentTarget;
                        // A full phone screenshot is not a profile portrait.
                        // Never display the entire profile screen inside the VIP frame.
                        if (image.naturalWidth > 0 && image.naturalHeight / image.naturalWidth > 1.45) {
                          image.style.display = 'none';
                        }
                      }}
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <span className="absolute inset-0 -z-10 flex items-center justify-center text-amber-100 font-black text-lg bg-gradient-to-br from-amber-900 to-slate-950">
                    {(currentUser.nickname || currentUser.name || '؟').trim().charAt(0)}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 pointer-events-none" />
                </div>
              </div>

              {/* 2. User Name in the golden banner directly beneath the circular avatar */}
              <div
                className="absolute z-20 pointer-events-none flex items-center justify-center"
                style={{
                  top: '30%',
                  left: '82%',
                  transform: 'translate(-50%, -50%)',
                  width: '18%',
                  height: '2.5%',
                  overflow: 'hidden',
                }}
              >
                <VipName
                  name={currentUser.nickname || currentUser.name || 'مستخدم'}
                  vipLevel={activeTier.level}
                  className="text-[7px] sm:text-[8px] leading-none font-black truncate whitespace-nowrap text-center block drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-full min-w-0 px-0.5"
                  fallbackColor="text-amber-100"
                />
              </div>

              {/* 3. Account signals / Badges arranged below name banner (مثل ما هيه بالحساب) */}
              <div
                className="absolute z-20 pointer-events-none flex items-center justify-center gap-0.5 flex-nowrap min-w-0 overflow-hidden"
                style={{
                  top: '35%',
                  left: '82%',
                  transform: 'translate(-50%, -50%)',
                  width: '23%',
                  maxHeight: '3.5%',
                }}
              >
                <span className="shrink-0 rounded-full border border-amber-300/80 bg-black/80 px-1 text-[9px] font-black text-amber-200 whitespace-nowrap">{`VIP${activeTier.level}`}</span>
                <span className="text-[10px] leading-none select-none">{currentUser.countryFlag || '🇮🇶'}</span>
                <span className="text-[9px] font-bold text-cyan-300">
                  {currentUser.gender === 'أنثى' ? '♀' : '♂'}
                </span>
              </div>
            </div>

            {/* Next Tier Arrow (>) */}
            <button
              onClick={handleNextTier}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black border border-white/20 text-amber-300 flex items-center justify-center active:scale-90 transition z-20 cursor-pointer shadow-lg"
              title="التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* User Account VIP Showcase Card: "ترتيب وتطبيق الإشارات الموجودة بالحساب مثل ما هيه" */}
          <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/35 to-slate-900/60 border border-amber-500/35 rounded-2xl p-3.5 backdrop-blur-md shadow-xl flex items-center gap-3.5">
            {/* Avatar Circle with active VIP glow ring */}
            <div className="relative w-16 h-16 rounded-full shrink-0 p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_16px_rgba(245,158,11,0.6)]">
              <div className="w-full h-full rounded-full overflow-hidden border border-amber-100 bg-slate-900">
                <img
                  src={
                    currentUser.avatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&q=80'
                  }
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-0.5 text-xs">👑</div>
            </div>

            {/* User Details & Arranged Account Credentials */}
            <div className="flex-1 min-w-0 text-right">
              {/* Name with active VIP styling */}
              <div className="flex items-center gap-1.5">
                <VipName
                  name={currentUser.name || currentUser.nickname || 'دولة العراق'}
                  vipLevel={activeTier.level}
                  className="text-base font-black truncate"
                />
                <span className="text-amber-400 text-xs">✨</span>
              </div>

              {/* Arranged Account Signals / Credentials Row (مثل ما هيه بالحساب) */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {/* 1. VIP Beast Badge */}
                <VipBadge vipLevel={activeTier.level} size="compact" />

                {/* 2. Level Badge (Lv.101 / wealth level) */}
                <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[10px] flex items-center gap-0.5 shadow-xs">
                  <span>🌸</span>
                  <span>
                    {currentUser.wealthLevel && currentUser.wealthLevel > 1
                      ? currentUser.wealthLevel
                      : 101}
                  </span>
                </div>

                {/* 3. Gender & Age */}
                <div className="px-2 py-0.5 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center gap-0.5">
                  <span>{currentUser.gender === 'أنثى' ? '♀' : '♂'}</span>
                  <span>{currentUser.gender === 'أنثى' ? '24' : '27'}</span>
                </div>

                {/* 4. Country Flag */}
                <span className="text-sm select-none">{currentUser.countryFlag || '🇮🇶'}</span>
              </div>

              {/* ID Row with copy */}
              <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-slate-400">
                <button
                  onClick={() => {
                    sounds.playClick();
                    const copyId = myPublicId?.toString();
                    if (!copyId) return;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(copyId);
                    }
                    setGiftSuccessToast(`تم نسخ المعرف: ${copyId} بنجاح 📋`);
                    setTimeout(() => setGiftSuccessToast(null), 2500);
                  }}
                  className="flex items-center gap-1 hover:text-white transition active:scale-95 cursor-pointer"
                  title="نسخ المعرف"
                >
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>ID: {myPublicId ?? '—'}</span>
                </button>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-600/70 text-cyan-200 text-[9px] font-bold">
                  ID
                </span>
                <span className="px-2 py-0.2 rounded-full bg-pink-600/60 text-pink-200 text-[9px] font-bold">
                  🎙️ موثق
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4 INTERACTIVE PRIVILEGES BUTTONS (MATCHING THE 4 UPLOADED SCREENSHOTS)     */}
          {/* ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-black text-amber-200">
                💎 امتيازات وخصائص {activeTier.name} الحصرية:
              </span>
              <span className="text-[10px] text-slate-400">انقر للعرض</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Feature 1: شعار VIP (VIP Badge) */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setActivePopup('badge');
                }}
                className="p-3 rounded-2xl bg-gradient-to-b from-white/10 to-black/60 border border-amber-500/30 hover:border-amber-400 text-right transition active:scale-98 cursor-pointer flex flex-col justify-between h-20 shadow-md group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">🛡️</span>
                  <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-200 block">شعار VIP</span>
                  <span className="text-[10px] text-slate-400">شعارات الحيوانات الملكية 1-12</span>
                </div>
              </button>

              {/* Feature 2: غطاء رأس VIP (VIP Headframe / Crown) */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setActivePopup('headframe');
                }}
                className="p-3 rounded-2xl bg-gradient-to-b from-white/10 to-black/60 border border-amber-500/30 hover:border-amber-400 text-right transition active:scale-98 cursor-pointer flex flex-col justify-between h-20 shadow-md group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">👑</span>
                  <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-200 block">غطاء رأس VIP</span>
                  <span className="text-[10px] text-slate-400">تيجان وإطارات صور مذهلة</span>
                </div>
              </button>

              {/* Feature 3: موجة مايك حصرية (Exclusive Mic Wave) */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setActivePopup('mic');
                }}
                className="p-3 rounded-2xl bg-gradient-to-b from-white/10 to-black/60 border border-amber-500/30 hover:border-amber-400 text-right transition active:scale-98 cursor-pointer flex flex-col justify-between h-20 shadow-md group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">🎙️</span>
                  <Volume2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-200 block">موجة مايك حصرية</span>
                  <span className="text-[10px] text-slate-400">موجات صوت مخصصة للكلام</span>
                </div>
              </button>

              {/* Feature 4: لون اسم مميز (Custom Nickname Color) */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setActivePopup('nickname');
                }}
                className="p-3 rounded-2xl bg-gradient-to-b from-white/10 to-black/60 border border-amber-500/30 hover:border-amber-400 text-right transition active:scale-98 cursor-pointer flex flex-col justify-between h-20 shadow-md group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">✨</span>
                  <Palette className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-200 block">لون اسم مميز</span>
                  <span className="text-[10px] text-slate-400">ألوان حصرية ولمعان VIP</span>
                </div>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DETAILED PERKS LIST                                                       */}
          {/* ========================================================================= */}
          <div className="pt-2">
            <h3 className="text-xs font-black text-amber-300 mb-2 flex items-center gap-1.5">
              <span>✦ قائمة مزايا رتبة {activeTier.name}:</span>
            </h3>
            <div className="space-y-2">
              {activeTier.perks.map((perk, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/5"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]"
                    style={{
                      backgroundColor: `${activeTier.themeColor}30`,
                      color: activeTier.themeColor,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs text-slate-200 leading-snug">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM FIXED ACTION BAR: Price + Already Owned / Buy Now Button           */}
        {/* ========================================================================= */}
        <footer className="relative z-30 px-4 py-3 bg-[#0a0414]/98 backdrop-blur-md border-t border-amber-600/40 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
          {/* Right in RTL: Price Tag in Coins */}
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold">سعر الاشتراك (30 يوماً):</span>
            <div className="flex items-center gap-1 font-mono font-black text-amber-300 text-sm">
              <span>{activeTier.price.toLocaleString()}</span>
              <span className="text-xs font-sans text-amber-400">كوينز 🪙</span>
            </div>
          </div>

          {/* Left in RTL: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Gift to Friend */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowSendModal(true);
              }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-amber-200 text-xs font-black transition active:scale-95 cursor-pointer"
              title="إهداء لصديق"
            >
              إهداء 🎁
            </button>

            {/* Main Action Button: بالفعل تمتلك / شراء الآن */}
            {isAlreadyOwned ? (
              <button
                onClick={handleAction}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5 ${
                  isCurrentActive
                    ? 'bg-emerald-600 border border-emerald-300 text-white shadow-emerald-900/50'
                    : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 border border-yellow-200'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isCurrentActive ? 'بالفعل تمتلك (مفعل)' : 'بالفعل تمتلك (تعيين)'}</span>
              </button>
            ) : (
              <button
                onClick={handleAction}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer shadow-[0_2px_15px_rgba(245,158,11,0.6)] border border-yellow-200 flex items-center gap-1.5"
              >
                <span>شراء الآن</span>
                <span>🪙</span>
              </button>
            )}
          </div>
        </footer>

        {/* ========================================================================= */}
        {/* TOAST MESSAGE                                                             */}
        {/* ========================================================================= */}
        {giftSuccessToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#160829] border border-amber-400 text-amber-200 text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{giftSuccessToast}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4 SUB-MODALS FROM UPLOADED SCREENSHOTS (1:1 FIDELITY)                      */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 4 SUB-MODALS FROM UPLOADED SCREENSHOTS (1:1 FIDELITY)                      */}
        {/* ========================================================================= */}
        {activePopup && (
          <div
            onClick={() => setActivePopup(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#131315] border-t sm:border border-amber-500/30 rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl flex flex-col items-center animate-in slide-in-from-bottom-5 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar text-white"
            >
              {/* TOP HEADER: Matching Screenshot 0e894276.jpg */}
              <div className="w-full flex items-center justify-between pb-2">
                {/* Close X Button on Left */}
                <button
                  onClick={() => setActivePopup(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-90 cursor-pointer shadow-sm"
                  title="إغلاق"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Center Capsule Banner: متاح لمستخدمي VIP 1 أو أعلى */}
                <div className="py-1.5 px-5 rounded-full bg-[#242426] border border-amber-400/25 text-[#E6B762] font-black text-xs shadow-inner select-none tracking-wide">
                  متاح لمستخدمي VIP 1 أو أعلى
                </div>

                {/* Right Tab Switcher or Info */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    // Toggle through the other 3 perks if desired
                    const order: PopupType[] = ['badge', 'headframe', 'mic', 'nickname'];
                    const nextIdx = ((order.indexOf(activePopup) + 1) % order.length);
                    setActivePopup(order[nextIdx]);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-amber-300 flex items-center justify-center transition active:scale-90 cursor-pointer text-xs font-bold"
                  title="الميزة التالية"
                >
                  {activePopup === 'badge' ? '👑' : activePopup === 'headframe' ? '🎙️' : activePopup === 'mic' ? '✨' : '🛡️'}
                </button>
              </div>

              {/* ============================================================= */}
              {/* SUB-MODAL 1: شعار VIP (Matching Screenshot 0e894276.jpg 1:1)   */}
              {/* ============================================================= */}
              {activePopup === 'badge' && (
                <div className="w-full flex flex-col items-center pt-2">
                  {/* Grid of the 12 Badges (4 Rows x 3 Columns) */}
                  <div className="grid grid-cols-3 gap-x-2.5 gap-y-3.5 w-full py-2">
                    {VIP_TIERS.map((tier, idx) => {
                      const isSelected = activeTierIdx === idx;
                      const isOwned = currentUser.vipLevel >= tier.level;

                      return (
                        <div
                          key={tier.level}
                          onClick={() => {
                            sounds.playClick();
                            setActiveTierIdx(idx);
                          }}
                          className={`relative flex items-center justify-center p-1.5 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                            isSelected
                              ? 'scale-105 ring-2 ring-amber-400 bg-white/10 shadow-[0_0_16px_rgba(250,204,21,0.5)]'
                              : 'hover:scale-102 opacity-85 hover:opacity-100 bg-black/20 hover:bg-white/5'
                          }`}
                          title={`${tier.name} - انقر للاختيار`}
                        >
                          <img
                            src={`/assets/vip_badges/vip_${tier.level}.png`}
                            alt={tier.name}
                            className="w-full h-auto object-contain max-h-12 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                          />

                          {/* Ownership indicator */}
                          {isOwned && (
                            <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black border border-emerald-300 shadow-md">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Title & Description below badges (Matching Screenshot) */}
                  <div className="text-center pt-3 pb-1">
                    <h4 className="text-lg font-black text-white tracking-wide">شعار VIP</h4>
                    <p className="text-xs text-slate-400 mt-1">شعار VIP لافت للنظر</p>
                  </div>

                  {/* 12 Pagination Dots (Matching Screenshot: 12 circles with 1 filled) */}
                  <div className="flex items-center justify-center gap-2 py-2.5" dir="ltr">
                    {VIP_TIERS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          sounds.playClick();
                          setActiveTierIdx(i);
                        }}
                        className={`transition-all duration-200 cursor-pointer ${
                          i === activeTierIdx
                            ? 'w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] scale-110'
                            : 'w-2 h-2 rounded-full border border-white/40 bg-transparent hover:border-white/70'
                        }`}
                        aria-label={`شعار ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Bottom Action Button: تطبيق الشعار أو إلى الشحن (Matching Screenshot) */}
                  <div className="w-full pt-2">
                    {currentUser.vipLevel >= activeTier.level ? (
                      <button
                        onClick={() => {
                          sounds.playLevelUp();
                          updateUserProfile({
                            vipLevel: activeTier.level,
                            vipExpiry: '2028/01/01',
                          });
                          confetti({
                            particleCount: 80,
                            spread: 70,
                            origin: { y: 0.65 },
                            colors: [activeTier.themeColor, '#f59e0b', '#ffffff'],
                          });
                          setGiftSuccessToast(`✨ تم تفعيل شعار ${activeTier.name} على حسابك بنجاح!`);
                          setTimeout(() => setGiftSuccessToast(null), 3000);
                        }}
                        className="w-full h-12.5 rounded-full bg-gradient-to-r from-[#FFE58A] via-[#FFD666] to-[#F5A623] hover:brightness-105 active:scale-98 transition shadow-[0_4px_18px_rgba(245,166,35,0.45)] cursor-pointer flex items-center justify-center gap-2 text-[#3D2105] font-black text-sm"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>
                          {currentUser.vipLevel === activeTier.level
                            ? 'الشعار مفعل حالياً ✓'
                            : 'تطبيق الشعار'}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          if ((currentUser.coins ?? 0) >= activeTier.price) {
                            handleAction();
                          } else {
                            setActivePopup(null);
                            setOpenRechargeModal(true);
                          }
                        }}
                        className="w-full h-12.5 rounded-full bg-gradient-to-r from-[#FFE58A] via-[#FFD666] to-[#F5A623] hover:brightness-105 active:scale-98 transition shadow-[0_4px_18px_rgba(245,166,35,0.45)] cursor-pointer flex items-center justify-center gap-2 text-[#3D2105] font-black text-sm"
                      >
                        <span>إلى الشحن</span>
                        <span className="font-mono text-xs opacity-80">({activeTier.price.toLocaleString()} 🪙)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* SUB-MODAL 2: غطاء رأس VIP (Matching Screenshot 350fdf65.jpg)   */}
              {/* ============================================================= */}
              {activePopup === 'headframe' && (
                <div className="w-full flex flex-col items-center space-y-3 pt-1">
                  {/* Screenshot Artwork */}
                  <div className="w-full rounded-2xl overflow-hidden border border-amber-500/30 shadow-lg">
                    <img
                      src="/assets/aistudio/Screenshot_____-__-__-__-__-__-____com.tuliling.laika_350fdf65.jpg"
                      alt="أغطية رأس VIP 1-12"
                      className="w-full h-auto object-contain max-h-[42vh]"
                    />
                  </div>

                  <div className="text-center pt-1">
                    <h4 className="text-base font-black text-amber-200">غطاء رأس VIP</h4>
                    <p className="text-xs text-slate-300 mt-0.5">غطاء رأس مذهل لجميع مستويات VIP</p>
                  </div>

                  {/* 12 Pagination Dots */}
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {VIP_TIERS.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeTierIdx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      sounds.playLevelUp();
                      setGiftSuccessToast(`تم تطبيق إطار غطاء رأس ${activeTier.name} بنجاح! 👑`);
                      setTimeout(() => setGiftSuccessToast(null), 3000);
                    }}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>تطبيق غطاء الرأس</span>
                  </button>
                </div>
              )}

              {/* ============================================================= */}
              {/* SUB-MODAL 3: موجة مايك حصرية (Matching Screenshot d9e8e6c2.jpg) */}
              {/* ============================================================= */}
              {activePopup === 'mic' && (
                <div className="w-full flex flex-col items-center space-y-3 pt-1">
                  <div className="w-full rounded-2xl overflow-hidden border border-amber-500/30 shadow-lg">
                    <img
                      src="/assets/aistudio/Screenshot_____-__-__-__-__-__-____com.tuliling.laika_d9e8e6c2.jpg"
                      alt="موجات مايك VIP 1-12"
                      className="w-full h-auto object-contain max-h-[42vh]"
                    />
                  </div>

                  <div className="text-center pt-1">
                    <h4 className="text-base font-black text-amber-200">موجة مايك حصرية</h4>
                    <p className="text-xs text-slate-300 mt-0.5">موجات مايك مخصصة للكلام في الرومات الصوتية</p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {VIP_TIERS.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeTierIdx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      sounds.playLevelUp();
                      setGiftSuccessToast(`تم تفعيل موجة المايك الحصرية لـ ${activeTier.name} 🎙️`);
                      setTimeout(() => setGiftSuccessToast(null), 3000);
                    }}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>تطبيق موجة المايك</span>
                  </button>
                </div>
              )}

              {/* ============================================================= */}
              {/* SUB-MODAL 4: لون اسم مميز (Matching Screenshot ca43fbe5.jpg)   */}
              {/* ============================================================= */}
              {activePopup === 'nickname' && (
                <div className="w-full flex flex-col items-center space-y-3 pt-1">
                  <div className="w-full rounded-2xl overflow-hidden border border-amber-500/30 shadow-lg">
                    <img
                      src="/assets/aistudio/Screenshot_____-__-__-__-__-__-____com.tuliling.laika_ca43fbe5.jpg"
                      alt="ألوان الأسماء المميزة VIP"
                      className="w-full h-auto object-contain max-h-[42vh]"
                    />
                  </div>

                  <div className="text-center pt-1">
                    <h4 className="text-base font-black text-amber-200">لون اسم مميز</h4>
                    <p className="text-xs text-slate-300 mt-0.5">لون اسم حصري لـ VIP لجميع الرتب</p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {VIP_TIERS.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeTierIdx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      sounds.playLevelUp();
                      setGiftSuccessToast(`تم تفعيل لون ولمعان الاسم الحصري لـ ${activeTier.name} ✨`);
                      setTimeout(() => setGiftSuccessToast(null), 3000);
                    }}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>تطبيق لون الاسم</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: إهداء لصديق (Gift to Friend Modal)                                 */}
        {/* ========================================================================= */}
        {showSendModal && (
          <div
            onClick={() => setShowSendModal(false)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#120824] border border-amber-500/50 rounded-3xl p-5 shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <span>🎁 إهداء اشتراك {activeTier.name}</span>
                </h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-right">
                <label className="text-xs text-slate-300 font-medium block">
                  أدخل معرف الصديق (ID) أو اختر من المحادثات:
                </label>
                <input
                  type="text"
                  value={targetFriendId}
                  onChange={(e) => setTargetFriendId(e.target.value)}
                  placeholder="مثال: 313"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono text-right"
                />
              </div>

              {/* Quick Friend Picks */}
              <div className="space-y-1.5 text-right">
                <span className="text-[11px] text-slate-400 font-medium">أصدقاء مقترحون:</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {conversations.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setTargetFriendId(c.userId)}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-amber-200 flex items-center gap-1 shrink-0"
                    >
                      <User className="w-3 h-3" />
                      <span>{c.userName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-slate-300">سعر الاشتراك (30 يوماً):</span>
                <span className="font-bold text-amber-300 font-mono">
                  {activeTier.price.toLocaleString()} كوينز 🪙
                </span>
              </div>

              {/* Send Confirmation Button */}
              <button
                onClick={handleSendGift}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-95 cursor-pointer"
              >
                تأكيد الإهداء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
