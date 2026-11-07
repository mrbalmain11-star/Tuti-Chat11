import React, { useId } from 'react';

/** Presentation-only daily reward artwork. Reward eligibility and claims remain server-controlled. */
export const RoyalDailyRewardArtwork: React.FC<{
  day: number;
  claimed?: boolean;
  active?: boolean;
  className?: string;
}> = ({ day, claimed = false, active = false, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const gold = `daily-gold-${uid}`;
  const emerald = `daily-green-${uid}`;
  return (
    <div className={`relative isolate flex flex-col items-center justify-center overflow-hidden rounded-2xl border p-3 text-center ${active ? 'border-amber-300 bg-emerald-900' : 'border-emerald-600/40 bg-emerald-950'} ${className}`}
      aria-label={`مكافأة اليوم ${day}${claimed ? ' مستلمة' : ''}`}>
      <svg aria-hidden="true" viewBox="0 0 100 90" className="h-20 w-20 max-w-full">
        <defs>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff7bd"/><stop offset=".5" stopColor="#e9b94f"/><stop offset="1" stopColor="#8e571e"/></linearGradient>
          <linearGradient id={emerald} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8fffd3"/><stop offset=".6" stopColor="#0e986e"/><stop offset="1" stopColor="#07513e"/></linearGradient>
        </defs>
        <ellipse cx="50" cy="79" rx="34" ry="6" fill="#021f19" opacity=".5"/>
        <path d="M20 37 H80 V70 Q80 76 74 76 H26 Q20 76 20 70 Z" fill={`url(#${emerald})`} stroke={`url(#${gold})`} strokeWidth="2"/>
        <path d="M15 31 H85 V44 H15 Z" fill={`url(#${gold})`} stroke="#fff2bf" strokeWidth="1.5"/>
        <path d="M45 31 H55 V76 H45 Z" fill={`url(#${gold})`}/>
        <path d="M50 30 C33 25 30 14 38 13 C46 12 49 24 50 30 Z M50 30 C67 25 70 14 62 13 C54 12 51 24 50 30 Z" fill={`url(#${gold})`} stroke="#fff2bf" strokeWidth="1.5"/>
        <path d="M50 8 L53 14 L59 17 L53 20 L50 26 L47 20 L41 17 L47 14 Z" fill="#fff5c0"/>
        <circle cx="50" cy="57" r="10" fill="#0b5c46" stroke="#ffe8a2" strokeWidth="1.5"/>
        <path d="M46 57 H54 M50 53 V61" stroke="#ffe8a2" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span className="mt-1 text-xs font-black text-amber-100">اليوم {day}</span>
      {claimed && <span className="mt-1 rounded-full border border-emerald-300/50 bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">تم الاستلام</span>}
    </div>
  );
};
