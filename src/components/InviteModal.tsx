import React, { useState } from 'react';
import {
  X,
  Gift,
  Copy,
  Check,
  Share2,
  Clock,
  Headphones,
  Sparkles,
  Coins,
  MessageCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const InviteModal: React.FC = () => {
  const { openInviteModal, setOpenInviteModal, currentUser, updateUserProfile } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [simulatedClaimed, setSimulatedClaimed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!openInviteModal) return null;

  const userId = currentUser.id || '313';
  const userName = currentUser.name || 'مستخدم توتي';
  const inviteUrl = `https://tuliling.app/invite?u=${userId}`;
  const inviteCode = userId;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard?.writeText(inviteUrl);
      setCopiedLink(true);
      sounds.playCoin();
      showToast('تم نسخ رابط الدعوة الخاص بتطبيقنا بنجاح! 📋');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (_) {
      showToast('تم نسخ رابط الدعوة بنجاح!');
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard?.writeText(inviteCode);
      setCopiedCode(true);
      sounds.playCoin();
      showToast(`تم نسخ كود الدعوة: ${inviteCode}`);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (_) {
      showToast('تم نسخ كود الدعوة!');
    }
  };

  const handleShareWhatsApp = () => {
    sounds.playClick();
    const shareText = `🎉 انضم إلينا في أفضل تطبيق دردشة صوتية وترفيهية!\n✨ هناك مكافأة لكل مستخدم جديد وتحصل على 2500 عملة ذهبية!\nرابط الدعوة الخاص بي:\n${inviteUrl}\nكود الدعوة: ${inviteCode}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareTelegram = () => {
    sounds.playClick();
    const shareText = `🎉 انضم لتطبيقنا! هناك مكافأة لكل مستخدم جديد تحصل على 2500 عملة ذهبية 🪙\nكود الدعوة: ${inviteCode}`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank');
  };

  const handleNativeShare = async () => {
    sounds.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'دعوة للانضمام إلى تطبيقنا ومكافأة 2500 عملة ذهبية',
          text: `هناك مكافأة لكل مستخدم جديد تحصل علئ 2500 عمله ذهبية. اضغط على رابط الدعوه الخاص بتطبيقنا سيظهر معلوماتك لخدمة العملاء. كود الدعوة: ${inviteCode}`,
          url: inviteUrl,
        });
      } catch (_) {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSimulateNewUserReward = () => {
    sounds.playGiftFanfare();
    const bonus = 2500;
    updateUserProfile({ coins: (currentUser.coins || 0) + bonus });
    setSimulatedClaimed(true);
    showToast('🎉 مبروك! تمت محاكاة دخول مستخدم جديد، وتم إيداع 2,500 عملة ذهبية في حسابك فوراً!');
    setTimeout(() => setSimulatedClaimed(false), 5000);
  };

  return (
    <div
      onClick={() => setOpenInviteModal(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-['Cairo',sans-serif] p-3 sm:p-4 animate-in fade-in"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-b from-[#FFFDF9] via-[#FAF6ED] to-[#F7EFE1] border-2 border-amber-300 rounded-3xl p-5 shadow-[0_15px_50px_rgba(217,119,6,0.2)] text-right flex flex-col max-h-[92vh] overflow-y-auto animate-in zoom-in-95 relative"
      >
        {/* Toast feedback */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold px-4 py-2 rounded-full shadow-2xl text-xs flex items-center gap-2 border border-amber-300 animate-in fade-in slide-in-from-top duration-200">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-[1.5px] shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <div className="w-full h-full rounded-2xl bg-amber-500 flex items-center justify-center text-white">
                <Gift className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <span>دعوة الأصدقاء</span>
                <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                  مكافأة 2500 🪙
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">شارك رابط الدعوة واكسب عملات ذهبية مجانية</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              setOpenInviteModal(false);
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Prominent Reward Card - White & Gold */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-white via-amber-50 to-amber-100/60 border-2 border-amber-300 shadow-[0_4px_18px_rgba(245,158,11,0.15)] relative overflow-hidden">
          {/* Reward Amount Big Display */}
          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>مكافأة فورية</span>
            </span>
            <div className="flex items-center gap-1 text-amber-700 font-black text-base">
              <span className="text-xl">2,500</span>
              <span className="text-xs">عملة ذهبية</span>
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {/* Exact User Prompt Sentences Highlighted */}
          <div className="space-y-2 relative z-10">
            <h4 className="text-sm font-black text-slate-900 leading-snug">
              هناك مكافأة لكل مستخدم جديد تحصل علئ 2500 عمله ذهبية
            </h4>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-300 text-xs text-slate-800 leading-relaxed font-bold">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-sm mt-0.5">👉</span>
                <p className="font-bold text-amber-900">
                  اضغط على رابط الدعوه الخاص بتطبيقنا سيظهر معلوماتك لخدمة العملاء
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ستحصل عليها خلال 24ساعه من عملية دخول مستخدم جديد</span>
            </div>
          </div>
        </div>

        {/* Customer Service Link Info Box */}
        <div className="mt-3.5 p-3 rounded-2xl bg-white/90 border border-amber-200 text-xs text-slate-700 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <Headphones className="w-4 h-4 text-amber-600" />
              <span>معلوماتك المسجلة لدى خدمة العملاء:</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>مربوط بالنظام</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">كود الدعوة / المعرف:</span>
              <span className="font-mono font-black text-slate-900 text-xs">{userId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">اسم الحساب:</span>
              <span className="font-bold text-slate-900 text-xs truncate block">{userName}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-normal">
            عندما يقوم أي شخص بالنقر على رابط دعوتك والتسجيل، يُرسل إشعار لخدمة العملاء وتُضاف مكافأتك تلقائياً لمحفظتك خلال 24 ساعة.
          </p>
        </div>

        {/* Invite Link & Copy Section */}
        <div className="mt-3.5 space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            رابط الدعوة الخاص بتطبيقنا:
          </label>

          <div className="flex items-center gap-2 bg-white border-2 border-amber-300 rounded-2xl p-1.5 pr-3 shadow-inner">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent text-xs text-slate-900 font-mono flex-1 outline-none truncate text-left font-bold"
              dir="ltr"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-105'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Copy Code Button */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-600">
            <span>كود الدعوة الخاص بك: <strong className="text-amber-800 font-mono font-bold">{inviteCode}</strong></span>
            <button
              onClick={handleCopyCode}
              className="text-amber-700 hover:text-amber-900 underline font-bold text-[11px] flex items-center gap-1"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'تم نسخ الكود' : 'نسخ الكود'}</span>
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="mt-4 pt-3 border-t border-amber-200 space-y-2">
          <span className="text-xs font-bold text-slate-700 block">مشاركة سريعة:</span>
          <div className="grid grid-cols-3 gap-2">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>واتساب</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleShareTelegram}
              className="py-2.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Send className="w-4 h-4 text-sky-600" />
              <span>تيليجرام</span>
            </button>

            {/* Native / More Share */}
            <button
              onClick={handleNativeShare}
              className="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>مشاركة</span>
            </button>
          </div>
        </div>

        {/* Simulation / Testing button */}
        <div className="mt-4 pt-3 border-t border-amber-200">
          <button
            onClick={handleSimulateNewUserReward}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>تجربة محاكاة: انضمام مستخدم جديد الآن (+2500 ذهب)</span>
          </button>
          {simulatedClaimed && (
            <p className="text-[11px] text-emerald-700 text-center mt-1 font-bold animate-in fade-in">
              ✅ تمت إضافة 2500 عملة ذهبية إلى محفظتك بنجاح!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
