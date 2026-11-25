import { Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function RoomLockBadge({ roomId, locked }: { roomId: string; locked?: boolean }) {
  const { rooms } = useApp();
  const value = rooms.find(room=>room.id===roomId)?.accessLocked ?? locked;
  return value ? <Lock className="ms-1 inline-block shrink-0 align-middle text-amber-400" size={14}
    role="img" aria-label="غرفة مقفلة"/> : null;
}
