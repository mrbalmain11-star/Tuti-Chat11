import React, { useId } from 'react';

/** Pure SVG gift artwork; no changes to gift sending or purchase logic. */
export const RoyalGiftIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 64 64" className={className} role="img" aria-label="هدية" focusable="false">
    <defs>
      <linearGradient id={`box-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#b7ffe1"/><stop offset=".45" stopColor="#079a76"/><stop offset="1" stopColor="#064b3c"/>
      </linearGradient>
      <linearGradient id={`ribbon-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff4bd"/><stop offset=".45" stopColor="#e5b448"/><stop offset="1" stopColor="#8c551b"/>
      </linearGradient>
    </defs>
    <path d="M12 25 L31 29 L31 51 L12 47 Z" fill="#043d30" opacity=".25"/>
    <path d="M33 29 L52 25 L52 47 L33 51 Z" fill="#efffda" opacity=".12"/>
    <ellipse cx="32" cy="56" rx="23" ry="5" fill="#0d7659" opacity=".2"/>
    <path d="M10 27 H54 V48 Q54 53 49 53 H15 Q10 53 10 48 Z" fill={`url(#box-${id})`} stroke="#ffe6a3" strokeWidth="1.5"/>
    <path d="M7 22 Q7 19 11 19 H53 Q57 19 57 23 V30 H7 Z" fill={`url(#box-${id})`} stroke="#fff0c2" strokeWidth="1.5"/>
    <path d="M28 20 H36 V53 H28 Z" fill={`url(#ribbon-${id})`}/>
    <path d="M7 24 H57 V29 H7 Z" fill={`url(#ribbon-${id})`} opacity=".85"/>
    <path d="M32 19 C18 19 14 15 17 10 C21 3 29 12 32 19 Z" fill={`url(#ribbon-${id})`} stroke="#fff7d7" strokeWidth="1.5"/>
    <path d="M32 19 C46 19 50 15 47 10 C43 3 35 12 32 19 Z" fill={`url(#ribbon-${id})`} stroke="#fff7d7" strokeWidth="1.5"/>
    <circle cx="32" cy="20" r="5" fill="#ffe39a" stroke="#fff" strokeWidth="1.5"/>
    <path d="M14 33 H25 M39 33 H49" stroke="#fff9e5" strokeWidth="1" opacity=".5"/>
    <path d="M14 47 L24 50 M40 50 L50 47" stroke="#fff4db" strokeWidth="1" opacity=".45"/>
    <path d="M14 36 L19 33 M44 42 L49 38 M18 46 L21 44" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".8"/>
    <path d="M49 7 L51 11 L55 13 L51 15 L49 19 L47 15 L43 13 L47 11 Z" fill="#fff8bf"/>
    <circle cx="10" cy="12" r="1.4" fill="#e0ffe8"/><circle cx="56" cy="42" r="1.2" fill="#fff8c5"/>
    <path d="M18 7 V11 M16 9 H20" stroke="#f5df9b" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>;
};
