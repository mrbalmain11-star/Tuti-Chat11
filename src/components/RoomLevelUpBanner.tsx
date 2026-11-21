import { ApprovedRoyalBanner } from './ApprovedRoyalBanner';
import React from 'react';

/** Presentation only. A room level must come from a verified backend event, never room rank or gift totals. */
export type VerifiedRoomLevelUp = {
  roomId: string;
  roomName: string;
  level: number;
};

export const RoomLevelUpBanner: React.FC<{ event: VerifiedRoomLevelUp | null }> = ({ event }) => {
    return <ApprovedRoyalBanner asset="/assets/banners/05-room-level-purple.png" headline="تهانينا! ارتفع مستوى الغرفة" detail={`${event.roomName} — المستوى ${event.level}`} badge={`LV ${event.level}`} />;
};
