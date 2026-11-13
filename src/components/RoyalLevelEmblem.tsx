import React from 'react';
import { Crown, Gem, Sparkles, Castle } from 'lucide-react';
import type { RoyalTrack } from '../utils/royalLevels';

type Props = { track: RoyalTrack; level: number; kind: 'badge' | 'frame'; size?: number; animated?: boolean };
const palettes: Record<RoyalTrack, { primary: string; secondary: string; glow: string }> = {
  wealth: { primary: '#facc15', secondary: '#b45309', glow: '#fef08a' },
  charm: { primary: '#f9a8d4', secondary: '#9333ea', glow: '#f5d0fe' },
  room: { primary: '#34d399', secondary: '#0f766e', glow: '#a7f3d0' },
};
/** Original procedural vector artwork. Level and track affect the ornaments,
 * never the entitlement source. No external art licenses or raster images.
 */
export const RoyalLevelEmblem: React.FC<Props> = ({ track, level, kind, size = 88, animated = true }) => {
  const palette = palettes[track];
  const id = `royal-${track}-${kind}-${level}`;
  const ornaments = Math.min(12, 3 + Math.floor(level / 20));
  const Icon = track === 'wealth' ? Crown : track === 'charm' ? Gem : Castle;
  return <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} aria-label={`${kind === 'badge' ? 'شارة' : 'إطار'} ${track} مستوى ${level}`}>
    {animated && <span aria-hidden="true" className="absolute inset-1 rounded-full opacity-30 motion-safe:animate-pulse" style={{ boxShadow: `0 0 18px 3px ${palette.glow}` }} />}
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Royal ${track} level ${level}`}>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.glow} />
          <stop offset="48%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill={kind === 'badge' ? '#10241d' : 'transparent'} stroke={`url(#${id}-metal)`} strokeWidth={kind === 'badge' ? 6 : 8} />
      <circle cx="50" cy="50" r="36" fill="none" stroke={palette.glow} strokeWidth="1.4" strokeDasharray={level >= 100 ? '2 3' : '6 5'} />
      {Array.from({ length: ornaments }, (_, i) => {
        const angle = (i * 2 * Math.PI) / ornaments - Math.PI / 2;
        const x = 50 + 43 * Math.cos(angle);
        const y = 50 + 43 * Math.sin(angle);
        return <path key={i} d={`M ${x} ${y - 4} l 3 4 -3 4 -3 -4 Z`} fill={palette.glow} />;
      })}
      {kind === 'badge' && <text x="50" y="66" fontSize={level >= 100 ? 26 : 32} fontWeight="900" textAnchor="middle" fill={palette.primary}>{level}</text>}
      {kind === 'frame' && <>
        <path d="M37 12 L42 6 L50 12 L58 6 L63 12 L61 20 L39 20 Z" fill={palette.primary} stroke={palette.glow} strokeWidth="1" />
        <rect x="36" y="83" width="28" height="13" rx="5" fill={palette.secondary} stroke={palette.glow} strokeWidth="1.5" />
        <text x="50" y="92.5" fontSize="9" fontWeight="900" textAnchor="middle" fill={palette.glow}>{level}</text>
      </>}

    </svg>
    {kind === 'badge' && <Icon className="absolute top-0 h-4 w-4" color={palette.glow} aria-hidden="true" />}
    {level >= 150 && <Sparkles className="absolute -right-1 top-1 h-4 w-4 motion-safe:animate-pulse" color={palette.glow} aria-hidden="true" />}
  </div>;
};
