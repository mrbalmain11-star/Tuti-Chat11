import { integerDigits } from '../utils/digits';
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
        setExpiresIn(result.expiresInSeconds && result.expiresInSeconds > 0 ? result.expiresInSeconds : 300);
        setDigits(['', '', '', '', '', '']);
        setAttempts(null);
        setMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
        window.setTimeout(() => inputs.current[0]?.focus(), 80);
      } else if (result.status === 'rate_limited') {
        // A prior challenge may still be valid; keep the existing code entry state.
        setRemaining(result.retryAfterSeconds ?? 60);
        setMessage('يرجى الانتظار قبل إعادة إرسال الرمز');
      } else if (result.status === 'not_configured') {
        setMessage('خدمة إرسال البريد غير مهيأة على الخادم. يرجى التواصل مع الإدارة');
      } else if (result.status === 'delivery_failed') {
        setRemaining(60);
        setMessage('تعذر إرسال البريد، حاول مجدداً بعد دقيقة');
      } else if (result.status === 'unauthorized') {
        setMessage('انتهت جلسة Google، سجّل الدخول مرة أخرى');
      } else {
        setMessage('خدمة التحقق غير متاحة على الخادم حالياً، حاول لاحقاً');
      }
    } catch {
      setMessage('تعذر الاتصال بخدمة التحقق. يرجى المحاولة لاحقاً');
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
    const clean = integerDigits(value);
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
    if (busy) return;
    if (code.length !== 6) { setMessage('أدخل الأرقام الستة للرمز أولاً'); return; }
    if (attempts === 0) { setMessage('تم استنفاد المحاولات، اطلب رمزاً جديداً'); return; }
    setBusy(true);
    setMessage('');
    try {
      const result = await verifyGoogleEmailOtp(code);
      if (result.status === 'verified') {
        onVerified();
        return;
      }
      if (typeof result.remainingAttempts === 'number') setAttempts(result.remainingAttempts);
      if (result.status === 'expired') setExpiresIn(0);
      if (result.status === 'locked') setAttempts(0);
      setMessage(result.status === 'locked' ? 'تم استنفاد المحاولات، اطلب رمزاً جديداً' :
        result.status === 'expired' ? 'انتهت صلاحية الرمز، اطلب رمزاً جديداً' :
        result.status === 'unauthorized' ? 'انتهت جلسة Google، سجّل الدخول مرة أخرى' :
        result.status === 'server_unavailable' ? 'خدمة التحقق غير متاحة حالياً' : 'الرمز غير صحيح، حاول مرة أخرى');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch {
      setMessage('تعذر التحقق من الرمز، حاول مجدداً');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[1000] overflow-hidden bg-[#001d18] text-white font-['Cairo',sans-serif]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(16,185,129,.18),transparent_70%)]" />
      <div className="relative mx-auto flex h-full w-full max-w-md flex-col justify-center px-5 py-[max(12px,env(safe-area-inset-top,0px))]">
        <button type="button" onClick={onBack} aria-label="الرجوع" className="absolute left-4 top-[max(12px,env(safe-area-inset-top,0px))] rounded-full p-2 text-amber-300">
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="mx-auto flex w-full flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/60 bg-emerald-950 shadow-[0_0_16px_rgba(251,191,36,.12)]">
            <ShieldCheck className="h-7 w-7 text-amber-300" />
          </div>
          <h1 className="text-xl font-extrabold text-amber-300">التحقق من البريد</h1>
          <p className="text-center text-xs leading-5 text-emerald-50/80">أدخل الرمز المكوّن من 6 أرقام المرسل إلى بريدك</p>
          <div dir="ltr" className="flex max-w-full items-center gap-2 rounded-full border border-amber-400/50 bg-emerald-950/70 px-3 py-1.5 text-xs text-amber-50">
            <Mail className="h-4 w-4 shrink-0 text-amber-300" /><span className="truncate">{maskEmail(email)}</span>
          </div>
        </div>
        <form onSubmit={verify} className="mt-5 w-full">
          <div dir="ltr" className="flex w-full justify-center gap-1.5">
            {digits.map((digit, index) => (
              <input key={index} ref={element => { inputs.current[index] = element; }} value={digit}
                onChange={event => update(index, event.target.value)}
                onKeyDown={event => { if (event.key === 'Backspace' && !digit && index > 0) inputs.current[index - 1]?.focus(); }}
                onPaste={event => { event.preventDefault(); update(index, event.clipboardData.getData('text')); }}
                inputMode="numeric" pattern="[0-9]*" autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={6} aria-label={`الرقم ${index + 1}`}
                className="h-11 min-w-0 flex-1 rounded-lg border border-amber-400/65 bg-emerald-950/90 text-center text-lg font-bold text-white outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-400"
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-100/85">
            <Clock3 className="h-3.5 w-3.5 text-amber-300" />
            {remaining > 0 ? <span>إعادة الإرسال خلال <b dir="ltr" className="text-emerald-300">{`00:${String(remaining).padStart(2, '0')}`}</b></span> : <span>يمكنك طلب رمز جديد الآن</span>}
          </div>
          {expiresIn > 0 && <p className="mt-1 text-center text-[11px] text-emerald-100/65">صلاحية الرمز: {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}</p>}
          {message && <p role="status" className="mt-2 text-center text-xs text-amber-200">{message}</p>}
          {attempts !== null && <p className="mt-1 text-center text-xs text-emerald-100/70">المحاولات المتبقية: {attempts}</p>}
          <button type="submit" disabled={busy} aria-busy={busy} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-sm font-bold text-white disabled:opacity-50">
            {busy ? 'يرجى الانتظار...' : <><Check className="h-4 w-4" /> تحقق من الرمز</>}
          </button>
        </form>
        <button type="button" onClick={() => void send()} disabled={busy || remaining > 0} aria-busy={busy} className="mx-auto mt-3 flex items-center gap-2 text-xs font-bold text-emerald-300 underline underline-offset-4 disabled:opacity-40">
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> {busy ? 'جارٍ إرسال الرمز...' : 'إعادة إرسال الرمز'}
        </button>
      </div>
    </div>
  );
};
