import React, { useId } from 'react';

/** Royal emerald room creation artwork, fully vector; does not change room creation logic. */
export const RoyalCreateRoomIcon: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  const uid = useId().replace(/:/g, '');
  return <svg viewBox="0 0 80 80" className={className} role="img" aria-label="إنشاء غرفة" focusable="false">
    <defs>
      <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff5ad"/><stop offset=".5" stopColor="#d9a536"/><stop offset="1" stopColor="#865018"/></linearGradient>
      <linearGradient id={`emerald-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b8ffe3"/><stop offset=".55" stopColor="#009e79"/><stop offset="1" stopColor="#064c3e"/></linearGradient>
    </defs>
    <ellipse cx="40" cy="70" rx="30" ry="4" fill="#064c3e" opacity=".22"/>
    <path d="M9 65 V35 H19 V65 M61 65 V35 H71 V65" fill={`url(#gold-${uid})`} stroke="#fff2bd" strokeWidth="1.3"/>
    <path d="M8 35 Q14 17 20 35 Z M60 35 Q66 17 72 35 Z" fill={`url(#emerald-${uid})`} stroke="#e5d08a" strokeWidth="1.5"/>
    <path d="M13 18 V29 M67 18 V29" stroke="#f8d77b" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 67 H61 V70 H19 Z" fill={`url(#gold-${uid})`} stroke="#fff2bd" strokeWidth="1"/>
    <path d="M22 40 H58 V66 H22 Z" fill={`url(#gold-${uid})`} stroke="#fff2bd" strokeWidth="1.5"/>
    <path d="M21 40 Q24 23 40 17 Q56 23 59 40 Z" fill={`url(#emerald-${uid})`} stroke="#f8df8a" strokeWidth="2"/>
    <path d="M28 34 Q40 23 52 34" stroke="#d9fff1" strokeWidth="1.3" opacity=".75" fill="none"/>
    <path d="M40 11 V18" stroke="#f8df8a" strokeWidth="2"/><circle cx="40" cy="10" r="2.5" fill="#fff0a5"/>
    <path d="M32 66 V52 Q40 43 48 52 V66" fill="#064a3b" stroke="#fff0a5" strokeWidth="2"/>
    <circle cx="60" cy="59" r="16" fill="#07563e" stroke="#fff2a3" strokeWidth="2.5"/>
    <path d="M60 50 V68 M51 59 H69" stroke="#eaffd8" strokeWidth="4" strokeLinecap="round"/>
    <path d="M24 46 V62 M56 46 V62" stroke="#fff4c4" strokeWidth="1" opacity=".55"/>
    <path d="M28 43 H52" stroke="#fff4c4" strokeWidth="1.2" opacity=".8"/>
  </svg>;
};
