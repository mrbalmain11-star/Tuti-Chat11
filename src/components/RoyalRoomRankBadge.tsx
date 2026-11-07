import React, { useId } from 'react';
import { royalRankColors, type RoyalRank } from './royalRankColors';

/** Decorative TOP badge only. Rank remains sourced from the room model. */
export const RoyalRoomRankBadge: React.FC<{ rank: RoyalRank }> = ({ rank }) => {
  const uid = useId().replace(/:/g, '');
  const metalId = `room-badge-metal-${uid}`;
  const gemId = `room-badge-gem-${uid}`;
  const palette = royalRankColors[rank];
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={metalId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor={palette.light}/><stop offset="50%" stopColor={palette.mid}/><stop offset="100%" stopColor={palette.dark}/>
        </linearGradient>
        <linearGradient id={gemId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor={palette.light}/><stop offset="45%" stopColor={palette.stone}/><stop offset="100%" stopColor={palette.dark}/>
        </linearGradient>
      </defs>
      <path d="M20 4 L24 9 L30 6 L28 14 L34 16 L29 22 L31 29 L23 27 L20 33 L17 27 L9 29 L11 22 L6 16 L12 14 L10 6 L16 9 Z"
        fill={`url(#${metalId})`} stroke={palette.light} strokeWidth=".75"/>
      <polygon points="20,10 27,20 20,30 13,20" fill={`url(#${gemId})`} stroke={palette.light} strokeWidth="1"/>
      <text x="20" y="24" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="900" fontFamily="sans-serif">{rank}</text>
    </svg>
  );
};
