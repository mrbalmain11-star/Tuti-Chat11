import React from 'react';
import { CpWingAvatarFrame } from './CpWingAvatarFrame';
import { useConfirmedCpFrame } from '../services/cpFramePreference';

/** Per-user wrapper so seat lists never call hooks inside a loop. */
export const CpFrameForUser: React.FC<{ userId: string; name?: string }> = ({ userId, name }) => {
  const enabled = useConfirmedCpFrame(userId);
  return <CpWingAvatarFrame enabled={enabled} name={name} />;
};
