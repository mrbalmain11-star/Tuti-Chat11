import { StoreAvatarFrame } from './StoreAvatarFrame';
import React from 'react';
import { VipAvatarFrame } from './VipAvatarFrame';
import { CpWingAvatarFrame } from './CpWingAvatarFrame';
import { useConfirmedCpFrame } from '../services/cpFramePreference';

/** Seat-frame priority: confirmed CP frame > store frame > VIP frame.
 * Keep hook usage inside the per-user component, never inside the seat loop.
 */
export const CpFrameForUser: React.FC<{ userId: string; name?: string; vipLevel?: number }> = ({ userId, name, vipLevel }) => {
  const cpEnabled = useConfirmedCpFrame(userId);
  if (cpEnabled) return <CpWingAvatarFrame enabled name={name} />;
  const validVip = Number.isInteger(vipLevel) && Number(vipLevel) >= 1 && Number(vipLevel) <= 12;
  return <StoreAvatarFrame userId={userId} fallback={validVip ? <VipAvatarFrame level={vipLevel} />
    : null} />;
};
