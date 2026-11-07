import React, { useId } from 'react';

export type RoyalIdVariant = 'standard' | 'special' | 'royal';

/** Three visual ID treatments. Actual account ID and entitlement come from the parent. */
export const RoyalIdEmblem: React.FC<{ variant?: RoyalIdVariant; className?: string }> = ({ variant = 'standard', className = 'h-5 w-5' }) => {
  const uid = useId().replace(/:/g, '');
  const gold = `id-gold-${uid}`;
  const green = `id-green-${uid}`;
  const isRoyal = variant === 'royal';
  const isSpecial = variant === 'special';
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" role="img" aria-label={isRoyal ? 'معرف ملكي' : isSpecial ? 'معرف مميز' : 'معرف الحساب'}>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff8c6"/><stop offset=".5" stopColor="#e9b851"/><stop offset="1" stopColor="#91601f"/></linearGradient>
        <linearGradient id={green} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#69edba"/><stop offset=".5" stopColor="#087c5d"/><stop offset="1" stopColor="#043b30"/></linearGradient>
      </defs>
      <path d="M24 3 L41 12 V34 L24 45 L7 34 V12 Z" fill={`url(#${green})`} stroke={`url(#${gold})`} strokeWidth="2.5"/>
      {isRoyal ? <>
        <path d="M12 19 L17 24 L24 13 L31 24 L36 19 L33 32 H15 Z" fill={`url(#${gold})`} stroke="#fff3b6" strokeWidth=".8"/>
        <circle cx="24" cy="24" r="2.5" fill="#0c7556"/>
      </> : isSpecial ? <>
        <path d="M24 10 L28 19 L38 20 L30 27 L32 37 L24 32 L16 37 L18 27 L10 20 L20 19 Z" fill={`url(#${gold})`} stroke="#fff3b6" strokeWidth="1"/>
        <circle cx="24" cy="24" r="3" fill="#08775a"/>
      </> : <>
        <rect x="13" y="16" width="22" height="17" rx="3" fill={`url(#${gold})`}/>
        <circle cx="20" cy="23" r="3" fill="#086c53"/>
        <path d="M27 21 H32 M27 26 H32 M16 30 H32" stroke="#086c53" strokeWidth="1.8" strokeLinecap="round"/>
      </>}
    </svg>
  );
};
