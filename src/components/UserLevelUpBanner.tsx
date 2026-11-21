import { ApprovedRoyalBanner } from './ApprovedRoyalBanner';
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

type LevelEvent = { kind: 'wealth' | 'charm'; level: number };

/** Visual-only level announcement, based on authenticated server-refreshed profile levels. */
export const UserLevelUpBanner: React.FC = () => {
  const { currentUser, isLoggedIn } = useApp();
  const previous = useRef<{ id: string; wealth: number; charm: number } | null>(null);
  const [event, setEvent] = useState<LevelEvent | null>(null);
  useEffect(() => {
    if (!isLoggedIn || !currentUser.id) { previous.current = null; setEvent(null); return; }
    const wealth = Math.max(0, Math.trunc(currentUser.wealthLevel || 0));
    const charm = Math.max(0, Math.trunc(currentUser.charmLevel || 0));
    const old = previous.current;
    previous.current = { id: currentUser.id, wealth, charm };
    if (!old || old.id !== currentUser.id) { setEvent(null); return; }
    if (wealth > old.wealth) setEvent({ kind: 'wealth', level: wealth });
    else if (charm > old.charm) setEvent({ kind: 'charm', level: charm });
  }, [isLoggedIn, currentUser.id, currentUser.wealthLevel, currentUser.charmLevel]);

  useEffect(() => {
    if (!event) return;
    const timer = window.setTimeout(() => setEvent(null), 5500);
    return () => window.clearTimeout(timer);
  }, [event]);

    return <ApprovedRoyalBanner asset="/assets/banners/02-level-up-blue.png" headline="تهانينا! ارتفع مستواك" detail={`${event.kind === 'wealth' ? 'مستوى الثروة' : 'مستوى الجاذبية'} ${event.level}`} badge={`LV ${event.level}`} />;
};
