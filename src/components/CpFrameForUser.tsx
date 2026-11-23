import React from 'react';
import { VipAvatarFrame } from './VipAvatarFrame';
import { CpWingAvatarFrame } from './CpWingAvatarFrame';
import { RoyalSeatIcon } from './RoyalSeatIcon';
import { useConfirmedCpFrame } from '../services/cpFramePreference';

/** Seat-frame priority: confirmed CP frame > VIP frame > royal default.
 * Keep hook usage inside the per-user component, never inside the seat loop.
 */
export const CpFrameForUser: React.FC<{ userId: string; name?: string; vipLevel?: number }> = ({ userId, name, vipLevel }) => {
  const cpEnabled = useConfirmedCpFrame(userId);
  if (cpEnabled) return <CpWingAvatarFrame enabled name={name} />;
  if (Number.isInteger(vipLevel) && Number(vipLevel) >= 1 && Number(vipLevel) <= 12) {
    return <VipAvatarFrame level={vipLevel} />;
  }
  return <RoyalSeatIcon frameOnly className="absolute -inset-[9px] z-20 h-[calc(100%+18px)] w-[calc(100%+18px)] pointer-events-none" />;
};
