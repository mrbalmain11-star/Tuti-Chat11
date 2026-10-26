import React from 'react';

interface StorageItemVisualProps {
  iconType: string;
  colorScheme: 'gold' | 'ruby' | 'purple' | 'cyan' | 'emerald' | 'pink';
  className?: string;
}

export const StorageItemVisual: React.FC<StorageItemVisualProps> = ({
  iconType,
  colorScheme,
  className = 'w-16 h-16',
}) => {
  // Color presets for outer wreaths / crowns / rings
  const colorGradients = {
    gold: {
      from: '#F59E0B',
      via: '#FDE047',
      to: '#B45309',
      glow: 'rgba(245, 158, 11, 0.4)',
    },
    ruby: {
      from: '#E11D48',
      via: '#FDA4AF',
      to: '#9F1239',
      glow: 'rgba(225, 29, 72, 0.4)',
    },
    purple: {
      from: '#8B5CF6',
      via: '#DDD6FE',
      to: '#581C87',
      glow: 'rgba(139, 92, 246, 0.4)',
    },
    cyan: {
      from: '#06B6D4',
      via: '#CFFAFE',
      to: '#0E7490',
      glow: 'rgba(6, 182, 212, 0.4)',
    },
    emerald: {
      from: '#10B981',
      via: '#A7F3D0',
      to: '#047857',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
    pink: {
      from: '#EC4899',
      via: '#FCE7F3',
      to: '#BE185D',
      glow: 'rgba(236, 72, 153, 0.4)',
    },
  }[colorScheme];

  if (iconType === 'iraq-pegasus') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src="/iraq-pegasus-frame.png"
          alt="إطار دولة العراق الملكي"
          className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
        />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer Halo Glow */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-60 pointer-events-none"
        style={{ backgroundColor: colorGradients.glow }}
      />

      {/* Frame Ring / SVG Art */}
      <svg viewBox="0 0 80 80" className="w-full h-full relative z-0" fill="none">
        <defs>
          <linearGradient id={`grad-${iconType}-${colorScheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorGradients.from} />
            <stop offset="50%" stopColor={colorGradients.via} />
            <stop offset="100%" stopColor={colorGradients.to} />
          </linearGradient>

          <filter id={`glow-${iconType}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Aura */}
        <circle
          cx="40"
          cy="40"
          r="34"
          stroke={`url(#grad-${iconType}-${colorScheme})`}
          strokeWidth="2.5"
          strokeDasharray="4 2"
          opacity="0.8"
        />

        {/* Specialized SVG details per item type */}
        {iconType === 'crescent-ruby' && (
          <g>
            {/* Red Crescent Moon */}
            <path
              d="M58 24 C50 16, 32 18, 24 30 C16 42, 20 60, 36 66 C26 62, 20 50, 24 38 C28 26, 42 22, 58 24 Z"
              fill="url(#grad-crescent-ruby-ruby)"
              filter="url(#glow-crescent-ruby)"
            />
            {/* Roses and petals */}
            <circle cx="28" cy="62" r="6" fill="#BE123C" stroke="#FDE047" strokeWidth="1" />
            <circle cx="20" cy="54" r="4.5" fill="#E11D48" />
            <circle cx="38" cy="67" r="5" fill="#9F1239" />
            <circle cx="56" cy="22" r="3" fill="#FDE047" />
          </g>
        )}

        {iconType === 'dual-swords' && (
          <g>
            {/* Dual crossed crystal blades */}
            <path d="M22 62 L58 18 M20 60 L24 64 M54 18 L58 22" stroke="url(#grad-dual-swords-purple)" strokeWidth="3" strokeLinecap="round" />
            <path d="M58 62 L22 18 M56 60 L60 64 M22 18 L26 22" stroke="url(#grad-dual-swords-purple)" strokeWidth="3" strokeLinecap="round" />
            {/* Crown Gem in center top */}
            <polygon points="40,12 45,20 35,20" fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="1" />
          </g>
        )}

        {iconType === 'feather-wings' && (
          <g>
            {/* Left and right angelic feathers */}
            <path d="M22 46 C12 36, 14 22, 24 16 C22 26, 26 34, 30 38" fill="none" stroke="url(#grad-feather-wings-cyan)" strokeWidth="3" strokeLinecap="round" />
            <path d="M58 46 C68 36, 66 22, 56 16 C58 26, 54 34, 50 38" fill="none" stroke="url(#grad-feather-wings-cyan)" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 18 L40 12 L50 18" stroke="#FDE047" strokeWidth="2" fill="none" />
            <circle cx="40" cy="14" r="2.5" fill="#FDE047" />
          </g>
        )}

        {iconType === 'gold-wreath' && (
          <g>
            {/* Imperial laurel wreath leaves */}
            <path d="M20 50 C14 38, 18 24, 30 18" stroke="url(#grad-gold-wreath-gold)" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M60 50 C66 38, 62 24, 50 18" stroke="url(#grad-gold-wreath-gold)" strokeWidth="3.5" strokeLinecap="round" />
            {/* Diamonds */}
            <polygon points="40,10 44,15 40,20 36,15" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
            <polygon points="18,34 22,37 18,40 14,37" fill="#FEF08A" />
            <polygon points="62,34 66,37 62,40 58,37" fill="#FEF08A" />
          </g>
        )}

        {iconType === 'ruler-crown' && (
          <g>
            {/* Crown with cyan jewels */}
            <path d="M26 26 L30 14 L40 22 L50 14 L54 26 Z" fill="url(#grad-ruler-crown-cyan)" stroke="#FDE047" strokeWidth="1.5" />
            <circle cx="40" cy="22" r="2.5" fill="#06B6D4" />
            <circle cx="30" cy="14" r="2" fill="#FDE047" />
            <circle cx="50" cy="14" r="2" fill="#FDE047" />
          </g>
        )}

        {iconType === 'birthday-cake' && (
          <g>
            {/* Birthday Cake and candles */}
            <rect x="28" y="56" width="24" height="14" rx="3" fill="#BE123C" stroke="#FDE047" strokeWidth="1.5" />
            <path d="M28 56 Q34 60 40 56 Q46 60 52 56" stroke="#FEF08A" strokeWidth="2" fill="none" />
            <line x1="40" y1="56" x2="40" y2="48" stroke="#FDE047" strokeWidth="2" />
            <circle cx="40" cy="46" r="2" fill="#F59E0B" />
            {/* Festive Balloons */}
            <circle cx="20" cy="30" r="7" fill="#EF4444" opacity="0.8" />
            <circle cx="60" cy="30" r="7" fill="#F59E0B" opacity="0.8" />
          </g>
        )}

        {iconType === 'lion-crest' && (
          <g>
            {/* Royal Lion face silhouette */}
            <circle cx="40" cy="22" r="10" fill="#CA8A04" stroke="#FEF08A" strokeWidth="1.5" />
            <polygon points="34,16 30,10 38,13" fill="#EAB308" />
            <polygon points="46,16 50,10 42,13" fill="#EAB308" />
            <circle cx="37" cy="20" r="1.5" fill="#451A03" />
            <circle cx="43" cy="20" r="1.5" fill="#451A03" />
          </g>
        )}

        {iconType === 'pink-bunny' && (
          <g>
            {/* Cute bunny ears */}
            <ellipse cx="32" cy="18" rx="4" ry="10" transform="rotate(-15 32 18)" fill="#FCE7F3" stroke="#F472B6" strokeWidth="1.5" />
            <ellipse cx="48" cy="18" rx="4" ry="10" transform="rotate(15 48 18)" fill="#FCE7F3" stroke="#F472B6" strokeWidth="1.5" />
            <circle cx="40" cy="62" r="6" fill="#F472B6" />
            <circle cx="30" cy="64" r="4" fill="#FDA4AF" />
            <circle cx="50" cy="64" r="4" fill="#FDA4AF" />
          </g>
        )}

        {/* Fallback Ornaments for all other items */}
        {!['crescent-ruby', 'dual-swords', 'feather-wings', 'gold-wreath', 'ruler-crown', 'birthday-cake', 'lion-crest', 'pink-bunny'].includes(iconType) && (
          <g>
            <polygon
              points="40,8 46,18 40,24 34,18"
              fill={`url(#grad-${iconType}-${colorScheme})`}
              stroke="#FFF"
              strokeWidth="1"
            />
            <circle cx="20" cy="58" r="4" fill={`url(#grad-${iconType}-${colorScheme})`} />
            <circle cx="60" cy="58" r="4" fill={`url(#grad-${iconType}-${colorScheme})`} />
          </g>
        )}

        {/* Inner Profile Placeholder Circle */}
        <circle cx="40" cy="40" r="23" fill="#0A1E14" stroke="#163826" strokeWidth="1.5" />
      </svg>

      {/* Center Play Button Overlay (Matching Screenshot ▶) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white/90 translate-x-[1px]" fill="currentColor">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </div>
      </div>
    </div>
  );
};
