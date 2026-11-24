import type { ReactNode } from 'react';
import { Crown, UserRound, X } from 'lucide-react';
import { useConfirmedCpFrame } from '../services/cpFramePreference';
import { StoreAvatarFrame } from './StoreAvatarFrame';
import { CpWingAvatarFrame } from './CpWingAvatarFrame';
import { RoyalProfileFrame } from './RoyalProfileFrame';
import './room-profile-card.css';

export function RoomProfileAvatarFrame({ userId, name, isSelf }: { userId: string; name: string; isSelf: boolean }) {
  const cpFrame = useConfirmedCpFrame(userId);
  if (cpFrame) return <CpWingAvatarFrame enabled name={name} />;
  return <StoreAvatarFrame userId={userId} fallback={isSelf ? <RoyalProfileFrame /> : null} />;
}

export function RoomProfileCard({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return <div className="room-profile-overlay" dir="rtl" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="الملف الشخصي" className="room-profile-card" onClick={event => event.stopPropagation()}>
      <div className="room-profile-crown" aria-hidden="true"><span /><Crown /><span /></div>
      <div className="room-profile-content">
        <header className="room-profile-header">
          <button type="button" onClick={onClose} aria-label="إغلاق الملف الشخصي"><X size={19} /></button>
          <span><UserRound size={15} />الملف الشخصي</span>
        </header>
        {children}
      </div>
      <span className="room-profile-jewel" aria-hidden="true" />
    </section>
  </div>;
}
