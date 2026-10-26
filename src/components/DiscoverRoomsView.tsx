import React, { useState } from 'react';
import {
  Gift,
  Coins,
  Heart,
  Building2,
  X,
  ChevronLeft,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

interface ActivityBanner {
  id: 'custom_gift' | 'global_star' | 'recharge' | 'soulmates' | 'agency';
  title: string;
  tag: string;
  tagColor: string;
  subtitle: string;
  image: string;
  badge: string;
}

const ACTIVITY_BANNERS: ActivityBanner[] = [
  {
    id: 'custom_gift',
    title: 'هدية مخصصة',
    tag: 'فعالية ملكية',
    tagColor: 'from-purple-600 to-amber-500',
    subtitle: 'صمم وأرسل هداياك المخصصة بأسمائك ورسوماتك الخاصة داخل الرومات',
    image: '/src/assets/images/custom_gift_banner_1791896374504.jpg',
    badge: '🎁 هدايا حصرية',
  },
  {
    id: 'global_star',
    title: 'النجم العالمي',
    tag: 'سباق النجوم',
    tagColor: 'from-amber-600 to-red-600',
    subtitle: 'منافسة أساطير البث والدعم في الشرق الأوسط والعالم لنيل تاج النجم',
    image: '/src/assets/images/global_star_banner_1791896393643.jpg',
    badge: '⭐ توب 1 عالمي',
  },
  {
    id: 'recharge',
    title: 'نشاط إعادة الشحن',
    tag: 'مكافآت الذهب',
    tagColor: 'from-yellow-500 to-amber-700',
    subtitle: 'بونص ذهب إضافي +30% وجوائز وصناديق كبرى عند كل عملية شحن',
    image: '/src/assets/images/recharge_event_banner_1791896416151.jpg',
    badge: '🪙 بونص مضاعف',
  },
  {
    id: 'soulmates',
    title: 'رفقاء الروح الأسبوعية',
    tag: 'كبلز وCP',
    tagColor: 'from-pink-600 to-rose-500',
    subtitle: 'تحدي رفقاء الروح وكبلز الرومات للفوز بخاتم العرش الماسي الوردي',
    image: '/src/assets/images/weekly_soulmates_banner_1791896450326.jpg',
    badge: '💖 خاتم العرش',
  },
  {
    id: 'agency',
    title: 'Toty Chat | افتتاح الوكالة جديده',
    tag: 'وكالات رسمية',
    tagColor: 'from-blue-600 to-cyan-500',
    subtitle: 'فرصة تأسيس واعتماد وكالتك في توتي شات مع أعلى نسبة أرباح ودعم رسمي',
    image: '/src/assets/images/toty_agency_banner_1791896475828.jpg',
    badge: '🏢 نسبة 85%',
  },
];

export const DiscoverRoomsView: React.FC = () => {
  const { setOpenRechargeModal, setOpenAgencyModal, isRtl } = useApp();
  const [selectedBanner, setSelectedBanner] = useState<ActivityBanner | null>(null);

  return (
    <div
      className="pb-28 px-3.5 pt-3 font-['Cairo',sans-serif] bg-gradient-to-b from-[#FDFBF7] via-[#FAF6ED] to-[#F5EFE0] min-h-screen text-slate-800 select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* لوحة النشاط الحصرية المكونة من البنرات الرسمية الخمسة */}
      <div className="space-y-3">
        {ACTIVITY_BANNERS.map((banner, index) => (
          <div
            key={banner.id}
            onClick={() => {
              sounds.playClick();
              setSelectedBanner(banner);
            }}
            className="relative overflow-hidden rounded-2xl border-2 border-amber-400/60 hover:border-amber-400 shadow-md cursor-pointer group active:scale-[0.98] transition-all bg-black/40"
          >
            {/* Aspect Ratio Banner Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />

              {/* Ambient Soft Vignette Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Floating Top Badge */}
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-black/60 text-amber-300 backdrop-blur-md border border-amber-400/60 shadow-sm flex items-center gap-1">
                  <span>{banner.badge}</span>
                </span>
              </div>

              {/* Click Hint Indicator */}
              <div className="absolute top-2.5 left-2.5 z-10">
                <span className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </span>
              </div>

              {/* Bottom Overlay Title & Subtitle */}
              <div className="absolute bottom-2.5 right-3 left-3 z-10 text-right">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {banner.title}
                  </h3>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black shadow-xs">
                    نشاط #{index + 1}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-amber-200/95 drop-shadow line-clamp-1 mt-0.5">
                  {banner.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* ACTIVITY DETAIL MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedBanner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            
            {/* Modal Hero Banner */}
            <div className="relative aspect-[16/9] w-full shrink-0">
              <img
                src={selectedBanner.image}
                alt={selectedBanner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <button
                onClick={() => {
                  sounds.playClick();
                  setSelectedBanner(null);
                }}
                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 right-4 left-4 text-right">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs mb-1 inline-block">
                  {selectedBanner.badge}
                </span>
                <h2 className="text-lg font-black text-white drop-shadow">
                  {selectedBanner.title}
                </h2>
              </div>
            </div>

            {/* Modal Body Info */}
            <div className="p-4 overflow-y-auto no-scrollbar space-y-3.5 text-xs text-slate-700 leading-relaxed text-right">
              
              {/* Event Specific Content */}
              {selectedBanner.id === 'custom_gift' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1">
                    <div className="font-black text-sm flex items-center gap-1.5 text-purple-900">
                      <Gift className="w-4 h-4 text-purple-600" />
                      <span>تفاصيل فعالية الهدية المخصصة</span>
                    </div>
                    <p className="text-[11px] text-purple-800">
                      يمكن للمستخدمين المميزين وأصحاب الرومات طلب تصميم هدايا ثلاثية الأبعاد مخصصة تحمل ألقابهم، رسوماتهم، ومؤثرات صوتية فريدة تظهر في جميع رومات توتي شات!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-black text-slate-900 text-xs">مزايا الهدية المخصصة:</span>
                    <ul className="space-y-1 pr-3 list-disc text-[11px] text-slate-600">
                      <li>تأثير بنر عريض يغطي الشاشة عند الإرسال.</li>
                      <li>إعلان صوتي ملكي يعم الروم بصوت مخصص.</li>
                      <li>حساب نقاط سحر وثروة مضاعفة لكل عملية إهداء.</li>
                      <li>تخليد اسم الداعم أو الروم في قائمة الهدايا الدائمة.</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedBanner.id === 'global_star' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
                    <div className="font-black text-sm flex items-center gap-1.5 text-amber-900">
                      <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
                      <span>بطولة النجم العالمي</span>
                    </div>
                    <p className="text-[11px] text-amber-900">
                      تنافس على مستوى جميع الدول لنيل لقب النجم العالمي لهذا الشهر مع جائزة المركز الأول: سيارة الأسطورة + إطار النجم الماسي + 10,000,000 عملة ذهبية!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-black text-slate-900 text-xs">جوائز المراكز الأولى:</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-300">
                        <span className="text-base block">🥇</span>
                        <strong className="block text-amber-950">المركز الأول</strong>
                        <span className="text-slate-600">سيارة + 10M ذهب</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100 border border-slate-300">
                        <span className="text-base block">🥈</span>
                        <strong className="block text-slate-900">المركز الثاني</strong>
                        <span className="text-slate-600">إطار + 5M ذهب</span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-base block">🥉</span>
                        <strong className="block text-amber-900">المركز الثالث</strong>
                        <span className="text-slate-600">وسام + 2M ذهب</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedBanner.id === 'recharge' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
                    <div className="font-black text-sm flex items-center gap-1.5 text-amber-900">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>مكافآت نشاط إعادة الشحن</span>
                    </div>
                    <p className="text-[11px] text-amber-900">
                      خلال فترة الفعالية، احصل على بونص فوري بنسبة +30% على كل شحن للعملات أو الماسات، بالإضافة إلى فتح صندوق الذهب الأسطوري مجاناً!
                    </p>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-200">
                      <span>شحن 500,000 عملة:</span>
                      <strong className="text-emerald-700">+150,000 بونص مجاني 🪙</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-200">
                      <span>شحن 1,000,000 عملة:</span>
                      <strong className="text-emerald-700">+350,000 بونص + سيارة VIP 🚗</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-200">
                      <span>شحن 5,000,000 عملة:</span>
                      <strong className="text-emerald-700">+2,000,000 بونص + إطار أسطوري 👑</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedBanner.id === 'soulmates' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                    <div className="font-black text-sm flex items-center gap-1.5 text-rose-900">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
                      <span>تحدي رفقاء الروح الأسبوعي</span>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      أقوى تحدي ثنائي بين الكبلز في توتي شات! ارفعوا نقاط الحب والانسجام عبر الهدايا الثنائية وتتويجكم على عرش رفقاء الروح مع خاتم الحب الوردي المشع.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-black text-slate-900 text-xs">جوائز الكبل الفائز:</span>
                    <ul className="space-y-1 pr-3 list-disc text-[11px] text-slate-600">
                      <li>خاتم CP العرش الماسي الوردي لكل من الحسابين.</li>
                      <li>إطار رفقاء الروح بأجنحة الذهب المشعة لمدة 7 أيام.</li>
                      <li>تثبيت بطاقة الكبل في واجهة تصدر رفقاء الروح.</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedBanner.id === 'agency' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                    <div className="font-black text-sm flex items-center gap-1.5 text-blue-900">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>افتتاح الوكالات الجديدة في Toty Chat</span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      أعلنت إدارة توتي شات عن فتح باب تسجيل الوكالات الجديدة بنسبة أرباح تصل إلى 85% مع نظام محاسبة آلي ودعم فني على مدار الساعة.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-black text-slate-900 text-xs">شروط فتح الوكالة:</span>
                    <ul className="space-y-1 pr-3 list-disc text-[11px] text-slate-600">
                      <li>توفر حد أدنى 5 مضيفين نشطين شهرياً.</li>
                      <li>التزام الوكالة بالقواعد الرسمية وسياسة السلوك.</li>
                      <li>توثيق الحساب بالرقم الرسمي والبيانات المعتمدة.</li>
                    </ul>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Action Buttons */}
            <div className="p-4 pt-1 border-t border-slate-100 flex items-center gap-2 shrink-0">
              {selectedBanner.id === 'recharge' && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedBanner(null);
                    setOpenRechargeModal(true);
                  }}
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300"
                >
                  <Coins className="w-4 h-4" />
                  <span>انتقل لصفحة الشحن الآن</span>
                </button>
              )}

              {selectedBanner.id === 'agency' && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedBanner(null);
                    setOpenAgencyModal(true);
                  }}
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-cyan-300"
                >
                  <Building2 className="w-4 h-4" />
                  <span>تسجيل وإدارة الوكالة</span>
                </button>
              )}

              {selectedBanner.id !== 'recharge' && selectedBanner.id !== 'agency' && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedBanner(null);
                  }}
                  className="flex-1 py-3 rounded-full bg-[#2bd980] hover:bg-[#25c472] text-white font-black text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>انضمام ومشاركة في الفعالية</span>
                </button>
              )}

              <button
                onClick={() => {
                  sounds.playClick();
                  setSelectedBanner(null);
                }}
                className="px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
