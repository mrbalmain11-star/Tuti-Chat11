import { ApprovedRoyalBanner } from './ApprovedRoyalBanner';
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

/** Announces only an increase in the server-refreshed VIP entitlement, never a local purchase claim. */
export const VipActivationBanner: React.FC = () => {
  const { currentUser, isLoggedIn } = useApp();
  const last = useRef<{ id: string; tier: number } | null>(null);
  const [tier, setTier] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !currentUser.id) { last.current = null; setTier(null); return; }
    const activeTier = currentUser.vipExpiry && Date.parse(currentUser.vipExpiry) <= Date.now()
      ? 0 : Math.max(0, Math.trunc(currentUser.vipLevel || 0));
    const previous = last.current;
    last.current = { id: currentUser.id, tier: activeTier };
    if (!previous || previous.id !== currentUser.id) { setTier(null); return; }
    if (activeTier > previous.tier && activeTier <= 10) setTier(activeTier);
  }, [isLoggedIn, currentUser.id, currentUser.vipLevel, currentUser.vipExpiry]);

  useEffect(() => {
    if (tier === null) return;
    const timeout = window.setTimeout(() => setTier(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [tier]);

  if (tier === null) return null;
  return <ApprovedRoyalBanner asset="/assets/banners/03-vip-gold.png" headline="تهانينا! تم تفعيل امتياز VIP" detail={`VIP ${tier}`} badge={`VIP ${tier}`} />;
};
