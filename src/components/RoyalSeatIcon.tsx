import React, { useId } from 'react';

/** Decorative seat frame. The server remains authoritative for seat lock/occupancy. */
export const RoyalSeatIcon: React.FC<{ locked?: boolean; className?: string; frameOnly?: boolean }> = ({ locked = false, className = 'w-8 h-8', frameOnly = false }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`royalGold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff4bb"/><stop offset=".4" stopColor="#e9bd60"/><stop offset=".72" stopColor="#b77c2a"/><stop offset="1" stopColor="#fff0a0"/>
        </linearGradient>
        <radialGradient id={`royalGreen-${id}`}>
          <stop stopColor="#146d58"/><stop offset="1" stopColor="#062b2b"/>
        </radialGradient>
      </defs>
      <circle cx="40" cy="43" r="31" fill={frameOnly ? "none" : `url(#royalGreen-${id})`} stroke={`url(#royalGold-${id})`} strokeWidth="3"/>
      <circle cx="40" cy="43" r="27" stroke="#f5d88a" strokeOpacity=".8" strokeWidth="1.3" strokeDasharray="2 3"/>
      <path d="M20 15 L18 5 L29 11 L40 1 L51 11 L62 5 L60 15 Z" fill={`url(#royalGold-${id})`} stroke="#fff2b6" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M22 15 H58 V20 Q40 17 22 20 Z" fill="#b97c27" stroke="#fff2b6"/>
      <circle cx="40" cy="11" r="2.8" fill="#21e6bc"/>
      <path d="M8 37 L3 31 L13 29 M72 37 L77 31 L67 29 M13 62 L7 69 L19 67 M67 62 L73 69 L61 67" stroke={`url(#royalGold-${id})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26 73 Q40 79 54 73" stroke="#f7d88b" strokeWidth="2" strokeLinecap="round"/>
      {!frameOnly && (locked
        ? <g><rect x="33" y="39" width="14" height="13" rx="2" fill="#9c6325" stroke="#fff0b2" strokeWidth="2"/><path d="M35 39 V35 A5 5 0 0 1 45 35 V39" stroke="#fff0b2" strokeWidth="3"/></g>
        : <g><circle cx="40" cy="43" r="12" fill="#093e36" stroke="#d9b15d" strokeWidth="1.5"/><path d="M40 36 V50 M33 43 H47" stroke="#fff2b5" strokeWidth="2.5" strokeLinecap="round"/></g>)}
    </svg>
  );
};
