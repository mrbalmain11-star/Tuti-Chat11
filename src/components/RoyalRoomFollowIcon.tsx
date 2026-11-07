import React, { useId } from 'react';

/** Green vector room-follow status artwork; state is supplied by the caller. */
export const RoyalRoomFollowIcon: React.FC<{ followed: boolean; className?: string }> = ({ followed, className = 'w-6 h-6' }) => {
  const id = useId().replace(/:/g, '');
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`follow-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#b7ffe2"/><stop offset=".45" stopColor="#16d7a3"/><stop offset="1" stopColor="#047857"/>
      </linearGradient>
      <filter id={`glow-${id}`} x="-35%" y="-35%" width="170%" height="170%">
        <feGaussianBlur stdDeviation="1.2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <path d="M23 40 C19 36 6 27 6 17 C6 7 18 4 24 13 C30 4 42 7 42 17 C42 27 29 36 25 40 Z"
      fill={`url(#follow-${id})`} stroke="#d6fff0" strokeWidth="1.5" filter={`url(#glow-${id})`}/>
    <circle cx="34" cy="33" r="11" fill="#063f34" stroke="#a7ffe3" strokeWidth="1.5"/>
    {followed
      ? <path d="M28 33 L32 37 L40 29" stroke="#caffeb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      : <path d="M34 27 V39 M28 33 H40" stroke="#caffeb" strokeWidth="3" strokeLinecap="round"/>}
  </svg>;
};
