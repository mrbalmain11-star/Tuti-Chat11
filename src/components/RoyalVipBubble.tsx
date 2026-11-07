import React, { useId } from 'react';

/** Visual VIP chat bubble for tiers 1–8. Never grants VIP or changes message delivery. */
const VIP_BUBBLE_PALETTES = [
  { base: '#083d31', edge: '#68d6a6', jewel: '#e8c36a' },
  { base: '#104c62', edge: '#72d9f2', jewel: '#f4d88a' },
  { base: '#253e52', edge: '#b5d6de', jewel: '#57dcae' },
  { base: '#214333', edge: '#f5d68b', jewel: '#d56c58' },
  { base: '#572d26', edge: '#f1b764', jewel: '#f0d5a1' },
  { base: '#0d5846', edge: '#d7b26b', jewel: '#b7ffe1' },
  { base: '#173a69', edge: '#b5d9ff', jewel: '#f3dca0' },
  { base: '#493a1e', edge: '#ffe6a0', jewel: '#f3bdcb' },
] as const;

export const RoyalVipBubble: React.FC<{
  level: number;
  children: React.ReactNode;
  className?: string;
}> = ({ level, children, className = '' }) => {
  if (!Number.isInteger(level) || level < 1 || level > 8) {
    return <div className={className}>{children}</div>;
  }
  return <VipBubbleArtwork level={level as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} className={className}>{children}</VipBubbleArtwork>;
};

const VipBubbleArtwork: React.FC<{
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  children: React.ReactNode;
  className: string;
}> = ({ level, children, className }) => {
  const id = useId().replace(/:/g, '');
  const colors = VIP_BUBBLE_PALETTES[level - 1];
  const gradient = `vip-bubble-${id}`;
  return (
    <div className={`relative isolate min-w-0 rounded-2xl px-3 py-2 text-white shadow-lg ${className}`}
      style={{ backgroundColor: colors.base, border: `1px solid ${colors.edge}`, boxShadow: `0 4px 16px ${colors.base}77` }}
      data-vip-bubble-level={level}>
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-2xl" viewBox="0 0 240 80" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={colors.edge} stopOpacity=".32"/>
            <stop offset=".52" stopColor={colors.base} stopOpacity=".04"/>
            <stop offset="1" stopColor={colors.jewel} stopOpacity=".25"/>
          </linearGradient>
        </defs>
        <rect width="240" height="80" rx="16" fill={`url(#${gradient})`}/>
        <path d="M8 25 V16 Q8 8 16 8 H52 M232 55 V64 Q232 72 224 72 H188" fill="none" stroke={colors.jewel} strokeWidth="1.8" opacity=".9"/>
        <path d="M24 8 L29 12 L24 16 L19 12 Z M216 64 L221 68 L216 72 L211 68 Z" fill={colors.jewel}/>
        <path d="M70 5 H170 M70 75 H170" stroke={colors.edge} strokeOpacity=".4"/>
      </svg>
      <span className="absolute -top-2.5 start-3 rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide"
        style={{ backgroundColor: colors.edge, color: colors.base, border: `1px solid ${colors.jewel}` }}>
        VIP {level}
      </span>
      <div className="relative z-10 min-w-0 break-words pt-1">{children}</div>
    </div>
  );
};
