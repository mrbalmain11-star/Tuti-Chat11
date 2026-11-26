import React from 'react';
import { activeVipTier } from '../utils/vipPerks';

interface VipNameProps {
  name: string;
  vipLevel?: number;
  className?: string;
  fallbackColor?: string;
  style?: React.CSSProperties;
}

export const getVipNameClass = (vipLevel?: number): string => {
  const tier = activeVipTier(vipLevel);
  return tier ? `vip-shine-${tier}` : '';
};

export const VipName: React.FC<VipNameProps> = ({
  name,
  vipLevel,
  className = '',
  fallbackColor = 'text-white',
  style,
}) => {
  const vipClass = getVipNameClass(vipLevel);

  return (
    <span
      className={`inline-block truncate ${vipClass ? `${vipClass} font-black` : fallbackColor} ${className}`}
      style={style}
    >
      {name}
    </span>
  );
};
