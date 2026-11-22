import React from 'react';
import { VipAvatarFrame } from './VipAvatarFrame';
import { CpWingAvatarFrame } from './CpWingAvatarFrame';
import { useConfirmedCpFrame } from '../services/cpFramePreference';

/** Per-user wrapper so seat lists never call hooks inside a loop. */
export const CpFrameForUser: React.FC<{ userId: string; name?: string; vipLevel?: number }> = ({ userId, name, vipLevel }) => {
  const enabled = useConfirmedCpFrame(userId);
  return enabled ? <CpWingAvatarFrame enabled name={name} /> : <VipAvatarFrame level={vipLevel} />;
};
