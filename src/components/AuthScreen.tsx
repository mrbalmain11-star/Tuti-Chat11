import React, { useState } from 'react';
import { Headphones, Smartphone, ChevronLeft, ShieldCheck, X, FileText, Check, Loader2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

interface AuthScreenProps {
  onLoginSuccess?: () => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onClose,
  canDismiss = false,
}) => {
  const { setIsLoggedIn, currentUser, updateUserProfile } = useApp();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Phone Login State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+964');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGoogleLogin = () => {
    sounds.playCoin();
    setIsLoading(true);
    showToast('جاري تسجيل الدخول عبر Google...');
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
      onLoginSuccess?.();
    }, 600);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      showToast('يرجى إدخال رقم الهاتف أولاً');
      return;
    }
    sounds.playCoin();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      showToast(`تم إرسال رمز التحقق إلى ${countryCode}${phoneNumber}`);
    }, 700);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playCoin();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowPhoneModal(false);
      setIsLoggedIn(true);
      onLoginSuccess?.();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-[999] bg-[#05010c] text-white flex flex-col justify-between overflow-hidden select-none font-['Cairo',sans-serif]"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1100] bg-[#160A2E]/95 border border-amber-400/50 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dismiss Button (if modal can be closed) */}
      {canDismiss && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-50 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 active:scale-95 transition border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* =========================================================================
          Background Visual - 1:1 Matching User Uploaded Screenshot
          (Golden Falcon Crowned Emblem + Toti Chat typography + cosmic gold rings)
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep space cosmic background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0515] via-[#05010c] to-[#000000]" />

        {/* Ambient Top Golden Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[350px] bg-gradient-to-b from-amber-500/25 via-yellow-600/10 to-transparent rounded-full blur-[100px]" />

        {/* Top Arc Light Ring matching screenshot */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full border border-amber-400/35 shadow-[0_0_50px_rgba(245,158,11,0.25)] pointer-events-none" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[470px] h-[470px] rounded-full border border-amber-300/20 pointer-events-none" />

        {/* Bottom Arc Light Ring matching screenshot */}
        <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full border border-amber-400/30 shadow-[0_0_40px_rgba(245,158,11,0.2)] pointer-events-none" />

        {/* Ambient Golden Particle Stars */}
        <div className="absolute top-28 left-8 w-1 h-1 bg-amber-200 rounded-full animate-pulse" />
        <div className="absolute top-44 right-10 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping" />
        <div className="absolute top-64 left-14 w-1 h-1 bg-amber-400 rounded-full" />
        <div className="absolute top-80 right-16 w-1 h-1 bg-amber-100 rounded-full" />
        <div className="absolute bottom-48 left-12 w-1.5 h-1.5 bg-yellow-200 rounded-full" />
      </div>

      {/* =========================================================================
          Center Hero: Royal Crowned Falcon & "Toti Chat توتى شات" Logo
          ========================================================================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-8 px-6 pb-2">
        {/* Crowned Falcon Shield Emblem matching uploaded screenshot */}
        <div className="relative mb-2 flex flex-col items-center">
          {/* Main Golden Circle Container */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full p-2 flex items-center justify-center">
            {/* Glowing Outer Gold Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.65)] animate-pulse" />
            <div className="absolute inset-1.5 rounded-full border border-yellow-200/60" />

            {/* High-Resolution Emblem Image */}
            <div className="w-full h-full rounded-full overflow-hidden relative shadow-2xl bg-black border border-amber-500/50">
              <img
                src="/toti-login-bg.jpg"
                alt="Toti Chat Crowned Falcon"
                className="w-full h-full object-cover scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
            </div>

            {/* Golden Voice Waveform Bubble on Bottom Left of Falcon (as in screenshot) */}
            <div className="absolute -bottom-2 -left-1 w-16 h-16 rounded-full bg-gradient-to-b from-[#FDE047] via-[#D97706] to-[#78350F] p-[2px] shadow-[0_0_20px_rgba(245,158,11,0.8)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-black/90 flex items-center justify-center gap-1">
                <div className="w-1 h-4 bg-amber-400 rounded-full animate-pulse" />
                <div className="w-1 h-7 bg-amber-300 rounded-full animate-pulse delay-75" />
                <div className="w-1 h-5 bg-amber-400 rounded-full animate-pulse delay-150" />
                <div className="w-1 h-8 bg-yellow-200 rounded-full animate-pulse delay-100" />
                <div className="w-1 h-3 bg-amber-400 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>

          {/* 3D Metallic Typography: "Toti Chat" */}
          <div className="text-center mt-3">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              <span className="bg-gradient-to-b from-[#FFFFFF] via-[#FDE047] to-[#CA8A04] bg-clip-text text-transparent">
                Toti Chat
              </span>
            </h1>

            {/* Arabic Script with side golden lines: ── توتى شات ── */}
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <div className="w-12 h-[2px] bg-gradient-to-r from-transparent to-amber-400" />
              <span className="text-xl sm:text-2xl font-black text-amber-300 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                توتى شات
              </span>
              <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Bottom Controls & Buttons Section (1:1 Match with Screenshot)
          ========================================================================= */}
      <div className="relative z-10 px-6 pb-7 w-full max-w-sm mx-auto flex flex-col items-center gap-4">
        {/* 1. Google Login Pill Button (White Glossy Pill) */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-full bg-gradient-to-b from-white via-[#F8FAFC] to-[#E2E8F0] hover:brightness-105 active:scale-[0.98] text-slate-900 shadow-[0_8px_25px_rgba(255,255,255,0.2)] border border-white flex items-center justify-between transition cursor-pointer group"
        >
          {/* Google G Multi-Color Icon */}
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          {/* Text: سجل الدخول عبر جوجل */}
          <span className="text-base font-black text-slate-900 tracking-wide">
            سجل الدخول عبر جوجل
          </span>

          {/* Forward Arrow */}
          <ChevronLeft className="w-6 h-6 text-slate-700 stroke-[3] group-hover:-translate-x-1 transition" />
        </button>

        {/* 2. Phone Login Pill Button (24K Gold Metallic Pill) */}
        <button
          onClick={() => {
            sounds.playCoin();
            setShowPhoneModal(true);
          }}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#D97706] via-[#FBBF24] to-[#B45309] hover:brightness-105 active:scale-[0.98] text-slate-950 shadow-[0_8px_25px_rgba(245,158,11,0.35)] border border-amber-300/80 flex items-center justify-between transition cursor-pointer group"
        >
          {/* Phone Icon */}
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>

          {/* Text: سجل الدخول عبر الهاتف */}
          <span className="text-base font-black text-slate-950 tracking-wide">
            سجل الدخول عبر الهاتف
          </span>

          {/* Forward Arrow */}
          <ChevronLeft className="w-6 h-6 text-slate-950 stroke-[3] group-hover:-translate-x-1 transition" />
        </button>

        {/* 3. سياسة الاستخدام > with Shield/Doc Icon */}
        <button
          onClick={() => {
            sounds.playClick();
            setShowTermsModal(true);
          }}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300 hover:text-amber-300 transition py-1 cursor-pointer group"
        >
          {/* Doc with Shield Icon */}
          <div className="w-5 h-5 flex items-center justify-center text-amber-400">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="tracking-wide">سياسة الاستخدام</span>
          <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-300 stroke-[2.5] group-hover:-translate-x-0.5 transition" />
        </button>

        {/* 4. Support Contact Card (Bottom Card matching screenshot) */}
        <button
          onClick={() => {
            sounds.playClick();
            setShowSupportModal(true);
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-black/60 hover:bg-black/80 border border-neutral-700/80 hover:border-amber-500/60 shadow-lg flex items-center justify-between transition active:scale-[0.98] cursor-pointer group backdrop-blur-md"
        >
          {/* Left Headphones Icon */}
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition">
            <Headphones className="w-5 h-5" />
          </div>

          {/* Center Text */}
          <div className="flex flex-col items-center text-center flex-1 px-2">
            <span className="text-xs sm:text-[13px] font-bold text-slate-200 group-hover:text-white leading-snug">
              اذا واجهة مشكله في تسجيل الدخول
            </span>
            <span className="text-xs text-amber-300/90 font-semibold">
              يمكنك التواصل معنا
            </span>
          </div>

          {/* Right Chevron */}
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-400 stroke-[2.5] group-hover:-translate-x-0.5 transition shrink-0" />
        </button>
      </div>

      {/* =========================================================================
          Phone Number Login Modal (انبثاق تسجيل رقم الهاتف)
          ========================================================================= */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-[1050] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-sm bg-[#100724] border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">تسجيل الدخول عبر الهاتف</h3>
              </div>
              <button
                onClick={() => {
                  setShowPhoneModal(false);
                  setStep('phone');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="pt-4 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  أدخل رقم هاتفك لتسجيل الدخول فوراً واستلام رمز التحقق:
                </p>

                <div className="flex items-center gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="p-3 rounded-xl bg-purple-950/80 border border-purple-700/60 text-amber-300 text-xs font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="+964">العراق (+964) 🇮🇶</option>
                    <option value="+966">السعودية (+966) 🇸🇦</option>
                    <option value="+20">مصر (+20) 🇪🇬</option>
                    <option value="+963">سوريا (+963) 🇸🇾</option>
                    <option value="+971">الإمارات (+971) 🇦🇪</option>
                  </select>

                  <input
                    type="tel"
                    placeholder="770 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="flex-1 p-3 rounded-xl bg-purple-950/80 border border-purple-700/60 text-white text-sm font-sans text-left focus:outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <span>إرسال رمز التحقق</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="pt-4 space-y-4">
                <p className="text-xs text-slate-300">
                  تم إرسال رمز التحقق المكوّن من 4 أرقام إلى هاتفك:
                </p>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="1 2 3 4"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  className="w-full p-3.5 rounded-xl bg-purple-950/80 border border-amber-400 text-amber-300 text-xl font-mono text-center tracking-widest focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <span>تأكيد والدخول</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full text-xs text-slate-400 hover:text-white text-center py-1 font-semibold"
                >
                  تغيير رقم الهاتف
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          Terms of Use & Privacy Modal (سياسة الاستخدام)
          ========================================================================= */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[1050] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#120726] border border-amber-500/40 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">سياسة الاستخدام والخصوصية</h3>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 overflow-y-auto text-xs text-slate-300 leading-relaxed no-scrollbar text-right">
              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/40">
                <h4 className="font-bold text-amber-300 mb-1">1. الأمان والخصوصية:</h4>
                <p>جميع بيانات المستخدمين، المحادثات، والأنشطة الصوتية مشفرة ومحمية وفق أعلى معايير الخصوصية والأمان.</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/40">
                <h4 className="font-bold text-amber-300 mb-1">2. قواعد المجتمع الملكي:</h4>
                <p>يُمنع منعاً باتاً الإساءة أو الترويج لمحتوى غير لائق داخل الغرف الصوتية، ونلتزم ببيئة احترام متبادلة لجميع الأعضاء.</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/40">
                <h4 className="font-bold text-amber-300 mb-1">3. العملات والشحن:</h4>
                <p>جميع المعاملات المالية لشحن الكوينز والماس والهدايا تتم عبر بوابات دفع رسمية مؤمنة وفورية بنسبة 100%.</p>
              </div>
            </div>

            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition active:scale-95 mt-2"
            >
              فهمت وموافق ✅
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          Customer Support Modal (التواصل مع الدعم الفني)
          ========================================================================= */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[1050] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#120726] border border-amber-500/40 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">الدعم الفني لتوتي شات</h3>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-right">
              <p className="text-xs text-slate-300 leading-relaxed">
                فريق خدمة العملاء متاح على مدار الساعة 24/7 لحل أي مشكلة تواجهك في تسجيل الدخول أو الشحن:
              </p>

              <div className="space-y-2">
                <a
                  href="https://t.me/ML_11_11L"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3.5 rounded-2xl bg-[#0088cc]/20 border border-[#0088cc]/50 hover:bg-[#0088cc]/30 flex items-center justify-between text-white text-xs font-bold transition active:scale-98"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-[#38bdf8] font-bold">الدعم الفني عبر Telegram</span>
                    <span className="text-[11px] text-slate-300 font-mono" dir="ltr">@ML_11_11L</span>
                  </div>
                  <span className="text-xl">✈️</span>
                </a>

                <a
                  href="https://wa.me/9647713312563"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-3.5 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/50 hover:bg-[#25D366]/30 flex items-center justify-between text-white text-xs font-bold transition active:scale-98"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-[#4ade80] font-bold">الدعم الفني عبر WhatsApp</span>
                    <span className="text-[11px] text-slate-300 font-mono" dir="ltr">+964 771 331 2563</span>
                  </div>
                  <span className="text-xl">💬</span>
                </a>

                <a
                  href="mailto:support@totichat.app"
                  className="w-full p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 flex items-center justify-between text-white text-xs font-bold transition active:scale-98"
                >
                  <span className="text-amber-300">البريد الرسمي: support@totichat.app</span>
                  <span>✉️</span>
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition active:scale-95"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
