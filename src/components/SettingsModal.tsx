import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  CircleUserRound,
  ShieldCheck,
  Gift,
  MinusCircle,
  MessageSquareMore,
  Bell,
  Compass,
  FileText,
  Lock,
  ArrowUpCircle,
  XCircle,
  X,
  CheckCircle2,
  Trash2,
  Mail,
  Globe,
  FolderCode,
  FileCode,
  Download,
  Copy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        sounds.playClick();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
        checked ? 'bg-[#2bd980]' : 'bg-[#e2e8f0]'
      }`}
    >
      <span
        aria-hidden="true"
        style={{ left: checked ? '22px' : '2px' }}
        className="pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out"
      />
    </button>
  );
};

export const SettingsModal: React.FC = () => {
  const {
    openSettingsModal,
    setOpenSettingsModal,
    setIsLoggedIn,
    currentUser,
    setOpenLanguageModal,
    setOpenVipModal,
    t,
    isRtl,
    language,
  } = useApp();

  // Toggles matching the screenshot:
  // 1. ممنوع الذهاب إلى الغرفة: يتفعل حصرياً مع VIP 6 فما فوق
  const [blockGoToRoom, setBlockGoToRoom] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('toti_block_go_to_room');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleBlockGoToRoom = () => {
    sounds.playClick();
    const currentVip = currentUser.vipLevel || 0;
    if (currentVip < 6) {
      showToast(
        language === 'ar'
          ? `🔒 ميزة «ممنوع الذهاب إلى الغرفة» حصرية لمستوى VIP 6 فما فوق (مستواك الحالي: VIP ${currentVip})`
          : `🔒 "Prevent Jump to Room" is exclusive for VIP 6+ (Your level: VIP ${currentVip})`
      );
      return;
    }
    setBlockGoToRoom((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('toti_block_go_to_room', String(next));
      } catch (_) {}
      showToast(
        next
          ? (language === 'ar' ? 'تم تفعيل «ممنوع الذهاب إلى الغرفة» بنجاح 🛡️ (VIP 6)' : 'Prevent Jump to Room enabled 🛡️ (VIP 6)')
          : (language === 'ar' ? 'تم إلغاء تفعيل منع الذهاب إلى الغرفة' : 'Prevent Jump to Room disabled')
      );
      return next;
    });
  };
  // 2. اقبل الدردشة مع الاصدقاء فقط: ON (true - green)
  const [friendsChatOnly, setFriendsChatOnly] = useState(true);
  // 3. إشعارات الرسائل: OFF (false)
  const [messageNotifications, setMessageNotifications] = useState(false);
  // 4. الوضع البسيط: OFF (false)
  const [simpleMode, setSimpleMode] = useState(false);

  // Cache size: starts at 23.53M matching screenshot
  const [cacheSize, setCacheSize] = useState('23.53M');

  // Broadcast notification text
  const [broadcastNotification, setBroadcastNotification] = useState('إيقاف الإشعارات');

  // Modal sub-dialogs
  const [activeDialog, setActiveDialog] = useState<
    'account' | 'permissions' | 'userAgreement' | 'privacy' | 'deleteAccount' | 'logout' | 'network' | 'appFiles' | null
  >(null);
  const [isFixingNetwork, setIsFixingNetwork] = useState(false);
  const [agreementLang, setAgreementLang] = useState<'both' | 'ar' | 'en'>('ar');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!openSettingsModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#f5f6f8] flex flex-col font-['Cairo',sans-serif] animate-in fade-in duration-200 select-none overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top App Bar - Centered Title with Back Chevron */}
      <header className="sticky top-0 z-20 bg-[#f5f6f8] px-4 py-3 flex items-center justify-between border-b border-slate-200/50">
        <div className="w-8" />
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">{t.settingsTitle}</h1>
        <button
          onClick={() => {
            sounds.playClick();
            setOpenSettingsModal(false);
          }}
          className="w-8 h-8 flex items-center justify-center text-slate-800 hover:text-slate-600 transition cursor-pointer active:scale-95"
          title={t.back}
        >
          {isRtl ? (
            <ChevronRight className="w-6 h-6 stroke-[2.2]" />
          ) : (
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          )}
        </button>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#2bd980]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Scrollable Settings Groups */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3.5 pt-3 pb-8 space-y-3">
        {/* ========================================================================= */}
        {/* GROUP 1: الحساب، الأذونات، البث، الخيارات والدردشة (8 عناصر)              */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-slate-100/80">
          {/* 1. الحساب والأمان */}
          <div
            onClick={() => {
              sounds.playClick();
              setActiveDialog('account');
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <CircleUserRound className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.accountSecurity}</span>
            </div>
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
          </div>

          {/* 2. إعدادات الأذونات */}
          <div
            onClick={() => {
              sounds.playClick();
              setActiveDialog('permissions');
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.permissions}</span>
            </div>
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
          </div>

          {/* 3. عرض البث */}
          <div
            onClick={() => {
              sounds.playClick();
              const nextState =
                broadcastNotification === 'إيقاف الإشعارات' ? 'تشغيل الإشعارات' : 'إيقاف الإشعارات';
              setBroadcastNotification(nextState);
              showToast(isRtl ? `تم ${nextState === 'إيقاف الإشعارات' ? 'إيقاف' : 'تفعيل'} إشعارات عرض البث` : 'Broadcast notification updated');
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.broadcastNotification}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">{broadcastNotification}</span>
              {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
            </div>
          </div>

          {/* 4. ممنوع الذهاب إلى الغرفة (يتفعل مع VIP 6 فما فوق) */}
          <div
            onClick={(currentUser.vipLevel || 0) < 6 ? handleToggleBlockGoToRoom : undefined}
            className={`px-4 py-3.5 flex items-center justify-between transition ${
              (currentUser.vipLevel || 0) < 6 ? 'cursor-pointer hover:bg-amber-50/40' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <MinusCircle className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-slate-800">{t.blockGoToRoom}</span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs border border-amber-300">
                  <span>👑 VIP 6+</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(currentUser.vipLevel || 0) < 6 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    setOpenVipModal(true);
                  }}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                >
                  ترقية
                </button>
              )}
              <ToggleSwitch
                checked={(currentUser.vipLevel || 0) >= 6 && blockGoToRoom}
                onChange={handleToggleBlockGoToRoom}
              />
            </div>
          </div>

          {/* 5. اقبل الدردشة مع الاصدقاء فقط (ON - Green) */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquareMore className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.friendsChatOnly}</span>
            </div>
            <ToggleSwitch checked={friendsChatOnly} onChange={setFriendsChatOnly} />
          </div>

          {/* 6. إشعارات الرسائل (OFF) */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.messageNotifications}</span>
            </div>
            <ToggleSwitch checked={messageNotifications} onChange={setMessageNotifications} />
          </div>

          {/* 7. الوضع البسيط (OFF) */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.simpleMode}</span>
            </div>
            <ToggleSwitch checked={simpleMode} onChange={setSimpleMode} />
          </div>

          {/* 8. إصلاح الشبكة */}
          <div
            onClick={() => {
              sounds.playClick();
              setActiveDialog('network');
              setIsFixingNetwork(true);
              setTimeout(() => {
                setIsFixingNetwork(false);
              }, 1200);
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center p-0.5">
                <div className="flex items-end gap-[1.5px] h-2.5">
                  <span className="w-[1.5px] h-1 bg-slate-700 rounded-2xs" />
                  <span className="w-[1.5px] h-1.5 bg-slate-700 rounded-2xs" />
                  <span className="w-[1.5px] h-2 bg-slate-700 rounded-2xs" />
                  <span className="w-[1.5px] h-2.5 bg-slate-700 rounded-2xs" />
                </div>
              </div>
              <span className="text-[14px] font-bold text-slate-800">{t.networkFix}</span>
            </div>
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GROUP 2: ذاكرة التخزين، الاتفاقية، الخصوصية، الإصدار                       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-slate-100/80">
          {/* إعدادات اللغة */}
          <div
            onClick={() => {
              sounds.playClick();
              setOpenLanguageModal(true);
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.languageSettings}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">
                {language === 'ar' ? 'العربية' : 'English'}
              </span>
              {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
            </div>
          </div>

          {/* 9. مسح ذاكرة التخزين المؤقت */}
          <div
            onClick={() => {
              sounds.playClick();
              if (cacheSize === '0.00M') {
                showToast(isRtl ? 'ذاكرة التخزين المؤقت ممسوحة بالفعل' : 'Cache is already clean');
              } else {
                setCacheSize('0.00M');
                showToast(isRtl ? 'تم مسح ذاكرة التخزين المؤقت بنجاح (23.53M) ✅' : 'Cache cleared successfully (23.53M) ✅');
              }
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <Trash2 className="w-4.5 h-4.5 text-slate-700 stroke-[1.8]" />
              </div>
              <span className="text-[14px] font-bold text-slate-800">{t.clearCache}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-sans font-medium">{cacheSize}</span>
              {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
            </div>
          </div>

          {/* 10. اتفاقية المستخدم */}
          <div
            onClick={() => {
              sounds.playClick();
              setActiveDialog('userAgreement');
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.userAgreement}</span>
            </div>
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
          </div>

          {/* 11. سياسة الخصوصية */}
          <div
            onClick={() => {
              sounds.playClick();
              setActiveDialog('privacy');
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.privacyPolicy}</span>
            </div>
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
          </div>

          {/* 12. الإصدار */}
          <div
            onClick={() => {
              sounds.playClick();
              showToast(isRtl ? 'أنت تستخدم أحدث إصدار متوفر V1.0.66-99 ✨' : 'You are using the latest version V1.0.66-99 ✨');
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.appVersion}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-sans font-medium">V1.0.66-99</span>
              {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
            </div>
          </div>

          {/* 13. ملفات التطبيق والمشروع */}
          <div
            onClick={() => {
              sounds.playClick();
              setActiveDialog('appFiles');
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FolderCode className="w-5 h-5 text-amber-600 stroke-[1.8]" />
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-slate-800">
                  {isRtl ? 'ملفات التطبيق والمشروع' : 'App Source & Files'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isRtl ? 'استعراض هيكل ومسارات كافة ملفات الكود' : 'View project structure & file paths'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-amber-700 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                45+ ملف
              </span>
              {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GROUP 3: حذف الحساب                                                        */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div
            onClick={() => {
              sounds.playClick();
              setActiveDialog('deleteAccount');
            }}
            className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 active:bg-slate-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-[14px] font-bold text-slate-800">{t.deleteAccount}</span>
            </div>
            {isRtl ? <ChevronLeft className="w-4 h-4 text-slate-400 stroke-[2]" /> : <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2]" />}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM ACTION: Log Out Button                                             */}
        {/* ========================================================================= */}
        <div className="pt-2 pb-6 px-1">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveDialog('logout');
            }}
            className="w-full py-3.5 rounded-full bg-[#2bd980] hover:bg-[#25c472] active:scale-[0.98] transition text-white font-bold text-base shadow-sm cursor-pointer flex items-center justify-center tracking-wide"
          >
            {t.logout}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-DIALOGS                                                               */}
      {/* ========================================================================= */}

      {/* 1. Account & Security Dialog */}
      {activeDialog === 'account' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CircleUserRound className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-900">الحساب والأمان</h3>
              </div>
              <button
                onClick={() => setActiveDialog(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-500 font-bold">اسم الحساب:</span>
                <span className="text-slate-900 font-black">{currentUser.name}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-500 font-bold">معرف الحساب (ID):</span>
                <span className="text-slate-900 font-mono font-bold">{currentUser.id}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-500 font-bold">حالة التوثيق:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span>موثق ومحمي</span>
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-500 font-bold">كلمة المرور:</span>
                <span className="text-slate-700 font-bold">••••••••</span>
              </div>
            </div>
            <button
              onClick={() => setActiveDialog(null)}
              className="w-full py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
            >
              تم
            </button>
          </div>
        </div>
      )}

      {/* 2. Permissions Dialog */}
      {activeDialog === 'permissions' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-900">إعدادات الأذونات</h3>
              </div>
              <button
                onClick={() => setActiveDialog(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-800 font-bold">إذن الميكروفون (الرومات الصوتية)</span>
                <span className="text-emerald-600 font-bold">مفعل ✅</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-800 font-bold">إذن الإشعارات والتنبيهات</span>
                <span className="text-emerald-600 font-bold">مفعل ✅</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                <span className="text-slate-800 font-bold">إذن التخزين والوسائط</span>
                <span className="text-emerald-600 font-bold">مفعل ✅</span>
              </div>
            </div>
            <button
              onClick={() => setActiveDialog(null)}
              className="w-full py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
            >
              حفظ
            </button>
          </div>
        </div>
      )}

      {/* 3. User Agreement Dialog (اتفاقية الاستخدام وحقوق الملكية الفكرية - توتي شات | TOTI CHAT) */}
      {activeDialog === 'userAgreement' && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="text-right">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    اتفاقية الاستخدام وحقوق الملكية الفكرية
                  </h3>
                  <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                    توتي شات | TOTI CHAT
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveDialog(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center justify-center shrink-0 pt-0.5">
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/60 shadow-inner gap-1 text-[11px] font-bold">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setAgreementLang('ar');
                  }}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                    agreementLang === 'ar'
                      ? 'bg-white text-emerald-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  النسخة العربية
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setAgreementLang('en');
                  }}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                    agreementLang === 'en'
                      ? 'bg-white text-emerald-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English Version
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setAgreementLang('both');
                  }}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                    agreementLang === 'both'
                      ? 'bg-white text-emerald-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  عرض اللغتين (Bilingual)
                </button>
              </div>
            </div>

            {/* Agreement Document Scrollable Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1 py-1 text-xs text-slate-700 leading-relaxed">
              
              {/* Document Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 text-center space-y-1">
                <div className="text-sm font-black text-emerald-950">
                  توتي شات | TOTI CHAT
                </div>
                <div className="text-xs font-bold text-emerald-800">
                  اتفاقية الاستخدام وحقوق الملكية الفكرية
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 font-sans">
                  Terms of Use & Intellectual Property Rights Agreement
                </div>
              </div>

              {/* 1. أولاً: بيانات الإصدار والتواصل الرسمي */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-black text-slate-900 text-xs sm:text-[13px]">
                    أولاً: بيانات الإصدار والتواصل الرسمي
                  </span>
                  {(agreementLang === 'en' || agreementLang === 'both') && (
                    <span className="text-[10px] text-slate-500 font-sans font-bold">
                      1. Version Information & Official Contact Details
                    </span>
                  )}
                </div>

                {/* Arabic Data */}
                {(agreementLang === 'ar' || agreementLang === 'both') && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="font-bold text-emerald-800 text-xs">البيانات العربية:</div>
                    <ul className="space-y-1 pr-3 list-disc text-slate-700">
                      <li><strong className="text-slate-900">اسم التطبيق:</strong> توتي شات (Toti Chat).</li>
                      <li><strong className="text-slate-900">عنوان الوثيقة:</strong> اتفاقية الاستخدام وحقوق الملكية الفكرية.</li>
                      <li><strong className="text-slate-900">رقم الإصدار:</strong> 1.0.</li>
                      <li><strong className="text-slate-900">تاريخ الإصدار:</strong> 13 أكتوبر 2026.</li>
                      <li><strong className="text-slate-900">تاريخ السريان:</strong> من تاريخ الاعتماد والنشر الرسمي.</li>
                      <li><strong className="text-slate-900">الجهة المسؤولة:</strong> إدارة تطبيق توتي شات.</li>
                      <li>
                        <strong className="text-slate-900">البريد الإلكتروني الرسمي:</strong>{' '}
                        <a href="mailto:mrbalmain11@gmail.com" className="text-emerald-700 underline font-mono font-bold">
                          mrbalmain11@gmail.com
                        </a>
                      </li>
                      <li><strong className="text-slate-900">الموقع الإلكتروني الرسمي:</strong> يُعلن عنه عند توفره.</li>
                      <li><strong className="text-slate-900">قناة الدعم الفني:</strong> يُعلن عنها عبر القنوات الرسمية عند توفرها.</li>
                      <li><strong className="text-slate-900">حقوق الملكية الفكرية:</strong> محفوظة لأصحاب الحقوق القانونية وفقاً للقوانين والاتفاقيات المعمول بها.</li>
                    </ul>
                  </div>
                )}

                {/* English Data */}
                {(agreementLang === 'en' || agreementLang === 'both') && (
                  <div className={`space-y-1.5 text-[11px] font-sans ${agreementLang === 'both' ? 'pt-2 border-t border-slate-200/50' : ''}`} dir="ltr">
                    <div className="font-bold text-emerald-800 text-xs">English Version:</div>
                    <ul className="space-y-1 pl-3 list-disc text-slate-700">
                      <li><strong className="text-slate-900">Application Name:</strong> Toti Chat.</li>
                      <li><strong className="text-slate-900">Document Title:</strong> Terms of Use & Intellectual Property Rights Agreement.</li>
                      <li><strong className="text-slate-900">Version Number:</strong> 1.0.</li>
                      <li><strong className="text-slate-900">Issue Date:</strong> October 13, 2026.</li>
                      <li><strong className="text-slate-900">Effective Date:</strong> Upon official approval and publication.</li>
                      <li><strong className="text-slate-900">Responsible Authority:</strong> Toti Chat Management.</li>
                      <li>
                        <strong className="text-slate-900">Official Email:</strong>{' '}
                        <a href="mailto:mrbalmain11@gmail.com" className="text-emerald-700 underline font-mono font-bold">
                          mrbalmain11@gmail.com
                        </a>
                      </li>
                      <li><strong className="text-slate-900">Official Website:</strong> To be announced when available.</li>
                      <li><strong className="text-slate-900">Technical Support Channel:</strong> To be announced through official channels when available.</li>
                      <li><strong className="text-slate-900">Intellectual Property Rights:</strong> Reserved to their respective lawful rights holders, subject to applicable laws and agreements.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 2. ثانياً: الغرض من الاتفاقية */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-black text-slate-900 text-xs sm:text-[13px]">
                    ثانياً: الغرض من الاتفاقية
                  </span>
                  {(agreementLang === 'en' || agreementLang === 'both') && (
                    <span className="text-[10px] text-slate-500 font-sans font-bold">
                      2. Purpose of This Agreement
                    </span>
                  )}
                </div>

                {(agreementLang === 'ar' || agreementLang === 'both') && (
                  <div className="text-[11px] text-slate-700 leading-relaxed">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px] mb-0.5">العربية:</div>}
                    تهدف هذه الاتفاقية إلى تنظيم استخدام تطبيق توتي شات، وتحديد القواعد والحقوق والالتزامات المتعلقة باستخدام خدمات التطبيق، وحماية حقوق الملكية الفكرية، والمحافظة على بيئة استخدام آمنة ومنظمة لجميع المستخدمين.
                  </div>
                )}

                {(agreementLang === 'en' || agreementLang === 'both') && (
                  <div className={`text-[11px] font-sans text-slate-700 leading-relaxed ${agreementLang === 'both' ? 'pt-2 border-t border-slate-200/50' : ''}`} dir="ltr">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px] mb-0.5">English:</div>}
                    This Agreement aims to regulate the use of Toti Chat, define the rules, rights, and obligations associated with its services, protect intellectual property rights, and maintain a safe and orderly environment for all users.
                  </div>
                )}
              </div>

              {/* 3. ثالثاً: سياسة حقوق الملكية الفكرية */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-black text-slate-900 text-xs sm:text-[13px]">
                    ثالثاً: سياسة حقوق الملكية الفكرية
                  </span>
                  {(agreementLang === 'en' || agreementLang === 'both') && (
                    <span className="text-[10px] text-slate-500 font-sans font-bold">
                      3. Intellectual Property Policy
                    </span>
                  )}
                </div>

                {(agreementLang === 'ar' || agreementLang === 'both') && (
                  <div className="text-[11px] text-slate-700 space-y-1.5 leading-relaxed">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px]">العربية:</div>}
                    <p>
                      تلتزم إدارة توتي شات باحترام حقوق الملكية الفكرية والعلامات التجارية وحقوق المؤلف العائدة إلى أصحابها القانونيين.
                    </p>
                    <p>
                      يُحظر نسخ أو إعادة نشر أو توزيع أو تعديل أو استغلال أي محتوى أو تصميم أو شعار أو عنصر محمي تابع للتطبيق دون الحصول على الإذن القانوني اللازم من صاحب الحق.
                    </p>
                    <p>
                      كما يُحظر استخدام اسم توتي شات أو شعاره بطريقة مضللة، أو انتحال صفة الإدارة أو ممثليها الرسميين، أو الادعاء بوجود تفويض رسمي دون إذن صحيح.
                    </p>
                  </div>
                )}

                {(agreementLang === 'en' || agreementLang === 'both') && (
                  <div className={`text-[11px] font-sans text-slate-700 space-y-1.5 leading-relaxed ${agreementLang === 'both' ? 'pt-2 border-t border-slate-200/50' : ''}`} dir="ltr">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px]">English:</div>}
                    <p>
                      Toti Chat Management respects intellectual property rights, trademarks, and copyrights belonging to their lawful owners.
                    </p>
                    <p>
                      Copying, republishing, distributing, modifying, or exploiting any protected content, design, logo, or application element is prohibited without the necessary legal authorization from the rights holder.
                    </p>
                    <p>
                      The misleading use of the Toti Chat name or logo, impersonation of management or its official representatives, and claims of official authorization without valid permission are also prohibited.
                    </p>
                  </div>
                )}
              </div>

              {/* 4. رابعاً: التواصل الرسمي والشكاوى */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-black text-slate-900 text-xs sm:text-[13px]">
                    رابعاً: التواصل الرسمي والشكاوى
                  </span>
                  {(agreementLang === 'en' || agreementLang === 'both') && (
                    <span className="text-[10px] text-slate-500 font-sans font-bold">
                      4. Official Contact & Complaints
                    </span>
                  )}
                </div>

                {(agreementLang === 'ar' || agreementLang === 'both') && (
                  <div className="text-[11px] text-slate-700 space-y-1.5 leading-relaxed">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px]">العربية:</div>}
                    <p>
                      للاستفسارات أو الشكاوى أو البلاغات المتعلقة باستخدام التطبيق أو الدعم الفني أو حقوق الملكية الفكرية، يرجى التواصل مع إدارة توتي شات عبر البريد الإلكتروني الرسمي:
                    </p>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">البريد الرسمي:</span>
                      <a
                        href="mailto:mrbalmain11@gmail.com"
                        className="text-emerald-700 font-mono font-bold flex items-center gap-1 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        <span>mrbalmain11@gmail.com</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      يرجى توضيح موضوع الطلب وتقديم المعلومات اللازمة لمراجعته والتحقق منه.
                    </p>
                  </div>
                )}

                {(agreementLang === 'en' || agreementLang === 'both') && (
                  <div className={`text-[11px] font-sans text-slate-700 space-y-1.5 leading-relaxed ${agreementLang === 'both' ? 'pt-2 border-t border-slate-200/50' : ''}`} dir="ltr">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px]">English:</div>}
                    <p>
                      For inquiries, complaints, or reports concerning application use, technical support, or intellectual property rights, please contact Toti Chat Management through the official email address:
                    </p>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">Official Email:</span>
                      <a
                        href="mailto:mrbalmain11@gmail.com"
                        className="text-emerald-700 font-mono font-bold flex items-center gap-1 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        <span>mrbalmain11@gmail.com</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Please clearly describe your request and provide the information necessary for review and verification.
                    </p>
                  </div>
                )}
              </div>

              {/* 5. خامساً: التعديلات والتحديثات */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-black text-slate-900 text-xs sm:text-[13px]">
                    خامساً: التعديلات والتحديثات
                  </span>
                  {(agreementLang === 'en' || agreementLang === 'both') && (
                    <span className="text-[10px] text-slate-500 font-sans font-bold">
                      5. Amendments & Updates
                    </span>
                  )}
                </div>

                {(agreementLang === 'ar' || agreementLang === 'both') && (
                  <div className="text-[11px] text-slate-700 leading-relaxed">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px] mb-0.5">العربية:</div>}
                    تحتفظ إدارة توتي شات بحق تحديث هذه الوثيقة أو تعديل أحكامها عند الحاجة، بما يتوافق مع تطور خدمات التطبيق والقوانين المعمول بها. وتُنشر التعديلات عبر القنوات الرسمية المتاحة، مع تحديد تاريخ سريان النسخة المحدثة.
                  </div>
                )}

                {(agreementLang === 'en' || agreementLang === 'both') && (
                  <div className={`text-[11px] font-sans text-slate-700 leading-relaxed ${agreementLang === 'both' ? 'pt-2 border-t border-slate-200/50' : ''}`} dir="ltr">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px] mb-0.5">English:</div>}
                    Toti Chat Management reserves the right to update or amend this document when necessary to reflect changes in the application's services and applicable laws. Amendments will be published through available official channels, with the effective date of the updated version indicated.
                  </div>
                )}
              </div>

              {/* 6. سادساً: الأحكام العامة */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-black text-slate-900 text-xs sm:text-[13px]">
                    سادساً: الأحكام العامة
                  </span>
                  {(agreementLang === 'en' || agreementLang === 'both') && (
                    <span className="text-[10px] text-slate-500 font-sans font-bold">
                      6. General Provisions
                    </span>
                  )}
                </div>

                {(agreementLang === 'ar' || agreementLang === 'both') && (
                  <div className="text-[11px] text-slate-700 leading-relaxed">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px] mb-0.5">العربية:</div>}
                    تخضع هذه الاتفاقية للقوانين والأنظمة واجبة التطبيق. ولا يُفسر أي بند فيها على أنه يمنح الإدارة حقوقاً لا تملكها قانونياً أو ينتقص من الحقوق التي يكفلها القانون للمستخدمين وأصحاب الحقوق.
                  </div>
                )}

                {(agreementLang === 'en' || agreementLang === 'both') && (
                  <div className={`text-[11px] font-sans text-slate-700 leading-relaxed ${agreementLang === 'both' ? 'pt-2 border-t border-slate-200/50' : ''}`} dir="ltr">
                    {agreementLang === 'both' && <div className="font-bold text-emerald-800 text-[10px] mb-0.5">English:</div>}
                    This Agreement is subject to applicable laws and regulations. No provision of this Agreement shall be interpreted as granting management rights it does not legally hold or diminishing rights protected by law for users and rights holders.
                  </div>
                )}
              </div>

              {/* Document Sign-off / Footer Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-center space-y-1">
                <div className="text-xs font-black text-emerald-400">
                  إدارة توتي شات | Toti Chat Management
                </div>
                <div className="text-[11px] font-bold text-slate-200">
                  جميع الحقوق محفوظة لأصحابها القانونيين.
                </div>
                <div className="text-[10px] font-sans text-slate-400">
                  All Rights Reserved to Their Respective Lawful Rights Holders.
                </div>
                <div className="text-[10px] font-mono text-emerald-300 font-bold pt-1">
                  رقم الإصدار | Version 1.0
                </div>
              </div>

            </div>

            {/* Bottom Button */}
            <div className="pt-1 shrink-0">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveDialog(null);
                  showToast('تم الاطلاع على اتفاقية الاستخدام وحقوق الملكية الفكرية ✅');
                }}
                className="w-full py-3 rounded-full bg-[#2bd980] hover:bg-[#25c472] active:scale-[0.98] transition text-white font-bold text-sm shadow-sm cursor-pointer flex items-center justify-center tracking-wide"
              >
                تم الاطلاع والموافقة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Privacy Policy Dialog */}
      {activeDialog === 'privacy' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-900">سياسة الخصوصية</h3>
              </div>
              <button
                onClick={() => setActiveDialog(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto no-scrollbar text-xs text-slate-600 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-900">حماية خصوصيتك أولويتنا:</p>
              <p>
                نحن نحترم خصوصيتك ونتعهد بحماية كافة بياناتك الشخصية المشفرة. لا نشارك أي معلومات شخصية أو بيانات دفع مع أي أطراف ثالثة دون إذنك الصريح.
              </p>
              <p>
                يتم تخزين بيانات حسابك ومعرفاتك بأعلى معايير الأمان والتشفير العالمية لضمان تجربة آمنة ومريحة.
              </p>
            </div>
            <button
              onClick={() => setActiveDialog(null)}
              className="w-full py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
            >
              موافق
            </button>
          </div>
        </div>
      )}

      {/* 5. Network Diagnostics Dialog */}
      {activeDialog === 'network' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-center">
            {isFixingNetwork ? (
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 border-3 border-[#2bd980] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800">جاري فحص وإصلاح اتصال الشبكة...</p>
                <p className="text-xs text-slate-400">فحص الخوادم ومسارات الاتصال المباشر</p>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#2bd980]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">تم فحص الشبكة بنجاح</h3>
                <div className="p-3 rounded-2xl bg-slate-50 text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span>حالة الاتصال:</span>
                    <span className="font-bold text-emerald-600">ممتازة 📶</span>
                  </div>
                  <div className="flex justify-between">
                    <span>زمن الاستجابة (Ping):</span>
                    <span className="font-mono font-bold text-slate-900">24ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الخادم المتصل:</span>
                    <span className="font-bold text-slate-900">Middle East (Baghdad)</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDialog(null)}
                  className="w-full py-2.5 rounded-full bg-[#2bd980] text-white font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Delete Account Confirmation */}
      {activeDialog === 'deleteAccount' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">حذف الحساب نهائياً</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              تحذير: حذف الحساب سيؤدي إلى مسح جميع بياناتك ورصيدك ومستواك بشكل لا يمكن استرجاعه. هل أنت متأكد؟
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setActiveDialog(null)}
                className="py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveDialog(null);
                  setOpenSettingsModal(false);
                  setIsLoggedIn(false);
                }}
                className="py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. App Files & Source Code Dialog */}
      {activeDialog === 'appFiles' && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <FolderCode className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {isRtl ? 'ملفات وسورس كود التطبيق' : 'App Source Files & Architecture'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRtl ? 'مشروع توتي شات المتكامل | React 19 + TypeScript + Vite' : 'Toti Chat Complete Project'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveDialog(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-3 gap-2 my-3 shrink-0">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 text-center">
                <span className="block text-[10px] text-amber-700 font-bold">{isRtl ? 'إجمالي الأسطر' : 'Total Lines'}</span>
                <span className="text-sm font-black font-mono text-amber-900">18,900+</span>
              </div>
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-2.5 text-center">
                <span className="block text-[10px] text-emerald-700 font-bold">{isRtl ? 'ملفات الكود' : 'Code Files'}</span>
                <span className="text-sm font-black font-mono text-emerald-900">45+ ملف</span>
              </div>
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-2.5 text-center">
                <span className="block text-[10px] text-blue-700 font-bold">{isRtl ? 'حالة البناء' : 'Build Status'}</span>
                <span className="text-xs font-black text-blue-900">ناجح 100% ✅</span>
              </div>
            </div>

            {/* Scrollable File List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-xs">
              {/* Category 1: الواجهات الرئيسية */}
              <div>
                <h4 className="font-bold text-slate-800 text-[13px] mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {isRtl ? 'واجهات التطبيق الأساسية (Views)' : 'Main Views'}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { path: 'src/views/ProfileView.tsx', desc: 'الملف الشخصي، بطاقة الوكالة الفاخرة، نسخ المعرف، إحصائيات الحساب' },
                    { path: 'src/views/HomeView.tsx', desc: 'الصفحة الرئيسية واستعراض الغرف الصوتية والفلاتر' },
                    { path: 'src/views/MessagesView.tsx', desc: 'نظام الرسائل والإشعارات الرسمية والدردشات الخاصة' },
                  ].map((f) => (
                    <div
                      key={f.path}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-amber-50/40 transition flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-slate-800 text-[11px] truncate" dir="ltr">{f.path}</div>
                        <div className="text-[10px] text-slate-500 truncate">{f.desc}</div>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          navigator.clipboard.writeText(f.path);
                          showToast(`تم نسخ المسار: ${f.path}`);
                        }}
                        className="shrink-0 p-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-300 text-slate-600 hover:text-amber-700 transition"
                        title="نسخ المسار"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 2: المكونات الملكية والغرف */}
              <div>
                <h4 className="font-bold text-slate-800 text-[13px] mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {isRtl ? 'المكونات الملكية والغرف الصوتية' : 'Voice Rooms & Royal Features'}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { path: 'src/components/VoiceRoomModal.tsx', desc: 'الغرفة الصوتية الملكية، المايكات، المقاعد، الهدايا، البث الصوتي' },
                    { path: 'src/components/AgencyModal.tsx', desc: 'نظام الوكالة والمضيفين والتحكم في عدد الأعضاء' },
                    { path: 'src/components/AgencyProfileCard.tsx', desc: 'بطاقة ومستطيل الوكالة التفاعلية داخل الملف الشخصي' },
                    { path: 'src/components/InternalProfileModal.tsx', desc: 'نافذة البروفايل الداخلية الشاملة بالمعرف وصورة الوكيل' },
                    { path: 'src/components/SettingsModal.tsx', desc: 'إعدادات الحساب مع ميزة منع الذهاب للغرفة حصرياً لـ VIP 6+' },
                    { path: 'src/components/VipModal.tsx', desc: 'مركز مستويات VIP والمزايا الملكية المخصصة' },
                    { path: 'src/components/GiftStoreModal.tsx', desc: 'متجر الهدايا، شحن العملات، وإرسال الهدايا للغرف' },
                    { path: 'src/components/StorageModal.tsx', desc: 'حقيبة التخزين، إطارات الحسابات، سيارات الدخول' },
                    { path: 'src/components/WealthLeaderboardModal.tsx', desc: 'لوحة الشرف وتصنيفات الثراء والجاذبية' },
                  ].map((f) => (
                    <div
                      key={f.path}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-emerald-50/40 transition flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-slate-800 text-[11px] truncate" dir="ltr">{f.path}</div>
                        <div className="text-[10px] text-slate-500 truncate">{f.desc}</div>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          navigator.clipboard.writeText(f.path);
                          showToast(`تم نسخ المسار: ${f.path}`);
                        }}
                        className="shrink-0 p-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 transition"
                        title="نسخ المسار"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 3: الحالة والترجمة والبيانات */}
              <div>
                <h4 className="font-bold text-slate-800 text-[13px] mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {isRtl ? 'إدارة البيانات والحالة العامة' : 'State & Data'}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { path: 'src/context/AppContext.tsx', desc: 'السياق المركزي للحالة، الحساب الحالي، عدد الأعضاء، المزامنة' },
                    { path: 'src/i18n/translations.ts', desc: 'نظام اللغات والترجمة الشاملة (العربية والإنجليزية)' },
                    { path: 'src/mockData.ts', desc: 'البيانات الافتراضية، الغرف، المستخدمين، الوكالات' },
                    { path: 'src/types.ts', desc: 'تعريفات TypeScript للغرف والمستخدمين والوكالات' },
                    { path: 'src/utils/audio.ts', desc: 'المؤثرات الصوتية الملكية التفاعلية' },
                  ].map((f) => (
                    <div
                      key={f.path}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-blue-50/40 transition flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-slate-800 text-[11px] truncate" dir="ltr">{f.path}</div>
                        <div className="text-[10px] text-slate-500 truncate">{f.desc}</div>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          navigator.clipboard.writeText(f.path);
                          showToast(`تم نسخ المسار: ${f.path}`);
                        }}
                        className="shrink-0 p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 transition"
                        title="نسخ المسار"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  sounds.playClick();
                  const allFilesText = [
                    '# ملفات تطبيق توتي شات - Toti Chat',
                    '## الواجهات الرئيسية (Views):',
                    '- src/views/ProfileView.tsx (الملف الشخصي وبطاقة الوكالة)',
                    '- src/views/HomeView.tsx (الرئيسية والغرف الصوتية)',
                    '- src/views/MessagesView.tsx (الرسائل والإشعارات)',
                    '## المكونات (Components):',
                    '- src/components/VoiceRoomModal.tsx (الغرفة الصوتية الملكية)',
                    '- src/components/AgencyModal.tsx (إدارة الوكالة والأعضاء)',
                    '- src/components/AgencyProfileCard.tsx (مستطيل الوكالة)',
                    '- src/components/InternalProfileModal.tsx (بروفايل المستخدم)',
                    '- src/components/SettingsModal.tsx (الإعدادات وقفل VIP 6+)',
                    '- src/components/VipModal.tsx (مستويات VIP)',
                    '- src/components/GiftStoreModal.tsx (متجر الهدايا)',
                    '- src/components/StorageModal.tsx (حقيبة التخزين)',
                    '## الحالة والبيانات:',
                    '- src/context/AppContext.tsx (الحالة المركزية)',
                    '- src/i18n/translations.ts (الترجمات)',
                    '- src/types.ts (الأنواع)',
                    '- src/mockData.ts (البيانات)',
                  ].join('\n');
                  navigator.clipboard.writeText(allFilesText);
                  showToast(isRtl ? 'تم نسخ قائمة ملفات المشروع إلى الحافظة 📋' : 'Project files copied to clipboard 📋');
                }}
                className="flex-1 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isRtl ? 'نسخ قائمة ملفات التطبيق' : 'Copy Files List'}</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveDialog(null);
                }}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
