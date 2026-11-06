import React, { useId } from 'react';

const themes = [
  null,
  { base: '#5d1324', edge: '#f87171', gem: '#ff667e' },
  { base: '#123969', edge: '#74c4ff', gem: '#66b7ff' },
  { base: '#6a3812', edge: '#ffd274', gem: '#ffb72e' },
  { base: '#064d3d', edge: '#75edc1', gem: '#24d6a0' },
  { base: '#6a234e', edge: '#ff9bce', gem: '#ff75b5' },
  { base: '#063d69', edge: '#9ae7ff', gem: '#30c7ff' },
  { base: '#442064', edge: '#cfa6ff', gem: '#b37aff' },
  { base: '#15151c', edge: '#f4d77e', gem: '#dcae39' },
] as const;

/** Vector-only VIP frame. Decorative SVG cannot block message selection or touch events. */
export const VipMessageFrame: React.FC<{ level: number; children: React.ReactNode }> = ({ level, children }) => {
  const id = useId().replace(/:/g, '');
  // Do not display a misleading VIP8 badge for invalid or unsupported levels.
  const tier = Number.isInteger(level) && level >= 1 && level <= 8 ? level : 0;
  const theme = themes[tier];
  if (!theme) return <div className="toti-chat-bubble max-w-[85%] min-w-0 rounded-2xl rounded-tr-sm border border-amber-300/25 bg-[#1c123d]/88 px-2.5 py-1.5 text-[11px] text-white shadow-sm break-words">{children}</div>;
  return <div className="toti-chat-bubble relative isolate max-w-[85%] min-w-0 rounded-2xl rounded-tr-sm border px-3 py-2 text-[11px] text-white shadow-lg break-words" style={{ background: `linear-gradient(130deg, ${theme.base}, #0b1020 90%)`, borderColor: theme.edge, boxShadow: `0 3px 14px ${theme.base}99` }}>
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full overflow-visible" viewBox="0 0 240 32" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      <defs>
        <linearGradient id={`vip-metal-${id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff6bd"/><stop offset=".45" stopColor="#d8a943"/><stop offset="1" stopColor="#8e5b20"/></linearGradient>
      </defs>
      <path d="M2 27 Q14 5 38 11 Q22 15 12 31 Q30 22 43 26 M238 27 Q226 5 202 11 Q218 15 228 31 Q210 22 197 26" fill="none" stroke={`url(#vip-metal-${id})`} strokeWidth="1.8" opacity=".85"/>
      <path d="M104 4 L110 9 L120 1 L130 9 L136 4 L132 16 L108 16 Z" fill={`url(#vip-metal-${id})`} stroke="#fff4c1" strokeWidth=".7"/>
      <path d="M120 4 L125 10 L120 15 L115 10 Z" fill={theme.gem} stroke="#fff3c7" strokeWidth=".8"/>
    </svg>
    <div className="relative z-10 min-w-0 pt-3 leading-relaxed [overflow-wrap:anywhere]">{children}</div>
  </div>;
};
