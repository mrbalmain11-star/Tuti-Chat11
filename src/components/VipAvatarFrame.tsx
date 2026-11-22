import type { CSSProperties } from 'react';
import './VipAvatarFrame.css';

export function VipAvatarFrame({ level, preview = false }: { level?: number; preview?: boolean }) {
  if (level === undefined || !Number.isInteger(level) || level < 1 || level > 12) return null;

  const source = `/assets/vip/frames/vip${String(level).padStart(2, '0')}.webp`;
  return (
    <span className={`vip-avatar-frame ${preview ? 'vip-avatar-frame-preview' : ''}`}
      style={{ '--vip-frame-art': `url("${source}")` } as CSSProperties}
      role={preview ? 'img' : undefined} aria-label={preview ? `إطار VIP ${level}` : undefined}
      aria-hidden={preview ? undefined : true}>
      <img src={source} alt="" draggable={false} />
      <span className="vip-avatar-wing vip-avatar-wing-left" />
      <span className="vip-avatar-wing vip-avatar-wing-right" />
    </span>
  );
}
