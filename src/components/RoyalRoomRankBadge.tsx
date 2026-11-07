import React, { useId } from 'react';

/** Decorative TOP badge only. Rank remains sourced from the room model. */
export const RoyalRoomRankBadge: React.FC<{ rank: 1 | 2 | 3 }> = ({ rank }) => {
  const uid = useId().replace(/:/g, '');
  const metalId = `room-badge-metal-${uid}`;
  const gemId = `room-badge-gem-${uid}`;
  const palette = {
    1: { light: '#fff3b1', mid: '#eab308', dark: '#9a5b12', gem: '#a61924' },
    2: { light: '#ffffff', mid: '#b9cbdc', dark: '#627a9d', gem: '#2457b4' },
    3: { light: '#ffe6b8', mid: '#c88a46', dark: '#74401e', gem: '#a46a2e' },
  }[rank];
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={metalId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor={palette.light}/><stop offset="50%" stopColor={palette.mid}/><stop offset="100%" stopColor={palette.dark}/>
        </linearGradient>
        <linearGradient id={gemId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor={palette.light}/><stop offset="45%" stopColor={palette.gem}/><stop offset="100%" stopColor={palette.dark}/>
        </linearGradient>
      </defs>
      <path d="M20 4 L24 9 L30 6 L28 14 L34 16 L29 22 L31 29 L23 27 L20 33 L17 27 L9 29 L11 22 L6 16 L12 14 L10 6 L16 9 Z"
        fill={`url(#${metalId})`} stroke={palette.light} strokeWidth=".75"/>
      <polygon points="20,10 27,20 20,30 13,20" fill={`url(#${gemId})`} stroke={palette.light} strokeWidth="1"/>
      <text x="20" y="24" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="900" fontFamily="sans-serif">{rank}</text>
    </svg>
  );
};
