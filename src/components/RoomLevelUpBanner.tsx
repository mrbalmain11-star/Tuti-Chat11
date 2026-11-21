import { ApprovedRoyalBanner } from './ApprovedRoyalBanner';
import React, { useEffect, useState } from 'react';
import { fetchVerifiedRoomRoyalXp } from '../services/royalXp';
import { royalProgress } from '../utils/royalLevels';

/** Presentation only. A room level must come from a verified backend event, never room rank or gift totals. */
export type VerifiedRoomLevelUp = {
  roomId: string;
  roomName: string;
  level: number;
};

export const RoomLevelUpBanner: React.FC<{ event: VerifiedRoomLevelUp | null }> = ({ event }) => {
  if (!event) return null;
  return <ApprovedRoyalBanner asset="/assets/banners/05-room-level-purple.png" headline="تهانينا! ارتفع مستوى الغرفة" detail={`${event.roomName} — المستوى ${event.level}`} badge={`LV ${event.level}`} />;
};

/** Announces only room level increases verified by completed gift XP from Staging. */
export const RoomLevelUpWatcher: React.FC<{ roomId: string; roomName: string; active: boolean }> = ({ roomId, roomName, active }) => {
  const [event, setEvent] = useState<VerifiedRoomLevelUp | null>(null);
  useEffect(() => {
    setEvent(null);
    if (!active || !roomId) return;
    let disposed = false;
    let previousLevel: number | null = null;
    const poll = async () => {
      try {
        const xp = await fetchVerifiedRoomRoyalXp(roomId);
        if (disposed) return;
        const level = royalProgress(BigInt(xp)).level;
        if (previousLevel !== null && level > previousLevel) setEvent({ roomId, roomName, level });
        previousLevel = level;
      } catch (error) {
        console.warn('Verified room level unavailable:', error);
      }
    };
    void poll();
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void poll(); }, 8000);
    return () => { disposed = true; window.clearInterval(interval); };
  }, [roomId, roomName, active]);
  useEffect(() => {
    if (!event) return;
    const timeout = window.setTimeout(() => setEvent(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [event]);
  return <RoomLevelUpBanner event={event} />;
};
