import React, { useId } from 'react';

/** Decorative vector frame only. Rank eligibility must be verified by the server. */
export const RoyalRoomRankFrame: React.FC<{ rank: 1 | 2 | 3 }> = ({ rank }) => {
  const uid = useId().replace(/:/g, '');
  const metal = `rank-metal-${uid}`;
  const gem = `rank-gem-${uid}`;
  const colors = {
    1: { light: '#fff4ae', mid: '#e5ad31', dark: '#8a4c0c', stone: '#e8a51c' },
    2: { light: '#effaff', mid: '#91b7dc', dark: '#405b85', stone: '#5cb6ff' },
    3: { light: '#ffe2d5', mid: '#d9919d', dark: '#84465d', stone: '#ff81a7' },
  }[rank];
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="none" className="absolute inset-0 z-10 w-full h-full pointer-events-none" aria-hidden="true">
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={colors.light}/><stop offset=".38" stopColor={colors.mid}/>
          <stop offset=".65" stopColor={colors.dark}/><stop offset="1" stopColor={colors.light}/>
        </linearGradient>
        <radialGradient id={gem}><stop stopColor="#fff"/><stop offset=".3" stopColor={colors.stone}/><stop offset="1" stopColor={colors.dark}/></radialGradient>
      </defs>
      <rect x="2" y="2" width="196" height="196" rx="17" fill="none" stroke={`url(#${metal})`} strokeWidth="4"/>
      <rect x="7" y="7" width="186" height="186" rx="13" fill="none" stroke={colors.light} strokeOpacity=".75" strokeWidth=".8"/>
      {[0, 1, 2, 3].map((n) => (
        <g key={n} transform={`translate(${n === 1 || n === 2 ? 200 : 0} ${n >= 2 ? 200 : 0}) rotate(${n === 1 ? 90 : n === 2 ? 180 : n === 3 ? 270 : 0})`}>
          <path d="M1 40 Q5 17 18 13 Q11 26 31 27 Q16 30 11 48" fill={`url(#${metal})`} stroke={colors.dark} strokeWidth=".7"/>
          <path d="M3 25 L8 7 L14 13 L20 3 L27 15 L35 9 L37 27 Z" fill={`url(#${metal})`} stroke={colors.light} strokeWidth=".9"/>
          <path d="M20 11 L27 19 L20 27 L13 19 Z" fill={`url(#${gem})`} stroke={colors.light} strokeWidth=".7"/>
          <path d="M43 4 Q60 10 76 4" fill="none" stroke={colors.mid} strokeWidth="1.7"/>
          <circle cx="48" cy="5" r="2" fill={colors.light}/>
        </g>
      ))}
      <path d="M83 3 L92 6 L100 1 L108 6 L117 3 L112 12 L88 12 Z" fill={`url(#${metal})`} stroke={colors.light} strokeWidth=".7"/>
      <path d="M100 4 L105 9 L100 14 L95 9 Z" fill={`url(#${gem})`}/>
    </svg>
  );
};
