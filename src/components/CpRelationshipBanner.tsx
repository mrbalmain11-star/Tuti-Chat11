import React, { useEffect, useState } from 'react';
import { ApprovedRoyalBanner } from './ApprovedRoyalBanner';

type ConfirmedCpAnnouncement = {
  leftName: string;
  rightName: string;
  typeLabel: string;
  level: number;
};

const EVENT_NAME = 'totichat:cp-confirmed';

/** The banner is shown only after the server confirms a real CP relationship and level. */
export const CpRelationshipBanner: React.FC = () => {
  const [event, setEvent] = useState<ConfirmedCpAnnouncement | null>(null);
  useEffect(() => {
    const onConfirmed = (rawEvent: Event) => {
      const detail = (rawEvent as CustomEvent<ConfirmedCpAnnouncement>).detail;
      if (!detail || !detail.leftName || !detail.rightName || !detail.typeLabel || !Number.isFinite(detail.level)) return;
      setEvent(detail);
    };
    window.addEventListener(EVENT_NAME, onConfirmed);
    return () => window.removeEventListener(EVENT_NAME, onConfirmed);
  }, []);
  useEffect(() => {
    if (!event) return;
    const timeout = window.setTimeout(() => setEvent(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [event]);
  if (!event) return null;
  return <ApprovedRoyalBanner asset="/assets/banners/06-cp-announcement.png" headline="تم تأكيد علاقة CP الملكية" detail={`${event.leftName} ♥ ${event.rightName} — ${event.typeLabel}`} badge={`LV ${event.level}`} />;
};
