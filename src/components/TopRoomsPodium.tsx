import React from 'react';
import { VoiceRoom } from '../types';
import { RoomCard } from './RoomCard';

/** RTL podium: rank 2 right, rank 1 raised in the center, rank 3 left. */
export const TopRoomsPodium: React.FC<{ rooms: VoiceRoom[] }> = ({ rooms }) => {
  const ranked = ([2, 1, 3] as const).map(rank => ({ rank, room: rooms.find(room => room.rank === rank) }));
  if (!ranked.some(item => item.room)) return null;
  return (
    <section className="px-3 pt-5 pb-2" dir="rtl" aria-label="أفضل ثلاث غرف">
      <h2 className="mb-6 text-center text-sm font-black text-amber-800">أفضل ثلاث غرف</h2>
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
        {ranked.map(({ rank, room }) => (
          <div key={rank} className={`min-w-0 ${rank === 1 ? 'relative -translate-y-3 z-10' : 'relative z-0'}`}>
            {room ? <RoomCard room={room} /> : (
              <div className="aspect-square rounded-2xl border border-amber-200/60 bg-amber-50/40" aria-label={`المركز ${rank} غير محدد`} />
            )}
            <div className={`mt-1 text-center text-xs font-black ${rank === 1 ? 'text-amber-700' : rank === 2 ? 'text-sky-700' : 'text-rose-700'}`}>
              TOP {rank}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
