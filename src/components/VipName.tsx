import React from 'react';

interface VipNameProps {
  name: string;
  vipLevel?: number;
  className?: string;
  fallbackColor?: string;
  style?: React.CSSProperties;
}

/**
 * Returns the shimmering class based on VIP Level:
 * - VIP 1: أحمر وأسود يلمع (Red & Black Shimmering)
 * - VIP 2: أصفر وأسود لامع (Yellow & Black Shining)
 * - VIP 3: أخضر وفضي (Green & Silver Shimmering)
 * - VIP 4: أسود وأبيض ذهبي وأحمر يلمع (Black, White, Gold, & Red Shining)
 * - VIP 5: أحمر وأسود وذهبي وفضي يلمع رائع (Red, Black, Gold, & Silver Wonderful Shining)
 * - Only applied when VIP is active (vipLevel > 0)
 */
export const getVipNameClass = (vipLevel?: number): string => {
  if (!vipLevel || vipLevel <= 0) return '';
  switch (vipLevel) {
    case 1:
      return 'vip-shine-1';
    case 2:
      return 'vip-shine-2';
    case 3:
      return 'vip-shine-3';
    case 4:
      return 'vip-shine-4';
    case 5:
      return 'vip-shine-5';
    case 6:
      return 'vip-shine-6';
    case 7:
      return 'vip-shine-7';
    case 8:
      return 'vip-shine-8';
    case 9:
      return 'vip-shine-9';
    case 10:
      return 'vip-shine-10';
    case 11:
      return 'vip-shine-11';
    case 12:
    default:
      return 'vip-shine-12';
  }
};

export const VipName: React.FC<VipNameProps> = ({
  name,
  vipLevel,
  className = '',
  fallbackColor = 'text-white',
  style,
}) => {
  const isVip = Boolean(vipLevel && vipLevel > 0);
  const vipClass = getVipNameClass(vipLevel);

  return (
    <span
      className={`inline-block truncate ${isVip ? `${vipClass} font-black` : fallbackColor} ${className}`}
      style={style}
    >
      {name}
    </span>
  );
};
