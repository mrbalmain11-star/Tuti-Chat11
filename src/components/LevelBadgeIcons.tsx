import React from 'react';

export interface BadgeProps {
  level: number;
  variant?: 'wealth' | 'charm' | 'games';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'compact';
  className?: string;
  onClick?: () => void;
  overrideDisplayNumber?: number | string;
}

export type TierLevel =
  | 1
  | 10
  | 20
  | 30
  | 40
  | 50
  | 60
  | 70
  | 80
  | 90
  | 100
  | 120
  | 140
  | 150
  | 160
  | 165
  | 180
  | 200
  | 210
  | 220
  | 240
  | 260;

export const getTierIndex = (level: number): TierLevel => {
  const lvl = Math.max(1, Math.floor(level || 1));
  if (lvl >= 260) return 260;
  if (lvl >= 240) return 240;
  if (lvl >= 220) return 220;
  if (lvl >= 210) return 210;
  if (lvl >= 200) return 200;
  if (lvl >= 180) return 180;
  if (lvl >= 165) return 165;
  if (lvl >= 160) return 160;
  if (lvl >= 150) return 150;
  if (lvl >= 140) return 140;
  if (lvl >= 120) return 120;
  if (lvl >= 100) return 100;
  if (lvl >= 90) return 90;
  if (lvl >= 80) return 80;
  if (lvl >= 70) return 70;
  if (lvl >= 60) return 60;
  if (lvl >= 50) return 50;
  if (lvl >= 40) return 40;
  if (lvl >= 30) return 30;
  if (lvl >= 20) return 20;
  if (lvl >= 10) return 10;
  return 1;
};

/* =========================================================================
   Distinct Color & Shape Architecture for Wealth vs Magic/Charm vs Games
   
   1. Wealth Level (مستوى الثروة): up to 240 (الذروة الإمبراطورية الفاخرة)
   2. Magic Level (مستوى السحر): up to 260 (ذروة السحر الأعظم)
   3. Games Level (مستوى الألعاب): Cyber Game Controller Badges
   ========================================================================= */

export const OfficialScreenshotBadge: React.FC<BadgeProps> = ({
  level,
  variant = 'wealth',
  size = 'md',
  className = '',
  onClick,
  overrideDisplayNumber,
}) => {
  const tier = getTierIndex(level);
  const displayNum = overrideDisplayNumber ?? Math.max(1, Math.floor(level || 1));
  const isWealth = variant === 'wealth';

  // Size variations
  const isCompact = size === 'compact' || size === 'sm';
  const isXs = size === 'xs';
  const isLg = size === 'lg';

  // Sizing definitions: neat, compact, and perfectly proportioned with 3D presence
  const hClass = isXs
    ? 'h-4 px-1.5'
    : isCompact
    ? 'h-5 px-2'
    : isLg
    ? 'h-7 px-3'
    : 'h-5.5 px-2.5';

  const textClass = isXs
    ? 'text-[9px] font-black font-sans leading-none'
    : isCompact
    ? 'text-[10px] font-black font-sans leading-none'
    : isLg
    ? 'text-[13px] font-black font-sans leading-none'
    : 'text-[11px] font-black font-sans leading-none';

  const emblemSize = isXs
    ? 'w-3 h-3'
    : isCompact
    ? 'w-3.5 h-3.5'
    : isLg
    ? 'w-5 h-5'
    : 'w-4 h-4';

  // =========================================================================
  // 1. WEALTH LEVEL (مستوى الثروة) - Distinct Royal Golden Shield / Crest Shape
  // =========================================================================
  if (isWealth) {
    let wealthBg = 'bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309]';
    let wealthBorder = 'border-amber-300/90 ring-1 ring-amber-400/40';
    let wealthGlow = 'shadow-[0_2px_10px_rgba(245,158,11,0.5)]';
    let emblemBg = 'from-[#FEF08A] to-[#B45309]';
    let crownColor = '#FEF08A';
    let gemColor = '#F59E0B';

    if (tier === 1) {
      // 1-9: Ice Sky Blue
      wealthBg = 'bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8]';
      wealthBorder = 'border-sky-200/90 ring-1 ring-sky-300/40';
      wealthGlow = 'shadow-[0_2px_10px_rgba(56,189,248,0.5)]';
      emblemBg = 'from-[#E0F2FE] to-[#0369A1]';
      crownColor = '#F0F9FF';
      gemColor = '#0284C7';
    } else if (tier === 10) {
      // 10-19: Vivid Lime Green
      wealthBg = 'bg-gradient-to-r from-[#15803D] via-[#16A34A] to-[#22C55E]';
      wealthBorder = 'border-emerald-200/90 ring-1 ring-emerald-300/40';
      wealthGlow = 'shadow-[0_2px_10px_rgba(34,197,94,0.5)]';
      emblemBg = 'from-[#DCFCE7] to-[#14532D]';
      crownColor = '#DCFCE7';
      gemColor = '#16A34A';
    } else if (tier === 20) {
      // 20-29: Royal Cobalt Blue
      wealthBg = 'bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#3B82F6]';
      wealthBorder = 'border-blue-200/90 ring-1 ring-blue-300/40';
      wealthGlow = 'shadow-[0_2px_10px_rgba(59,130,246,0.5)]';
      emblemBg = 'from-[#DBEAFE] to-[#1E3A8A]';
      crownColor = '#EFF6FF';
      gemColor = '#2563EB';
    } else if (tier === 30) {
      // 30-39: Arcane Violet
      wealthBg = 'bg-gradient-to-r from-[#581C87] via-[#7C3AED] to-[#A855F7]';
      wealthBorder = 'border-purple-200/90 ring-1 ring-purple-300/40';
      wealthGlow = 'shadow-[0_2px_10px_rgba(168,85,247,0.5)]';
      emblemBg = 'from-[#F3E8FF] to-[#4C1D95]';
      crownColor = '#FAF5FF';
      gemColor = '#7C3AED';
    } else if (tier === 40) {
      // 40-49: Bright Fuchsia Magenta
      wealthBg = 'bg-gradient-to-r from-[#831843] via-[#BE185D] to-[#EC4899]';
      wealthBorder = 'border-pink-200/90 ring-1 ring-pink-300/40';
      wealthGlow = 'shadow-[0_2px_12px_rgba(236,72,153,0.55)]';
      emblemBg = 'from-[#FCE7F3] to-[#831843]';
      crownColor = '#FFF1F2';
      gemColor = '#BE185D';
    } else if (tier === 50) {
      // 50-59: Fiery Coral Orange
      wealthBg = 'bg-gradient-to-r from-[#9A3412] via-[#C2410C] to-[#EA580C]';
      wealthBorder = 'border-orange-200/90 ring-1 ring-orange-300/40';
      wealthGlow = 'shadow-[0_2px_12px_rgba(234,88,12,0.55)]';
      emblemBg = 'from-[#FFEDD5] to-[#7C2D12]';
      crownColor = '#FFF7ED';
      gemColor = '#EA580C';
    } else if (tier === 60) {
      // 60-69: Oceanic Teal
      wealthBg = 'bg-gradient-to-r from-[#115E59] via-[#0D9488] to-[#14B8A6]';
      wealthBorder = 'border-teal-200/90 ring-1 ring-teal-300/40';
      wealthGlow = 'shadow-[0_2px_12px_rgba(20,184,166,0.55)]';
      emblemBg = 'from-[#CCFBF1] to-[#134E4A]';
      crownColor = '#F0FDFA';
      gemColor = '#0D9488';
    } else if (tier === 70) {
      // 70-79: Radiant Amber Sun Gold
      wealthBg = 'bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#F59E0B]';
      wealthBorder = 'border-yellow-200/90 ring-1 ring-yellow-400/50';
      wealthGlow = 'shadow-[0_2px_12px_rgba(245,158,11,0.6)]';
      emblemBg = 'from-[#FEF08A] to-[#78350F]';
      crownColor = '#FEF08A';
      gemColor = '#D97706';
    } else if (tier === 80) {
      // 80-89: Deep Imperial Ruby Crimson
      wealthBg = 'bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#EF4444]';
      wealthBorder = 'border-red-200/90 ring-1 ring-red-300/50';
      wealthGlow = 'shadow-[0_2px_14px_rgba(239,68,68,0.65)]';
      emblemBg = 'from-[#FEE2E2] to-[#7F1D1D]';
      crownColor = '#FEF2F2';
      gemColor = '#B91C1C';
    } else if (tier === 90) {
      // 90-99: Pure 24K Mirror Gold
      wealthBg = 'bg-gradient-to-r from-[#A16207] via-[#EAB308] to-[#FDE047]';
      wealthBorder = 'border-amber-100 ring-1 ring-yellow-300';
      wealthGlow = 'shadow-[0_2px_14px_rgba(234,179,8,0.7)]';
      emblemBg = 'from-[#FFFFFF] to-[#713F12]';
      crownColor = '#FEF9C3';
      gemColor = '#CA8A04';
    } else if (tier === 100) {
      // 100-119: Crowned Royal Purple & Gold
      wealthBg = 'bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#EAB308]';
      wealthBorder = 'border-yellow-200 ring-1 ring-amber-400';
      wealthGlow = 'shadow-[0_2px_16px_rgba(124,58,237,0.75)]';
      emblemBg = 'from-[#FEF08A] to-[#3B0764]';
      crownColor = '#FEF08A';
      gemColor = '#7C3AED';
    } else if (tier === 120) {
      // 120-139: Blazing Dragon Flame
      wealthBg = 'bg-gradient-to-r from-[#7C2D12] via-[#DC2626] to-[#F59E0B]';
      wealthBorder = 'border-yellow-300 ring-1 ring-red-400';
      wealthGlow = 'shadow-[0_2px_16px_rgba(220,38,38,0.8)]';
      emblemBg = 'from-[#FEF08A] to-[#7F1D1D]';
      crownColor = '#FEF08A';
      gemColor = '#DC2626';
    } else if (tier === 140) {
      // 140-159: Cosmic Diamond Azure
      wealthBg = 'bg-gradient-to-r from-[#0F172A] via-[#1D4ED8] to-[#38BDF8]';
      wealthBorder = 'border-cyan-200 ring-1 ring-sky-400';
      wealthGlow = 'shadow-[0_2px_18px_rgba(56,189,248,0.8)]';
      emblemBg = 'from-[#E0F2FE] to-[#0F172A]';
      crownColor = '#E0F2FE';
      gemColor = '#38BDF8';
    } else if (tier === 160) {
      // 160-179: Prismatic Nebula
      wealthBg = 'bg-gradient-to-r from-[#581C87] via-[#C026D3] to-[#38BDF8]';
      wealthBorder = 'border-pink-200 ring-1 ring-purple-400';
      wealthGlow = 'shadow-[0_2px_18px_rgba(192,38,211,0.85)]';
      emblemBg = 'from-[#FFFFFF] to-[#3B0764]';
      crownColor = '#FFFFFF';
      gemColor = '#C026D3';
    } else if (tier === 180) {
      // 180-199: Imperial Blood Gold
      wealthBg = 'bg-gradient-to-r from-[#450A0A] via-[#991B1B] to-[#F59E0B]';
      wealthBorder = 'border-2 border-yellow-300 ring-1 ring-amber-400';
      wealthGlow = 'shadow-[0_2px_20px_rgba(220,38,38,0.9)]';
      emblemBg = 'from-[#FEF08A] to-[#450A0A]';
      crownColor = '#FEF08A';
      gemColor = '#B91C1C';
    } else if (tier === 200) {
      // 200-219: Emperor's Supreme Crown
      wealthBg = 'bg-gradient-to-r from-[#2E1065] via-[#6B21A8] to-[#EAB308]';
      wealthBorder = 'border-2 border-yellow-200 ring-1 ring-purple-400';
      wealthGlow = 'shadow-[0_0_22px_rgba(234,179,8,0.95)]';
      emblemBg = 'from-[#FEF08A] to-[#2E1065]';
      crownColor = '#FEF08A';
      gemColor = '#9333EA';
    } else if (tier === 220) {
      // 220-239: Celestial Sun Throne
      wealthBg = 'bg-gradient-to-r from-[#78350F] via-[#D97706] to-[#FEF08A]';
      wealthBorder = 'border-2 border-yellow-100 ring-2 ring-amber-400';
      wealthGlow = 'shadow-[0_0_22px_rgba(251,191,36,0.95)]';
      emblemBg = 'from-[#FFFFFF] to-[#78350F]';
      crownColor = '#FFFFFF';
      gemColor = '#F59E0B';
    } else if (tier >= 240) {
      // 240: Sovereign Supreme Wealth (الذروة الإمبراطورية 240)
      wealthBg = 'bg-gradient-to-r from-[#1C1917] via-[#451A03] to-[#F59E0B]';
      wealthBorder = 'border-2 border-yellow-200 ring-2 ring-yellow-400 animate-pulse';
      wealthGlow = 'shadow-[0_0_26px_rgba(255,215,0,1)]';
      emblemBg = 'from-[#FEF08A] to-[#1C1917]';
      crownColor = '#FEF08A';
      gemColor = '#F59E0B';
    }

    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-1 shrink-0 rounded-full ${wealthBg} border ${wealthBorder} ${wealthGlow} select-none cursor-pointer transition active:scale-95 ${hClass} ${className} relative overflow-hidden`}
        dir="ltr"
        title={`مستوى الثروة: Lv. ${displayNum}`}
      >
        {/* Subtle glass reflection highlight on upper half */}
        <div className="absolute inset-x-1 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />

        {/* 3D Shield Crest Emblem */}
        <div className={`relative flex items-center justify-center shrink-0 ${emblemSize}`}>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${emblemBg} p-[1px] shadow-xs`}>
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#2B1704] to-[#0A0501] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-[85%] h-[85%]" fill="none">
                <path
                  d="M12 2L15 6L20 7L16 11L17 17L12 14L7 17L8 11L4 7L9 6L12 2Z"
                  fill={crownColor}
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11" r="2.2" fill={gemColor} stroke="#FFF" strokeWidth="0.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Level Number in Crisp 24K Gold/White Text */}
        <span
          className={`text-white italic tracking-wide font-black drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] relative z-10 ${textClass}`}
        >
          {displayNum}
        </span>
      </div>
    );
  }

  // =========================================================================
  // 2. GAMES LEVEL (مستوى الألعاب) - Distinct Cyber Gamepad Capsule Shape
  // =========================================================================
  if (variant === 'games') {
    let gameBg = 'bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#0284C7]';
    let gameBorder = 'border-cyan-300/90 ring-1 ring-cyan-400/40';
    let gameGlow = 'shadow-[0_2px_10px_rgba(37,99,235,0.5)]';
    let gameEmblemBg = 'from-[#DBEAFE] to-[#1E40AF]';

    if (tier === 1) {
      gameBg = 'bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8]';
      gameBorder = 'border-sky-200/90 ring-1 ring-sky-300/40';
      gameGlow = 'shadow-[0_2px_10px_rgba(56,189,248,0.5)]';
      gameEmblemBg = 'from-[#E0F2FE] to-[#1E40AF]';
    } else if (tier === 10) {
      gameBg = 'bg-gradient-to-r from-[#059669] via-[#10B981] to-[#34D399]';
      gameBorder = 'border-emerald-200/90 ring-1 ring-emerald-300/40';
      gameGlow = 'shadow-[0_2px_10px_rgba(52,211,153,0.5)]';
      gameEmblemBg = 'from-[#D1FAE5] to-[#065F46]';
    } else if (tier === 20) {
      gameBg = 'bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C084FC]';
      gameBorder = 'border-purple-200/90 ring-1 ring-purple-300/40';
      gameGlow = 'shadow-[0_2px_10px_rgba(168,85,247,0.5)]';
      gameEmblemBg = 'from-[#F3E8FF] to-[#4C1D95]';
    } else if (tier === 30) {
      gameBg = 'bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FDE047]';
      gameBorder = 'border-amber-300 ring-1 ring-yellow-400/50';
      gameGlow = 'shadow-[0_2px_10px_rgba(217,119,6,0.5)]';
      gameEmblemBg = 'from-[#FEF08A] to-[#78350F]';
    } else if (tier === 40) {
      gameBg = 'bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FB923C]';
      gameBorder = 'border-orange-200 ring-1 ring-orange-400/50';
      gameGlow = 'shadow-[0_2px_12px_rgba(234,88,12,0.55)]';
      gameEmblemBg = 'from-[#FFEDD5] to-[#7C2D12]';
    } else if (tier === 50) {
      gameBg = 'bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981]';
      gameBorder = 'border-emerald-200 ring-1 ring-yellow-400';
      gameGlow = 'shadow-[0_2px_12px_rgba(16,185,129,0.6)]';
      gameEmblemBg = 'from-[#FEF08A] to-[#064E3B]';
    } else if (tier === 60) {
      gameBg = 'bg-gradient-to-r from-[#BE123C] via-[#E11D48] to-[#FB7185]';
      gameBorder = 'border-rose-200 ring-1 ring-yellow-400';
      gameGlow = 'shadow-[0_2px_12px_rgba(225,29,72,0.6)]';
      gameEmblemBg = 'from-[#FFE4E6] to-[#4C0519]';
    } else if (tier === 70) {
      gameBg = 'bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#F59E0B]';
      gameBorder = 'border-yellow-200 ring-1 ring-yellow-400';
      gameGlow = 'shadow-[0_2px_14px_rgba(245,158,11,0.65)]';
      gameEmblemBg = 'from-[#FEF08A] to-[#78350F]';
    } else if (tier === 80) {
      gameBg = 'bg-gradient-to-r from-[#EAB308] via-[#FDE047] to-[#FEF08A]';
      gameBorder = 'border-yellow-100 ring-1 ring-amber-300';
      gameGlow = 'shadow-[0_2px_14px_rgba(234,179,8,0.7)]';
      gameEmblemBg = 'from-[#FFFFFF] to-[#78350F]';
    } else if (tier === 90) {
      gameBg = 'bg-gradient-to-r from-[#B91C1C] via-[#DC2626] to-[#EF4444]';
      gameBorder = 'border-red-200 ring-1 ring-yellow-400';
      gameGlow = 'shadow-[0_2px_14px_rgba(220,38,38,0.7)]';
      gameEmblemBg = 'from-[#FEF08A] to-[#7F1D1D]';
    } else if (tier >= 100) {
      gameBg = 'bg-gradient-to-r from-[#1E1B4B] via-[#4C1D95] to-[#701A75]';
      gameBorder = 'border-2 border-yellow-300 ring-1 ring-amber-400';
      gameGlow = 'shadow-[0_2px_18px_rgba(234,179,8,0.85)]';
      gameEmblemBg = 'from-[#FEF08A] to-[#1E1B4B]';
    }

    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-1 shrink-0 rounded-full ${gameBg} border ${gameBorder} ${gameGlow} select-none cursor-pointer transition active:scale-95 ${hClass} ${className} relative overflow-hidden`}
        dir="ltr"
        title={`مستوى الألعاب: Lv. ${displayNum}`}
      >
        <div className="absolute inset-x-1 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />
        <div className={`relative flex items-center justify-center shrink-0 ${emblemSize}`}>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${gameEmblemBg} p-[1px] shadow-xs`}>
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#1E3A8A] to-[#0F172A] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-[80%] h-[80%]" fill="none" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="12" x2="10" y2="12"></line>
                <line x1="8" y1="10" x2="8" y2="14"></line>
                <line x1="15" y1="13" x2="15.01" y2="13"></line>
                <line x1="18" y1="11" x2="18.01" y2="11"></line>
                <rect x="2" y="6" width="20" height="12" rx="4"></rect>
              </svg>
            </div>
          </div>
        </div>
        <span className={`text-white italic tracking-wide font-black drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] relative z-10 ${textClass}`}>
          {displayNum}
        </span>
      </div>
    );
  }

  // =========================================================================
  // 3. MAGIC / CHARM LEVEL (مستوى السحر) - Distinct Mystical Crystal & Faceted 8-Point Star
  // Supports up to Level 260 with Distinct, Bold, Vivid Color Variations between tiers!
  // =========================================================================
  let charmBg = 'bg-gradient-to-r from-[#A855F7] via-[#9333EA] to-[#6B21A8]';
  let charmBorder = 'border-purple-300/90 ring-1 ring-purple-400/40';
  let charmGlow = 'shadow-[0_2px_10px_rgba(168,85,247,0.5)]';
  let charmEmblemBg = 'from-[#F3E8FF] to-[#6B21A8]';
  let starColor = '#FAF5FF';
  let crystalCenter = '#C084FC';

  if (tier === 1) {
    // 1-9: Ice Crystal Azure (أزرق جليدي متلألئ)
    charmBg = 'bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8]';
    charmBorder = 'border-sky-200/90 ring-1 ring-sky-300/40';
    charmGlow = 'shadow-[0_2px_10px_rgba(56,189,248,0.5)]';
    charmEmblemBg = 'from-[#E0F2FE] to-[#0369A1]';
    starColor = '#FFFFFF';
    crystalCenter = '#38BDF8';
  } else if (tier === 10) {
    // 10-19: Vivid Lime Mint (أخضر ليموني زمردي مشرق)
    charmBg = 'bg-gradient-to-r from-[#16A34A] via-[#22C55E] to-[#4ADE80]';
    charmBorder = 'border-emerald-200/90 ring-1 ring-emerald-300/40';
    charmGlow = 'shadow-[0_2px_10px_rgba(34,197,94,0.5)]';
    charmEmblemBg = 'from-[#DCFCE7] to-[#14532D]';
    starColor = '#FFFFFF';
    crystalCenter = '#22C55E';
  } else if (tier === 20) {
    // 20-29: Deep Royal Cobalt Blue (أزرق كوبالت ملكي)
    charmBg = 'bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#60A5FA]';
    charmBorder = 'border-blue-200/90 ring-1 ring-blue-300/40';
    charmGlow = 'shadow-[0_2px_10px_rgba(59,130,246,0.5)]';
    charmEmblemBg = 'from-[#DBEAFE] to-[#1E3A8A]';
    starColor = '#FFFFFF';
    crystalCenter = '#3B82F6';
  } else if (tier === 30) {
    // 30-39: Arcane Amethyst Violet (بنفسجي نيون ملكي)
    charmBg = 'bg-gradient-to-r from-[#6B21A8] via-[#7C3AED] to-[#C084FC]';
    charmBorder = 'border-purple-200/90 ring-1 ring-purple-300/40';
    charmGlow = 'shadow-[0_2px_10px_rgba(168,85,247,0.5)]';
    charmEmblemBg = 'from-[#FAF5FF] to-[#4C1D95]';
    starColor = '#FFFFFF';
    crystalCenter = '#A855F7';
  } else if (tier === 40) {
    // 40-49: Bright Fuchsia Orchid (وردي أوركيد فوشيا فاقع)
    charmBg = 'bg-gradient-to-r from-[#9D174D] via-[#C026D3] to-[#F472B6]';
    charmBorder = 'border-fuchsia-200/90 ring-1 ring-pink-300/40';
    charmGlow = 'shadow-[0_2px_12px_rgba(217,70,239,0.55)]';
    charmEmblemBg = 'from-[#FDF4FF] to-[#86198F]';
    starColor = '#FDF4FF';
    crystalCenter = '#E879F9';
  } else if (tier === 50) {
    // 50-59: Fiery Coral & Sunset Orange (برتقالي مرجاني ناري)
    charmBg = 'bg-gradient-to-r from-[#C2410C] via-[#EA580C] to-[#FB923C]';
    charmBorder = 'border-orange-200/90 ring-1 ring-orange-300/40';
    charmGlow = 'shadow-[0_2px_12px_rgba(234,88,12,0.55)]';
    charmEmblemBg = 'from-[#FFEDD5] to-[#7C2D12]';
    starColor = '#FFFFFF';
    crystalCenter = '#FB923C';
  } else if (tier === 60) {
    // 60-69: Oceanic Jade Teal (أخضر يشم زمردي ساطع)
    charmBg = 'bg-gradient-to-r from-[#0F766E] via-[#0D9488] to-[#2DD4BF]';
    charmBorder = 'border-teal-200/90 ring-1 ring-teal-300/40';
    charmGlow = 'shadow-[0_2px_12px_rgba(20,184,166,0.55)]';
    charmEmblemBg = 'from-[#CCFBF1] to-[#134E4A]';
    starColor = '#FFFFFF';
    crystalCenter = '#2DD4BF';
  } else if (tier === 70) {
    // 70-79: Radiant Amber Sun Gold (ذهبي كهرماني شمسي متوهج)
    charmBg = 'bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#FBBF24]';
    charmBorder = 'border-yellow-200/90 ring-1 ring-yellow-400/50';
    charmGlow = 'shadow-[0_2px_12px_rgba(245,158,11,0.6)]';
    charmEmblemBg = 'from-[#FEF08A] to-[#78350F]';
    starColor = '#FEF08A';
    crystalCenter = '#F59E0B';
  } else if (tier === 80) {
    // 80-89: Deep Crimson Ruby (أحمر ياقوتي قرمزي ملكي)
    charmBg = 'bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#F87171]';
    charmBorder = 'border-rose-200/90 ring-1 ring-rose-300/50';
    charmGlow = 'shadow-[0_2px_14px_rgba(225,29,72,0.65)]';
    charmEmblemBg = 'from-[#FFE4E6] to-[#4C0519]';
    starColor = '#FFFFFF';
    crystalCenter = '#F43F5E';
  } else if (tier === 90) {
    // 90-99: Luxury Pink Diamond (ألماسي وردي متلألئ)
    charmBg = 'bg-gradient-to-r from-[#BE123C] via-[#E11D48] to-[#FDA4AF]';
    charmBorder = 'border-pink-100 ring-1 ring-pink-300';
    charmGlow = 'shadow-[0_2px_14px_rgba(225,29,72,0.65)]';
    charmEmblemBg = 'from-[#FFF1F2] to-[#881337]';
    starColor = '#FFFFFF';
    crystalCenter = '#FB7185';
  } else if (tier === 100) {
    // 100-119: Cosmic Royal Purple & Gold (أرجواني ملكي مطعم بالذهب)
    charmBg = 'bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#F59E0B]';
    charmBorder = 'border-yellow-200 ring-1 ring-yellow-400';
    charmGlow = 'shadow-[0_2px_16px_rgba(124,58,237,0.75)]';
    charmEmblemBg = 'from-[#FEF08A] to-[#3B0764]';
    starColor = '#FEF08A';
    crystalCenter = '#A855F7';
  } else if (tier === 120) {
    // 120-139: Blazing Phoenix Sunset (غروب العنقاء الناري برتقالي قرمزي)
    charmBg = 'bg-gradient-to-r from-[#7C2D12] via-[#EA580C] to-[#FDE047]';
    charmBorder = 'border-yellow-300 ring-1 ring-orange-400';
    charmGlow = 'shadow-[0_2px_16px_rgba(234,88,12,0.8)]';
    charmEmblemBg = 'from-[#FEF08A] to-[#7C2D12]';
    starColor = '#FEF08A';
    crystalCenter = '#EA580C';
  } else if (tier === 140) {
    // 140-159: Cosmic Space Nebula (سديم المجرة الفضائي أزرق وأرجواني)
    charmBg = 'bg-gradient-to-r from-[#172554] via-[#4338CA] to-[#38BDF8]';
    charmBorder = 'border-cyan-200 ring-1 ring-indigo-400';
    charmGlow = 'shadow-[0_2px_18px_rgba(56,189,248,0.8)]';
    charmEmblemBg = 'from-[#E0F2FE] to-[#1E1B4B]';
    starColor = '#E0F2FE';
    crystalCenter = '#38BDF8';
  } else if (tier === 160 || tier === 165) {
    // 160-179: Prismatic Aurora Rainbow (ألماسي برّاق متلألئ)
    charmBg = 'bg-gradient-to-r from-[#831843] via-[#A855F7] to-[#06B6D4]';
    charmBorder = 'border-pink-200 ring-1 ring-purple-400';
    charmGlow = 'shadow-[0_2px_18px_rgba(168,85,247,0.85)]';
    charmEmblemBg = 'from-[#FFFFFF] to-[#3B0764]';
    starColor = '#FFFFFF';
    crystalCenter = '#C084FC';
  } else if (tier === 180) {
    // 180-199: Imperial Dragon Scarlet (تنين اللهب الإمبراطوري أحمر قان)
    charmBg = 'bg-gradient-to-r from-[#7F1D1D] via-[#E11D48] to-[#FBBF24]';
    charmBorder = 'border-2 border-yellow-300 ring-1 ring-rose-400';
    charmGlow = 'shadow-[0_2px_20px_rgba(225,29,72,0.9)]';
    charmEmblemBg = 'from-[#FEF08A] to-[#450A0A]';
    starColor = '#FEF08A';
    crystalCenter = '#E11D48';
  } else if (tier === 200) {
    // 200-209: Imperial Astral Diamond (ألماس فلكي إمبراطوري بنفسجي وذهبي)
    charmBg = 'bg-gradient-to-r from-[#3B0764] via-[#7E22CE] to-[#FDE047]';
    charmBorder = 'border-2 border-yellow-200 ring-1 ring-purple-400';
    charmGlow = 'shadow-[0_0_20px_rgba(126,34,206,0.95)]';
    charmEmblemBg = 'from-[#FEF08A] to-[#2E1065]';
    starColor = '#FEF08A';
    crystalCenter = '#9333EA';
  } else if (tier === 210) {
    // 210-219: ✨ USER'S CURRENT LEVEL 210: Celestial Royal Gold & Amethyst Supreme ✨
    // (ذروة السحر الإمبراطورية 210 - إطار ذهبي بارز مزدوج ولمعان فوشيا كهرماني ساطع)
    charmBg = 'bg-gradient-to-r from-[#4A044E] via-[#86198F] to-[#EAB308]';
    charmBorder = 'border-2 border-amber-300 ring-2 ring-yellow-400/90';
    charmGlow = 'shadow-[0_0_20px_rgba(234,179,8,0.95)]';
    charmEmblemBg = 'from-[#FEF08A] via-[#F472B6] to-[#4A044E]';
    starColor = '#FEF08A';
    crystalCenter = '#F59E0B';
  } else if (tier === 220) {
    // 220-239: Solar Supernova (بلازما شمسية خارقة ذهبي كهرماني حارق)
    charmBg = 'bg-gradient-to-r from-[#78350F] via-[#D97706] to-[#FEF08A]';
    charmBorder = 'border-2 border-yellow-100 ring-2 ring-amber-400';
    charmGlow = 'shadow-[0_0_22px_rgba(251,191,36,0.95)]';
    charmEmblemBg = 'from-[#FFFFFF] to-[#78350F]';
    starColor = '#FFFFFF';
    crystalCenter = '#F59E0B';
  } else if (tier === 240) {
    // 240-259: Sovereign Arcane Zenith (عرش السيادة السحرية تدرج أسطوري أسود وذهبي ولمعان بنفسجي)
    charmBg = 'bg-gradient-to-r from-[#1C1917] via-[#581C87] to-[#F59E0B]';
    charmBorder = 'border-2 border-yellow-300 ring-2 ring-purple-400';
    charmGlow = 'shadow-[0_0_24px_rgba(245,158,11,1)]';
    charmEmblemBg = 'from-[#FEF08A] to-[#1C1917]';
    starColor = '#FEF08A';
    crystalCenter = '#A855F7';
  } else if (tier >= 260) {
    // 260: 👑 Supreme Magic Omnipotence 260 👑 (خاتم السحر الأعظم 260 - تاج الألوهية والخلود)
    charmBg = 'bg-gradient-to-r from-[#2E1065] via-[#BE185D] to-[#FFD700]';
    charmBorder = 'border-2 border-yellow-200 ring-2 ring-yellow-300 animate-pulse';
    charmGlow = 'shadow-[0_0_28px_rgba(255,215,0,1)]';
    charmEmblemBg = 'from-[#FFFFFF] to-[#4C0519]';
    starColor = '#FFFFFF';
    crystalCenter = '#FFD700';
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 shrink-0 rounded-full ${charmBg} border ${charmBorder} ${charmGlow} select-none cursor-pointer transition active:scale-95 ${hClass} ${className} relative overflow-hidden`}
      dir="ltr"
      title={`مستوى السحر: Lv. ${displayNum}`}
    >
      {/* 3D Glass reflection highlight on upper half */}
      <div className="absolute inset-x-1 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />

      {/* 8-Point Arcane Crystal Star Emblem on left in LTR */}
      <div className={`relative flex items-center justify-center shrink-0 ${emblemSize}`}>
        <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${charmEmblemBg} p-[1px] shadow-xs`}>
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#3B0764] to-[#1E1B4B] flex items-center justify-center">
            {/* 8-Point Starlight Diamond / Crystal */}
            <svg viewBox="0 0 24 24" className="w-[82%] h-[82%]" fill="none">
              <path
                d="M12 2L14.5 8L20.5 7L16.5 12L20.5 17L14.5 16L12 22L9.5 16L3.5 17L7.5 12L3.5 7L9.5 8L12 2Z"
                fill={starColor}
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
              <circle cx="12" cy="12" r="2.2" fill={crystalCenter} stroke="#FFF" strokeWidth="0.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Level Number in Crisp Sparkling Text */}
      <span
        className={`text-white italic tracking-wide font-black drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] relative z-10 ${textClass}`}
      >
        {displayNum}
      </span>
    </div>
  );
};

/* Entrance Banner Preview Component for Wealth Table (مؤثر الدخول مطابق للصورة 7) */
export const EntranceBannerPreview: React.FC<{ level: number }> = ({ level }) => {
  if (level < 10) {
    return <span className="text-slate-500 font-bold text-xs select-none">--</span>;
  }

  const isMaxTier = level >= 200;
  const isHighTier = level >= 80;

  return (
    <div className="relative w-28 h-6 sm:w-32 sm:h-7 rounded-full overflow-hidden border border-amber-400/60 bg-gradient-to-r from-amber-500/20 via-purple-900/30 to-amber-950/60 p-0.5 flex items-center justify-between shadow-xs">
      {/* Mini Avatar / Emblem Circle on left */}
      <div className="w-5 h-5 rounded-full bg-amber-400/90 border border-white flex items-center justify-center shrink-0 shadow-xs">
        <span className="text-[9px]">👑</span>
      </div>

      {/* Ribbon Trail Banner */}
      <div className="flex-1 px-1.5 flex items-center justify-center">
        <span
          className={`text-[9px] font-black tracking-wider truncate drop-shadow-xs ${
            isMaxTier
              ? 'text-yellow-300 animate-pulse'
              : isHighTier
              ? 'text-amber-200'
              : 'text-amber-100'
          }`}
        >
          {level >= 240
            ? 'موكب العرش 240'
            : level >= 100
            ? `موكب إمبراطوري ${level}`
            : `لافتة الدخول ${level}`}
        </span>
      </div>

      {/* Wing ornament on right */}
      <div className="text-[10px] pr-1 select-none">🪽</div>
    </div>
  );
};

/* Dedicated Helpers for Wealth and Charm/Experience */
export const WealthBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <OfficialScreenshotBadge variant="wealth" {...props} />
);

export const CharmBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <OfficialScreenshotBadge variant="charm" {...props} />
);

export const GameBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <OfficialScreenshotBadge variant="games" {...props} />
);

export const DamaskBackground: React.FC<{ variant: 'wealth' | 'charm' | 'games' }> = ({ variant }) => {
  const isWealth = variant === 'wealth';
  const isGames = variant === 'games';
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className={`absolute inset-0 ${
          isGames
            ? 'bg-gradient-to-b from-[#022019] via-[#041B15] to-[#010D0A]'
            : isWealth
            ? 'bg-gradient-to-b from-[#1C0D02] via-[#110701] to-[#080300]'
            : 'bg-gradient-to-b from-[#170423] via-[#0E0217] to-[#06000A]'
        }`}
      />
    </div>
  );
};
