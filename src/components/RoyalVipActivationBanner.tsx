import React, { useId } from 'react';

/** Presentation only: never grants VIP privileges or claims payment succeeded. */
export const RoyalVipActivationBanner: React.FC<{
  level: number;
  displayName?: string;
  preview?: boolean;
}> = ({ level, displayName, preview = false }) => {
  const uid = useId().replace(/:/g, '');
  const gold = `vip-banner-gold-${uid}`;
  const green = `vip-banner-green-${uid}`;
  const safeLevel = Math.max(1, Math.min(12, Math.trunc(Number.isFinite(level) ? level : 1)));
  return (
    <div dir="rtl" role={preview ? undefined : 'status'} aria-live={preview ? undefined : 'polite'} className="relative isolate w-full max-w-sm overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-l from-[#052b23] via-[#0a7152] to-[#042b25] p-3 text-white shadow-[0_8px_30px_rgba(0,0,0,.35)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full border-[10px] border-amber-300/10" />
      <div className="relative flex items-center gap-3">
        <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0" aria-hidden="true">
          <defs>
            <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff8c6"/><stop offset=".55" stopColor="#edbb55"/><stop offset="1" stopColor="#8b581a"/></linearGradient>
            <linearGradient id={green} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#43c99c"/><stop offset="1" stopColor="#03513e"/></linearGradient>
          </defs>
          <circle cx="36" cy="36" r="32" fill={`url(#${green})`} stroke={`url(#${gold})`} strokeWidth="3"/>
          <path d="M13 25 L22 32 L36 14 L50 32 L59 25 L54 46 H18 Z" fill={`url(#${gold})`} stroke="#fff5bd" strokeWidth="1.5"/>
          <path d="M21 51 H51" stroke="#f9d781" strokeWidth="3" strokeLinecap="round"/>
          <text x="36" y="41" fontSize="14" fontWeight="900" fill="#064832" textAnchor="middle">{safeLevel}</text>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black text-amber-200">{preview ? 'معاينة بنر VIP' : 'تم تفعيل VIP'}</div>
          <div className="mt-1 truncate text-base font-black">{displayName || 'العضوية الملكية'}</div>
          <div className="mt-0.5 text-sm font-bold text-amber-100">VIP {safeLevel}</div>
        </div>
        <span className="text-xl text-amber-200" aria-hidden="true">✦</span>
      </div>
    </div>
  );
};
