import React, { useId } from 'react';

/** Royal emerald and gold gamepad; decorative only, no game state. */
export const RoyalGamepadIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => {
  const uid = useId().replace(/:/g, '');
  return <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#b9ffe5"/><stop offset=".34" stopColor="#20c997"/><stop offset="1" stopColor="#07503e"/>
      </linearGradient>
      <linearGradient id={`rim-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff6b6"/><stop offset=".55" stopColor="#e0b24d"/><stop offset="1" stopColor="#875218"/>
      </linearGradient>
    </defs>
    <path d="M17 18 Q10 18 7 28 L4 44 Q3 54 12 54 Q16 54 23 47 L41 47 Q48 54 52 54 Q61 54 60 44 L57 28 Q54 18 47 18 Z"
      fill={`url(#body-${uid})`} stroke={`url(#rim-${uid})`} strokeWidth="3"/>
    <path d="M18 22 H46" stroke="#e9fff4" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
    <path d="M17 28 V42 M10 35 H24" stroke="#fdf0aa" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="43" cy="30" r="4" fill="#ffeb8a" stroke="#a36b2a"/>
    <circle cx="51" cy="37" r="4" fill="#f8d4a3" stroke="#a36b2a"/>
    <circle cx="35" cy="37" r="3" fill="#c9ffec" stroke="#07664e"/>
    <path d="M28 23 L30 26 L34 26 L31 29 L32 33 L28 31 L24 33 L25 29 L22 26 L26 26 Z" fill="#fceaa4" opacity=".85"/>
    <path d="M9 44 Q13 49 17 45" stroke="#d8fff0" strokeWidth="2" strokeLinecap="round"/>
  </svg>;
};
