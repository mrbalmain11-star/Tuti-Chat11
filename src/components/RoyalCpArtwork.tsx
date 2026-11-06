import React, { useId } from 'react';

/** Pure SVG CP decorations: no bitmap overlays, no impact on relationship state. */
export const RoyalCpOrnament: React.FC = () => {
  const id = useId().replace(/:/g, '');
  return <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 360 210" preserveAspectRatio="none">
    <defs><linearGradient id={`cp-gold-${id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff4c0"/><stop offset=".48" stopColor="#d5a344"/><stop offset="1" stopColor="#84511e"/></linearGradient></defs>
    <rect x="3" y="3" width="354" height="204" rx="25" fill="none" stroke={`url(#cp-gold-${id})`} strokeWidth="3"/>
    <path d="M13 56 Q25 18 73 16 Q50 28 38 55 Q63 40 91 43 M347 56 Q335 18 287 16 Q310 28 322 55 Q297 40 269 43" fill="none" stroke={`url(#cp-gold-${id})`} strokeWidth="2.3" opacity=".85"/>
    <path d="M151 9 L163 17 L180 5 L197 17 L209 9 L204 30 L156 30 Z" fill={`url(#cp-gold-${id})`} stroke="#fff0ae" strokeWidth="1.5"/>
    <path d="M180 12 L189 20 L180 29 L171 20 Z" fill="#ff8ab8" stroke="#fff3c8" strokeWidth="1.5"/>
    <path d="M15 185 Q55 198 93 190 M345 185 Q305 198 267 190" fill="none" stroke={`url(#cp-gold-${id})`} strokeWidth="2"/>
  </svg>; };
};

export const RoyalCpAvatarFrame: React.FC = () => {
  const id = useId().replace(/:/g, '');
  return <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 80 80">
    <defs><linearGradient id={`cp-ring-${id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff3bb"/><stop offset=".5" stopColor="#e1a64c"/><stop offset="1" stopColor="#9b5526"/></linearGradient></defs>
    <circle cx="40" cy="42" r="28" fill="none" stroke={`url(#cp-ring-${id})`} strokeWidth="4"/>
    <path d="M10 37 Q3 20 2 15 Q16 17 24 29 M70 37 Q77 20 78 15 Q64 17 56 29" fill="none" stroke={`url(#cp-ring-${id})`} strokeWidth="3"/>
    <path d="M28 12 L33 17 L40 8 L47 17 L52 12 L50 23 L30 23 Z" fill={`url(#cp-ring-${id})`}/>
    <path d="M40 12 L44 17 L40 21 L36 17 Z" fill="#ff83b7"/>
    <circle cx="40" cy="42" r="31" fill="none" stroke="#fff1c5" strokeWidth=".7" strokeDasharray="3 5"/>
  </svg>;
};

export const RoyalCpHeart: React.FC = () => { const id = useId().replace(/:/g, ''); return <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 80 80">
  <defs><linearGradient id={`cp-heart-pink-${id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd1e7"/><stop offset=".5" stopColor="#f35c9d"/><stop offset="1" stopColor="#8c1f60"/></linearGradient></defs>
  <path d="M40 68 C29 59 7 43 7 26 C7 10 29 6 40 22 C51 6 73 10 73 26 C73 43 51 59 40 68 Z" fill={`url(#cp-heart-pink-${id})`} stroke="#ffe5aa" strokeWidth="2.5"/>
  <path d="M12 42 L25 42 L31 31 L38 52 L46 37 L52 42 L68 42" fill="none" stroke="#fff4d7" strokeWidth="2" strokeLinejoin="round"/>
</svg>;
