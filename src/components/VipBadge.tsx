import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export interface VipBadgeProps {
  vipLevel?: number;
  size?: 'xs' | 'sm' | 'compact' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

// VIP tier visuals use the twelve approved standalone badge assets.
export const VIP_BEAST_METADATA: Record<
  number,
  {
    name: string;
    beast: string;
    label: string;
    badgeImg: string;
    themeColor: string;
    textColor: string;
    innerBg: string;
    gradient: string;
  }
> = {
  1: {
    name: 'VIP 1',
    beast: 'الذئب الأزرق الملكي',
    label: 'VIP1',
    badgeImg: '/assets/vip/badges/vip_badge_01.png',
    themeColor: '#38bdf8',
    textColor: 'text-white',
    innerBg: 'from-[#052e16] to-[#14532d]',
    gradient: 'from-[#15803d] via-[#22c55e] to-[#166534]',
  },
  2: {
    name: 'VIP 2',
    beast: 'الطائر الملكي البنفسجي',
    label: 'VIP2',
    badgeImg: '/assets/vip/badges/vip_badge_02.png',
    themeColor: '#a855f7',
    textColor: 'text-white',
    innerBg: 'from-[#083344] to-[#0e7490]',
    gradient: 'from-[#0891b2] via-[#06b6d4] to-[#0284c7]',
  },
  3: {
    name: 'VIP 3',
    beast: 'التنين القرمزي الملكي',
    label: 'VIP3',
    badgeImg: '/assets/vip/badges/vip_badge_03.png',
    themeColor: '#ef4444',
    textColor: 'text-white',
    innerBg: 'from-[#172554] to-[#1e40af]',
    gradient: 'from-[#1d4ed8] via-[#3b82f6] to-[#1e40af]',
  },
  4: {
    name: 'VIP 4',
    beast: 'الحصان الأبيض الزمردي',
    label: 'VIP4',
    badgeImg: '/assets/vip/badges/vip_badge_04.png',
    themeColor: '#22c55e',
    textColor: 'text-white',
    innerBg: 'from-[#3b0764] to-[#581c87]',
    gradient: 'from-[#7c3aed] via-[#9333ea] to-[#6b21a8]',
  },
  5: {
    name: 'VIP 5',
    beast: 'النمر الأبيض الأزرق',
    label: 'VIP5',
    badgeImg: '/assets/vip/badges/vip_badge_05.png',
    themeColor: '#3b82f6',
    textColor: 'text-slate-950 font-black',
    innerBg: 'from-[#451a03] to-[#78350f]',
    gradient: 'from-[#d97706] via-[#f59e0b] to-[#b45309]',
  },
  6: {
    name: 'VIP 6',
    beast: 'النمر الأبيض البنفسجي',
    label: 'VIP6',
    badgeImg: '/assets/vip/badges/vip_badge_06.png',
    themeColor: '#a855f7',
    textColor: 'text-white font-black',
    innerBg: 'from-[#431407] to-[#7c2d12]',
    gradient: 'from-[#c2410c] via-[#ea580c] to-[#9a3412]',
  },
  7: {
    name: 'VIP 7',
    beast: 'الأسد الملكي الناري',
    label: 'VIP7',
    badgeImg: '/assets/vip/badges/vip_badge_07.png',
    themeColor: '#f97316',
    textColor: 'text-white font-black',
    innerBg: 'from-[#7c2d12] to-[#9a3412]',
    gradient: 'from-[#ea580c] via-[#f97316] to-[#c2410c]',
  },
  8: {
    name: 'VIP 8',
    beast: 'النمر الأزرق الملكي',
    label: 'VIP8',
    badgeImg: '/assets/vip/badges/vip_badge_08.png',
    themeColor: '#2563eb',
    textColor: 'text-white font-black',
    innerBg: 'from-[#500724] to-[#831843]',
    gradient: 'from-[#db2777] via-[#ec4899] to-[#be185d]',
  },
  9: {
    name: 'VIP 9',
    beast: 'التنين الفيروزي الملكي',
    label: 'VIP9',
    badgeImg: '/assets/vip/badges/vip_badge_09.png',
    themeColor: '#06b6d4',
    textColor: 'text-white font-black',
    innerBg: 'from-[#450a0a] to-[#7f1d1d]',
    gradient: 'from-[#dc2626] via-[#ef4444] to-[#b91c1c]',
  },
  10: {
    name: 'VIP 10',
    beast: 'العنقاء الذهبية النارية',
    label: 'VIP10',
    badgeImg: '/assets/vip/badges/vip_badge_10.png',
    themeColor: '#f97316',
    textColor: 'text-yellow-200 font-black',
    innerBg: 'from-[#4c0519] to-[#881337]',
    gradient: 'from-[#991b1b] via-[#dc2626] to-[#7f1d1d]',
  },
  11: {
    name: 'SVIP 11',
    beast: 'الأسد الأبيض الزمردي',
    label: 'SVIP11',
    badgeImg: '/assets/vip/badges/vip_badge_11.png',
    themeColor: '#22c55e',
    textColor: 'text-amber-100 font-black',
    innerBg: 'from-[#2e1065] to-[#581c87]',
    gradient: 'from-[#b45309] via-[#ea580c] to-[#7c3aed]',
  },
  12: {
    name: 'SVIP 12',
    beast: 'العقاب الملكي الذهبي',
    label: 'SVIP12',
    badgeImg: '/assets/vip/badges/vip_badge_12.png',
    themeColor: '#eab308',
    textColor: 'text-yellow-100 font-black',
    innerBg: 'from-[#451a03] to-[#292524]',
    gradient: 'from-[#2d1a04] via-[#78350f] to-[#b45309]',
  },
};

export const VipBadge: React.FC<VipBadgeProps> = ({
  vipLevel = 0,
  size = 'md',
  className = '',
  onClick,
}) => {
  const { setOpenVipModal, setVipModalInitialPopup } = useApp();
  const [imgError, setImgError] = useState(false);

  // Hooks must run in the same order even when VIP is disabled.
  // Reset the asset error when a user's VIP tier changes.
  const validLevel = Number.isFinite(vipLevel) && vipLevel! > 0
    ? Math.max(1, Math.min(12, Math.floor(vipLevel!)))
    : 0;
  useEffect(() => { setImgError(false); }, [validLevel]);

  // Hide inactive VIP only after hooks have executed.
  if (validLevel === 0) return null;
  const meta = VIP_BEAST_METADATA[validLevel];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    if (onClick) {
      onClick();
    } else {
      if (setVipModalInitialPopup) {
        setVipModalInitialPopup('badge');
      }
      setOpenVipModal(true);
    }
  };

  const hClass =
    size === 'xs'
      ? 'h-4'
      : size === 'compact' || size === 'sm'
      ? 'h-5'
      : size === 'lg'
      ? 'h-8'
      : size === 'xl'
      ? 'h-10'
      : 'h-6.5';

  if (!imgError) {
    return (
      <div
        onClick={handleClick}
        className={`inline-flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform duration-150 select-none ${hClass} ${className}`}
        dir="ltr"
        title={`${meta.name} - ${meta.beast} (انقر لفتح متجر شارات VIP)`}
      >
        <img
          src={meta.badgeImg}
          alt={meta.name}
          onError={() => setImgError(true)}
          className="block h-full w-auto max-w-full min-w-0 object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  // Fallback if image fails to load
  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-1 rounded-full px-2 bg-gradient-to-r from-amber-600 to-yellow-500 border border-amber-300 text-slate-950 text-xs font-black cursor-pointer active:scale-95 transition select-none ${hClass} ${className}`}
      dir="ltr"
      title={`${meta.name} - ${meta.beast}`}
    >
      <span>👑</span>
      <span>{meta.label}</span>
    </div>
  );
};
