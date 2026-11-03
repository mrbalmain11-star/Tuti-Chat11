import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clock3, LockKeyhole, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { requestGoogleEmailOtp, verifyGoogleEmailOtp } from '../services/googleEmailOtp';

type Props = { email: string; onVerified: () => void; onBack: () => void };

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'بريد Google المرتبط بحسابك';
  return name.slice(0, Math.min(2, name.length)) + '***@' + domain;
}

export const GoogleEmailOtpScreen: React.FC<Props> = ({ email, onVerified, onBack }) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [remaining, setRemaining] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState<number | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const started = useRef(false);
  const code = digits.join('');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(value => Math.max(0, value - 1));
      setExpiresIn(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const send = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await requestGoogleEmailOtp();
      if (result.status === 'already_verified') {
        onVerified();
        return;
      }
      if (result.status === 'sent') {
        setRemaining(60);
        setExpiresIn(result.expiresInSeconds ?? 300);
        setDigits(['', '', '', '', '', '']);
        setAttempts(null);
        setMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
        window.setTimeout(() => inputs.current[0]?.focus(), 80);
      } else if (result.status === 'rate_limited') {
        setRemaining(result.retryAfterSeconds ?? 60);
        setMessage('يرجى الانتظار قبل إعادة إرسال الرمز');
      } else if (result.status === 'delivery_failed') {
        setRemaining(60);
        setMessage('تعذر إرسال البريد، حاول مجدداً بعد دقيقة');
      } else if (result.status === 'unauthorized') {
        setMessage('انتهت جلسة Google، سجّل الدخول مرة أخرى');
      } else {
        setMessage('خدمة التحقق غير متاحة حالياً، حاول لاحقاً');
      }
    } catch {
      setMessage('تعذر إرسال الرمز، تأكد من اتصال الإنترنت وحاول مجدداً');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send();
  }, []);

  const update = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (!clean) {
      setDigits(prev => prev.map((digit, i) => i === index ? '' : digit));
      return;
    }
    const next = [...digits];
    for (let i = 0; i < clean.length && index + i < 6; i++) next[index + i] = clean[i];
    setDigits(next);
    inputs.current[Math.min(5, index + clean.length)]?.focus();
    setMessage('');
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || code.length !== 6 || expiresIn === 0 || attempts === 0) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await verifyGoogleEmailOtp(code);
      if (result.status === 'verified') {
        onVerified();
        return;
      }
      if (typeof result.remainingAttempts === 'number') setAttempts(result.remainingAttempts);
      setMessage(result.status === 'locked' ? 'تم استنفاد المحاولات، اطلب رمزاً جديداً' :
        result.status === 'expired' ? 'انتهت صلاحية الرمز، اطلب رمزاً جديداً' : 'الرمز غير صحيح، حاول مرة أخرى');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch {
      setMessage('تعذر التحقق من الرمز، حاول مجدداً');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[1000] min-h-screen overflow-y-auto bg-[#001d18] text-white font-['Cairo',sans-serif]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-44 h-[450px] w-[450px] rounded-full border border-amber-400/40 shadow-[0_0_80px_rgba(16,185,129,.2)]" />
        <div className="absolute -bottom-44 -left-36 h-[420px] w-[420px] rounded-full border border-amber-400/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(16,185,129,.19),transparent_65%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 pb-[calc(28px+env(safe-area-inset-bottom,0px))] pt-[calc(24px+env(safe-area-inset-top,0px))]">
        <button type="button" onClick={onBack} aria-label="الرجوع" className="absolute left-6 top-8 rounded-full p-2 text-amber-300 active:bg-white/10">
          <ArrowRight className="h-7 w-7" />
        </button>
        <div className="mt-7 text-center">
          <div className="text-5xl text-amber-300" aria-hidden="true">🦅</div>
          <div className="mt-1 font-serif text-4xl font-bold tracking-wide text-amber-300">TotiChat</div>
          <div className="mt-1 text-xs tracking-widest text-amber-100/70">ROYAL SECURITY</div>
        </div>
        <div className="mt-9 flex h-28 w-28 items-center justify-center rounded-[30px] border-2 border-amber-300 bg-gradient-to-br from-emerald-700 via-emerald-950 to-black shadow-[0_0_35px_rgba(251,191,36,.2)]">
          <ShieldCheck className="h-16 w-16 text-amber-300" strokeWidth={1.5} />
          <LockKeyhole className="absolute h-7 w-7 text-white" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-amber-300">تحقق من الرمز</h1>
        <p className="mt-4 text-center text-sm leading-7 text-emerald-50/85">أدخل رمز التحقق المرسل إلى بريدك الإلكتروني المرتبط بحساب Google</p>
        <div dir="ltr" className="mt-4 flex max-w-full items-center gap-3 rounded-full border border-amber-400/70 bg-emerald-950/70 px-5 py-3 text-sm text-amber-50">
          <Mail className="h-5 w-5 shrink-0 text-amber-300" />
          <span className="truncate">{maskEmail(email)}</span>
        </div>
        <form onSubmit={verify} className="mt-8 w-full">
          <div dir="ltr" className="flex w-full justify-center gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={element => { inputs.current[index] = element; }}
                value={digit}
                onChange={event => update(index, event.target.value)}
                onKeyDown={event => { if (event.key === 'Backspace' && !digit && index > 0) inputs.current[index - 1]?.focus(); }}
                onPaste={event => { event.preventDefault(); update(index, event.clipboardData.getData('text')); }}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={6}
                aria-label={`الرقم ${index + 1}`}
                className="h-14 min-w-0 flex-1 rounded-xl border border-amber-400/70 bg-emerald-950/90 text-center text-2xl font-bold text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400"
              />
            ))}
          </div>
          <div className="mt-7 flex items-center justify-center gap-2 text-sm text-emerald-100/85">
            <Clock3 className="h-4 w-4 text-amber-300" />
            {remaining > 0 ? <span>إعادة إرسال الرمز خلال <b dir="ltr" className="text-emerald-300">{`00:${String(remaining).padStart(2, '0')}`}</b></span> : <span>يمكنك طلب رمز جديد الآن</span>}
          </div>
          {expiresIn > 0 && <p className="mt-3 text-center text-xs text-emerald-100/65">صلاحية الرمز: {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}</p>}
          {message && <p role="status" className="mt-4 text-center text-sm text-amber-200">{message}</p>}
          {attempts !== null && <p className="mt-2 text-center text-xs text-emerald-100/70">المحاولات المتبقية: {attempts}</p>}
          <button type="submit" disabled={busy || code.length !== 6 || expiresIn === 0 || attempts === 0} className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-xl font-bold text-white shadow-[0_0_20px_rgba(251,191,36,.2)] disabled:opacity-50">
            {busy ? 'يرجى الانتظار...' : <><Check className="h-5 w-5" /> تحقق</>}
          </button>
        </form>
        <button type="button" onClick={() => void send()} disabled={busy || remaining > 0} className="mt-7 flex items-center gap-2 text-base font-bold text-emerald-300 underline underline-offset-8 disabled:opacity-40">
          <RefreshCw className="h-4 w-4" /> إعادة إرسال الرمز
        </button>
        <p className="mt-auto pt-8 text-center text-xs text-emerald-100/45">حماية حسابك من أولويات TotiChat</p>
      </div>
    </div>
  );
};
