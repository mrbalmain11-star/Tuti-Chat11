import React from 'react';

export type IdentityBadgeKind = 'normal' | 'special' | 'admin';

const BADGE_ASSETS: Record<IdentityBadgeKind, { src: string; label: string }> = {
  normal: { src: '/assets/id-badges/id-normal-blue.png', label: 'معرّف عادي' },
  special: { src: '/assets/id-badges/id-special-pink.png', label: 'معرّف مميز' },
  admin: { src: '/assets/id-badges/id-admin-red.png', label: 'معرّف الإدارة' },
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
