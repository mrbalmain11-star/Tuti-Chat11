import React, { useId } from 'react';

/** Seat artwork only: the authoritative locked/occupied state remains with the room server. */
export const RoyalSeatIcon: React.FC<{ locked?: boolean; className?: string }> = ({ locked = false, className = 'w-8 h-8' }) => {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`seatGold-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff0b3"/><stop offset=".45" stopColor="#dba749"/><stop offset="1" stopColor="#8b5d1d"/>
      </linearGradient>
      <linearGradient id={`seatGreen-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#1cc99b"/><stop offset="1" stopColor="#064d3f"/>
      </linearGradient>
    </defs>
    <path d="M11 30 Q11 20 21 20 H43 Q53 20 53 30 V46 H11 Z" fill={`url(#seatGreen-${id})`} stroke={`url(#seatGold-${id})`} strokeWidth="2.5"/>
    <path d="M15 36 Q15 32 21 32 H43 Q49 32 49 36 V47 H15 Z" fill="#0a735c" stroke="#d8b76b" strokeWidth="1.5"/>
    <path d="M8 34 Q8 29 13 29 Q18 29 18 34 V48 H8 Z M46 34 Q46 29 51 29 Q56 29 56 34 V48 H46 Z" fill="#0a604c" stroke="#e3b960" strokeWidth="2"/>
    <path d="M9 48 H55 V52 H9 Z" fill={`url(#seatGold-${id})`}/>
    <path d="M14 52 V56 M50 52 V56" stroke="#d9ad5b" strokeWidth="4" strokeLinecap="round"/>
    {locked
      ? <g><rect x="25" y="27" width="14" height="13" rx="3" fill="#412908" stroke="#ffe3a0" strokeWidth="2"/><path d="M28 27 V23 A4 4 0 0 1 36 23 V27" stroke="#ffe3a0" strokeWidth="3" strokeLinecap="round"/><circle cx="32" cy="33" r="2" fill="#ffe3a0"/></g>
      : <g><circle cx="32" cy="25" r="9" fill="#073f34" stroke="#f5d68a" strokeWidth="1.5"/><path d="M32 20 V30 M27 25 H37" stroke="#f9e4a4" strokeWidth="2.5" strokeLinecap="round"/></g>}
  </svg>;
};
