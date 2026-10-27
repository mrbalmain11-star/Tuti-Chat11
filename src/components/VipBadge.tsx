import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export interface VipBadgeProps {
  vipLevel?: number;
  size?: 'xs' | 'sm' | 'compact' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

// 12 VIP Beast Metadata (Matching Screenshot 0e894276.jpg and Image 3 reference)
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
    beast: 'غزال الريم الأخضر 🦌',
    label: 'VIP1',
    badgeImg: '/assets/vip_badges/vip_1.png',
    themeColor: '#22c55e',
    textColor: 'text-white',
    innerBg: 'from-[#052e16] to-[#14532d]',
    gradient: 'from-[#15803d] via-[#22c55e] to-[#166534]',
  },
  2: {
    name: 'VIP 2',
    beast: 'الفرس السماوي المجنح 🦄',
    label: 'VIP2',
    badgeImg: '/assets/vip_badges/vip_2.png',
    themeColor: '#06b6d4',
    textColor: 'text-white',
    innerBg: 'from-[#083344] to-[#0e7490]',
    gradient: 'from-[#0891b2] via-[#06b6d4] to-[#0284c7]',
  },
  3: {
    name: 'VIP 3',
    beast: 'الذئب القمري الكوبالت 🐺',
    label: 'VIP3',
    badgeImg: '/assets/vip_badges/vip_3.png',
    themeColor: '#3b82f6',
    textColor: 'text-white',
    innerBg: 'from-[#172554] to-[#1e40af]',
    gradient: 'from-[#1d4ed8] via-[#3b82f6] to-[#1e40af]',
  },
  4: {
    name: 'VIP 4',
    beast: 'الصقر الأرجواني الملكي 🦅',
    label: 'VIP4',
    badgeImg: '/assets/vip_badges/vip_4.png',
    themeColor: '#9333ea',
    textColor: 'text-white',
    innerBg: 'from-[#3b0764] to-[#581c87]',
    gradient: 'from-[#7c3aed] via-[#9333ea] to-[#6b21a8]',
  },
  5: {
    name: 'VIP 5',
    beast: 'الفهد الذهبي الأسطوري 🐆',
    label: 'VIP5',
    badgeImg: '/assets/vip_badges/vip_5.png',
    themeColor: '#f59e0b',
    textColor: 'text-slate-950 font-black',
    innerBg: 'from-[#451a03] to-[#78350f]',
    gradient: 'from-[#d97706] via-[#f59e0b] to-[#b45309]',
  },
  6: {
    name: 'VIP 6',
    beast: 'الأسد البرونزي الملكي 🦁',
    label: 'VIP6',
    badgeImg: '/assets/vip_badges/vip_6.png',
    themeColor: '#ea580c',
    textColor: 'text-white font-black',
    innerBg: 'from-[#431407] to-[#7c2d12]',
    gradient: 'from-[#c2410c] via-[#ea580c] to-[#9a3412]',
  },
  7: {
    name: 'VIP 7',
    beast: 'النمر اللهبي المشع 🐅',
    label: 'VIP7',
    badgeImg: '/assets/vip_badges/vip_7.png',
    themeColor: '#f97316',
    textColor: 'text-white font-black',
    innerBg: 'from-[#7c2d12] to-[#9a3412]',
    gradient: 'from-[#ea580c] via-[#f97316] to-[#c2410c]',
  },
  8: {
    name: 'VIP 8',
    beast: 'الفيل الملكي الوردي 🐘',
    label: 'VIP8',
    badgeImg: '/assets/vip_badges/vip_8.png',
    themeColor: '#ec4899',
    textColor: 'text-white font-black',
    innerBg: 'from-[#500724] to-[#831843]',
    gradient: 'from-[#db2777] via-[#ec4899] to-[#be185d]',
  },
  9: {
    name: 'VIP 9',
    beast: 'التنين القرمزي الناري 🐉',
    label: 'VIP9',
    badgeImg: '/assets/vip_badges/vip_9.png',
    themeColor: '#ef4444',
    textColor: 'text-white font-black',
    innerBg: 'from-[#450a0a] to-[#7f1d1d]',
    gradient: 'from-[#dc2626] via-[#ef4444] to-[#b91c1c]',
  },
  10: {
    name: 'VIP 10',
    beast: 'الأسد الإمبراطوري المتوج 👑',
    label: 'VIP10',
    badgeImg: '/assets/vip_badges/vip_10.png',
    themeColor: '#dc2626',
    textColor: 'text-yellow-200 font-black',
    innerBg: 'from-[#4c0519] to-[#881337]',
    gradient: 'from-[#991b1b] via-[#dc2626] to-[#7f1d1d]',
  },
  11: {
    name: 'SVIP 11',
    beast: 'العنقاء الإمبراطورية المجنحة 🪽',
    label: 'SVIP11',
    badgeImg: '/assets/vip_badges/vip_11.png',
    themeColor: '#a855f7',
    textColor: 'text-amber-100 font-black',
    innerBg: 'from-[#2e1065] to-[#581c87]',
    gradient: 'from-[#b45309] via-[#ea580c] to-[#7c3aed]',
  },
  12: {
    name: 'SVIP 12',
    beast: 'عرش السيادة والخلود الأعظم ✨',
    label: 'SVIP12',
    badgeImg: '/assets/vip_badges/vip_12.png',
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

  // If no VIP active, don't render
  if (!vipLevel || vipLevel <= 0) return null;

  const validLevel = Math.max(1, Math.min(12, Math.floor(vipLevel)));
  const meta = VIP_BEAST_METADATA[validLevel] || VIP_BEAST_METADATA[1];

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
