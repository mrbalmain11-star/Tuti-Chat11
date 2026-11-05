import React, { useId } from 'react';

/** Pure SVG gift artwork; no changes to gift sending or purchase logic. */
export const RoyalGiftIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 64 64" className={className} role="img" aria-label="هدية">
    <defs>
      <linearGradient id={`box-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#9cefff"/><stop offset=".45" stopColor="#6d6cfa"/><stop offset="1" stopColor="#e477ff"/>
      </linearGradient>
      <linearGradient id={`ribbon-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#ffe6f9"/><stop offset=".45" stopColor="#ff75c4"/><stop offset="1" stopColor="#bd3ec6"/>
      </linearGradient>
    </defs>
    <ellipse cx="32" cy="56" rx="23" ry="5" fill="#a93bdb" opacity=".2"/>
    <path d="M10 27 H54 V48 Q54 53 49 53 H15 Q10 53 10 48 Z" fill={`url(#box-${id})`} stroke="#ffd5ff" strokeWidth="1.5"/>
    <path d="M7 22 Q7 19 11 19 H53 Q57 19 57 23 V30 H7 Z" fill={`url(#box-${id})`} stroke="#f8d9ff" strokeWidth="1.5"/>
    <path d="M28 20 H36 V53 H28 Z" fill={`url(#ribbon-${id})`}/>
    <path d="M7 24 H57 V29 H7 Z" fill={`url(#ribbon-${id})`} opacity=".85"/>
    <path d="M32 19 C18 19 14 15 17 10 C21 3 29 12 32 19 Z" fill={`url(#ribbon-${id})`} stroke="#ffebfa" strokeWidth="1.5"/>
    <path d="M32 19 C46 19 50 15 47 10 C43 3 35 12 32 19 Z" fill={`url(#ribbon-${id})`} stroke="#ffebfa" strokeWidth="1.5"/>
    <circle cx="32" cy="20" r="5" fill="#ffd0ee" stroke="#fff" strokeWidth="1.5"/>
    <path d="M14 36 L19 33 M44 42 L49 38 M18 46 L21 44" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".8"/>
    <path d="M49 7 L51 11 L55 13 L51 15 L49 19 L47 15 L43 13 L47 11 Z" fill="#fff8bf"/>
  </svg>;
};
