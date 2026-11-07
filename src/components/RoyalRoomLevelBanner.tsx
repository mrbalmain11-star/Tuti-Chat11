import React, { useId } from 'react';

/** Room-level announcement UI only. No room level is inferred from gift totals or ranking. */
export const RoyalRoomLevelBanner: React.FC<{
  roomName: string;
  level?: number | null;
  preview?: boolean;
}> = ({ roomName, level, preview = false }) => {
  const uid = useId().replace(/:/g, '');
  const gold = `room-level-gold-${uid}`;
  const validLevel = typeof level === 'number' && Number.isSafeInteger(level) && level > 0 ? level : null;
  return (
    <div dir="rtl" role={preview ? undefined : 'status'} aria-live={preview ? undefined : 'polite'} className="relative isolate w-full max-w-sm overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-l from-[#032b24] via-[#0b7656] to-[#04352c] p-3 text-white shadow-[0_10px_30px_rgba(0,0,0,.3)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full border-8 border-amber-300/10" />
      <div className="relative flex items-center gap-3">
        <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0" aria-hidden="true">
          <defs><linearGradient id={gold} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff7bc"/><stop offset=".55" stopColor="#e9b751"/><stop offset="1" stopColor="#90601d"/></linearGradient></defs>
          <path d="M36 4 L60 16 V47 L36 67 L12 47 V16 Z" fill="#07543e" stroke={`url(#${gold})`} strokeWidth="3"/>
          <path d="M19 30 L25 36 L36 21 L47 36 L53 30 L50 48 H22 Z" fill={`url(#${gold})`} stroke="#fff1a3" strokeWidth="1"/>
          <text x="36" y="44" textAnchor="middle" fontSize={validLevel !== null && validLevel >= 100 ? 13 : 17} fontWeight="900" fill="#07543e">{validLevel ?? '—'}</text>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black text-amber-200">{preview ? 'معاينة بنر مستوى الغرفة' : 'ترقية مستوى الغرفة'}</div>
          <div className="mt-1 truncate text-sm font-black">{roomName}</div>
          <div className="mt-1 text-xs font-bold text-amber-100">{validLevel === null ? 'المستوى غير متوفر' : `وصلت إلى المستوى ${validLevel}`}</div>
        </div>
        <span className="text-xl text-amber-200" aria-hidden="true">✦</span>
      </div>
    </div>
  );
};
