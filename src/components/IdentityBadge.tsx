import React, { useEffect, useState } from 'react';
import { fetchIdentityBadgeKind, type IdentityBadgeKind } from '../services/stagingBackend';

export function useIdentityBadgeKind(userId: string | null) {
  const [verifiedBadge, setVerifiedBadge] = useState<{ userId: string; kind: IdentityBadgeKind } | null>(null);
  useEffect(() => {
    setVerifiedBadge(null);
    if (!userId) return;
    let active = true;
    void fetchIdentityBadgeKind(userId).then(kind => {
      if (active && kind) setVerifiedBadge({ userId, kind });
    }).catch(error => console.warn('Verified ID badge unavailable:', error));
    return () => { active = false; };
  }, [userId]);
  return verifiedBadge?.userId === userId ? verifiedBadge.kind : null;
}

const BADGE_ASSETS: Record<IdentityBadgeKind, { src: string; label: string }> = {
  normal: { src: '/assets/id-badges/3.png', label: 'معرّف عادي' },
  special: { src: '/assets/id-badges/2.png', label: 'معرّف مميز' },
  admin: { src: '/assets/id-badges/1.png', label: 'معرّف الإدارة' },
};

export const IdentityBadge: React.FC<{ kind: IdentityBadgeKind; size?: number }> = ({ kind, size = 22 }) => {
  const badge = BADGE_ASSETS[kind];
  return (
    <img
      src={badge.src}
      alt={badge.label}
      title={badge.label}
      width={size}
      height={size}
      className="inline-block shrink-0 object-contain align-middle"
      loading="eager"
    />
  );
};
