import React from 'react';

/** Presentation only. A room level must come from a verified backend event, never room rank or gift totals. */
export type VerifiedRoomLevelUp = {
  roomId: string;
  roomName: string;
  level: number;
};

export const RoomLevelUpBanner: React.FC<{ event: VerifiedRoomLevelUp | null }> = ({ event }) => {
  if (!event || !event.roomId || !Number.isSafeInteger(event.level) || event.level < 1) return null;
  return <div role="status" aria-live="polite" dir="rtl" className="pointer-events-none fixed inset-x-3 top-[max(76px,env(safe-area-inset-top))] z-[91] mx-auto max-w-sm">
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#dfb8ff] bg-gradient-to-r from-[#210c48] via-[#6e31a9] to-[#30105c] px-4 py-3 shadow-[0_12px_38px_rgba(111,48,168,.5)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 drop-shadow-[0_0_12px_#d8a0ff]" role="img" aria-label="صاروخ ترقية الغرفة">
          <path d="M19 45 Q10 53 10 61 Q22 58 27 49 Z" fill="#ff9c48"/>
          <path d="M21 46 Q16 52 17 57 Q24 53 25 49 Z" fill="#fff2a4"/>
          <path d="M18 43 Q18 25 46 7 Q54 25 35 46 L26 51 Z" fill="#e9d1ff" stroke="#ae78d6" strokeWidth="2"/>
          <path d="M32 16 Q40 10 46 7 Q49 16 44 25 Z" fill="#a761e2"/>
          <circle cx="34" cy="30" r="7" fill="#592385" stroke="#eecaff" strokeWidth="2"/>
          <path d="M31 30 L34 25 L37 30 L34 35 Z" fill="#f9d2ff"/>
          <path d="M18 43 L10 43 L15 34 L23 31 M30 49 L31 56 L41 50 L42 40" fill="#ae71dc" stroke="#f0d3ff" strokeWidth="1.5"/>
          <path d="M7 15 L9 20 L14 22 L9 24 L7 29 L5 24 L1 22 L5 20 Z M52 39 L54 43 L59 45 L54 47 L52 51 L50 47 L46 45 L50 43 Z" fill="#ffe9ff"/>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-purple-100">تهانينا! ارتفع مستوى الغرفة</div>
          <div className="mt-1 truncate text-sm font-black text-white">{event.roomName}</div>
          <div className="text-lg font-black text-[#f4d5ff]">المستوى {event.level}</div>
        </div>
        <span className="rounded-xl border border-purple-200 bg-white/10 px-2 py-1 text-sm font-black text-white">LV {event.level}</span>
      </div>
    </div>
  </div>;
};
