import React, { useEffect, useState } from 'react';

/** Visual network notice only. Does not disconnect, reconnect, or mutate room audio sessions. */
export const RoyalNetworkNotice: React.FC = () => {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" aria-live="polite" dir="rtl" className="pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[120] mx-auto max-w-sm">
      <div className="relative isolate flex items-center gap-3 overflow-hidden rounded-2xl border border-amber-300/80 bg-[#063f32] px-4 py-3 text-white shadow-[0_12px_32px_rgba(0,0,0,.4)]">
        <svg aria-hidden="true" className="h-12 w-12 shrink-0" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" fill="#09553f" stroke="#e7bd67" strokeWidth="2"/>
          <path d="M11 26 Q32 6 53 26 M18 34 Q32 20 46 34 M25 42 Q32 35 39 42" stroke="#f7d993" strokeWidth="4" strokeLinecap="round"/>
          <path d="M14 50 L50 14" stroke="#07392f" strokeWidth="8" strokeLinecap="round"/>
          <path d="M14 50 L50 14" stroke="#f0ae76" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-amber-100">انقطع اتصال الإنترنت</p>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-50">تحقق من الشبكة. ستختفي الرسالة عند عودة اتصال الجهاز.</p>
        </div>
      </div>
    </div>
  );
};
