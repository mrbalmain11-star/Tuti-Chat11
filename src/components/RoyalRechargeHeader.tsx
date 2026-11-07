import React, { useId } from 'react';

/** Presentation only. Never computes discounts, prices, eligibility, or payment status. */
export const RoyalRechargeHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const id = useId().replace(/:/g, '');
  const gold = `recharge-gold-${id}`;
  const green = `recharge-green-${id}`;
  return (
    <div dir="rtl" className="relative isolate overflow-hidden rounded-2xl border border-amber-300/70 bg-[#063e32] px-4 py-3 text-amber-50 shadow-lg">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 360 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={green} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#127d60"/><stop offset=".55" stopColor="#064a3b"/><stop offset="1" stopColor="#022c25"/>
          </linearGradient>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#9d6b28"/><stop offset=".5" stopColor="#fff0ad"/><stop offset="1" stopColor="#9d6b28"/>
          </linearGradient>
        </defs>
        <rect width="360" height="100" fill={`url(#${green})`}/>
        <path d="M0 83 Q100 30 190 87 T360 34 M0 97 Q100 45 190 100 T360 47" stroke={`url(#${gold})`} strokeOpacity=".35" strokeWidth="2" fill="none"/>
        <path d="M7 27 V14 Q7 7 14 7 H65 M353 73 V86 Q353 93 346 93 H295" fill="none" stroke={`url(#${gold})`} strokeWidth="2"/>
        <circle cx="50" cy="68" r="20" fill="none" stroke={`url(#${gold})`} strokeWidth="3" opacity=".7"/>
        <circle cx="50" cy="68" r="14" fill="none" stroke="#f4d585" strokeWidth="1" opacity=".6"/>
        <path d="M45 68 H55 M50 63 V73" stroke="#f5df9b" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <div className="relative z-10">
        <h3 className="text-sm font-black tracking-wide">{title}</h3>
        {subtitle && <p className="mt-1 text-[11px] font-medium text-amber-100/80">{subtitle}</p>}
      </div>
    </div>
  );
};
