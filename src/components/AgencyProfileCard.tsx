import React from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

interface AgencyProfileCardProps {
  avatar?: string;
  agencyName?: string;
  agencyId?: string;
  memberCount?: number;
  roleLabel?: string;
  onClick?: () => void;
  className?: string;
}

export const AgencyProfileCard: React.FC<AgencyProfileCardProps> = ({
  avatar,
  agencyName,
  agencyId,
  memberCount,
  roleLabel = 'مالك وكالة',
  onClick,
  className = '',
}) => {
  const { currentUser, setOpenAgencyModal, agencyMemberCount } = useApp();

  const displayAvatar =
    avatar ||
    currentUser.avatar ||
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=80';
  const displayAgencyName = agencyName || currentUser.agencyName || 'وكالة العراقين';
  const displayAgencyId = agencyId || currentUser.id || '2365555';
  const displayMemberCount = memberCount ?? agencyMemberCount ?? 1;

  const handleClick = () => {
    sounds.playClick();
    if (onClick) {
      onClick();
    } else {
      setOpenAgencyModal(true);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full min-h-[86px] rounded-[26px] bg-gradient-to-r from-[#BAF7DB] via-[#D2FAE9] to-[#A3F2CD] border border-[#8BE6B9]/80 shadow-[0_2px_12px_rgba(16,185,129,0.14)] hover:brightness-[1.01] active:scale-[0.99] transition cursor-pointer select-none flex items-center justify-between px-3.5 py-2.5 relative overflow-hidden ${className}`}
      dir="rtl"
      title="تفاصيل الوكالة"
    >
      {/* Right Side: Rounded Squircle Avatar + Agency Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Squircle Avatar with rounded corners */}
        <div className="w-[58px] h-[58px] rounded-[18px] overflow-hidden shrink-0 shadow-xs border border-emerald-700/20 bg-slate-900">
          <img
            src={displayAvatar}
            alt={displayAgencyName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Agency Information Columns */}
        <div className="flex flex-col items-start justify-center text-right min-w-0 pr-0.5">
          {/* 1. Agency Name */}
          <h4 className="text-[15px] font-bold text-[#065F46] tracking-tight truncate leading-tight">
            {displayAgencyName}
          </h4>

          {/* 2. Ornate Fantasy "مالك وكالة" Badge */}
          <div className="relative inline-flex items-center h-[23px] my-1 select-none">
            {/* Ornate Gold & Emerald Wings SVG frame */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
              viewBox="0 0 160 32"
            >
              <defs>
                <linearGradient id="badgeGoldBorder" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7E5C1E" />
                  <stop offset="20%" stopColor="#E0B853" />
                  <stop offset="50%" stopColor="#FFF4BC" />
                  <stop offset="80%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#7E5C1E" />
                </linearGradient>
                <linearGradient id="badgeGreenBg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0B3E25" />
                  <stop offset="50%" stopColor="#14603B" />
                  <stop offset="100%" stopColor="#09331E" />
                </linearGradient>
              </defs>
              {/* Outer bevel plate */}
              <polygon
                points="12,2 148,2 157,16 148,30 12,30 3,16"
                fill="url(#badgeGreenBg)"
                stroke="url(#badgeGoldBorder)"
                strokeWidth="1.6"
              />
              {/* Left wing tips */}
              <path
                d="M 3 16 L 9 5 L 15 5 L 8 16 L 15 27 L 9 27 Z"
                fill="url(#badgeGoldBorder)"
              />
              {/* Right wing tips */}
              <path
                d="M 157 16 L 151 5 L 145 5 L 152 16 L 145 27 L 151 27 Z"
                fill="url(#badgeGoldBorder)"
              />
            </svg>

            {/* Badge Content */}
            <div className="relative z-10 flex items-center gap-1.5 px-3">
              <span className="text-[11px] font-black text-[#F3FFF8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] tracking-wide">
                {roleLabel}
              </span>

              {/* Faceted Emerald Gem inside Gold Frame */}
              <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 drop-shadow-[0_0_4px_#34d399]">
                  <polygon
                    points="12,1 21,6 21,18 12,23 3,18 3,6"
                    fill="#D4AF37"
                    stroke="#FFF1B0"
                    strokeWidth="0.8"
                  />
                  <polygon
                    points="12,3 19,7.5 19,16.5 12,21 5,16.5 5,7.5"
                    fill="#059669"
                  />
                  <polygon
                    points="12,3 19,7.5 12,12 5,7.5"
                    fill="#34D399"
                    opacity="0.9"
                  />
                  <polygon
                    points="12,12 19,16.5 12,21 5,16.5"
                    fill="#047857"
                  />
                  <polygon
                    points="12,7 15,9.5 12,12 9,9.5"
                    fill="#A7F3D0"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 3. Agency ID & Members count */}
          <div className="flex items-center gap-2 text-[12px] font-bold text-[#065F46] leading-none mt-0.5 font-mono">
            <span>ID الوكالة: {displayAgencyId}</span>
            <span className="text-[#065F46]/50">|</span>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#065F46] fill-[#065F46]/20" />
              <span className="font-sans font-bold">{displayMemberCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side: Green Arrow Chevron (Exact match to image) */}
      <div className="shrink-0 flex items-center justify-center pl-1 text-[#047857]">
        <ChevronRight className="w-6 h-6 stroke-[3]" />
      </div>
    </div>
  );
};
