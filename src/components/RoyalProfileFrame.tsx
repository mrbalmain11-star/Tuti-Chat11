import React, { useEffect, useState } from 'react';
import { RoyalLevelEmblem } from './RoyalLevelEmblem';
import { fetchMyEquippedRoyalFrame, type EquippedRoyalFrame } from '../services/royalEquipment';

/** Read-only overlay; never changes the existing avatar upload or VIP logic. */
export const RoyalProfileFrame: React.FC<{ refreshKey?: boolean }> = ({ refreshKey }) => {
  const [equipped, setEquipped] = useState<EquippedRoyalFrame | null>(null);
  useEffect(() => {
    let active = true;
    void fetchMyEquippedRoyalFrame().then(value => {
      if (active) setEquipped(value);
    }).catch(() => { if (active) setEquipped(null); });
    return () => { active = false; };
  }, [refreshKey]);
  if (!equipped || equipped.track === 'room') return null;
  return <div className="pointer-events-none absolute -inset-3 z-20 flex items-center justify-center" aria-label={`إطار ${equipped.track} مستوى ${equipped.level}`}>
    <RoyalLevelEmblem track={equipped.track} level={equipped.level} kind="frame" size={96} />
  </div>;
};
