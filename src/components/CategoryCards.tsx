import React from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { RoyalRoomRankBadge } from './RoyalRoomRankBadge';

/** Podium positions are decorative until verified leaderboard users are available. */
const Podium: React.FC = () => (
  <div className="mt-3 mb-1 flex w-full items-end justify-center gap-1" dir="rtl" aria-label="معاينة ترتيب المراكز الثلاثة">
    {([2, 1, 3] as const).map(rank => (
      <div key={rank} className={`relative flex shrink-0 flex-col items-center justify-center rounded-full border-2 bg-emerald-950/80 shadow-lg ${rank === 1 ? 'z-20 -translate-y-2 h-10 w-10 border-amber-300' : rank === 2 ? 'h-8 w-8 border-slate-300' : 'h-8 w-8 border-amber-700'}`}>
        <span className={`absolute -top-3 h-5 w-5 drop-shadow ${rank === 1 ? 'scale-110' : ''}`}><RoyalRoomRankBadge rank={rank}/></span>
        <span className="text-[8px] font-black text-amber-100">{rank === 1 ? 'TOP 1' : rank === 2 ? 'TOP 2' : 'TOP 3'}</span>
      </div>
    ))}
  </div>
);

export const CategoryCards: React.FC = () => {
  const { setOpenWealthLeaderboardModal, setLeaderboardTab, t, isRtl } = useApp();
  const cards = [
    { tab: 'wealth' as const, title: t.cardWealth, bg: 'from-[#14553e] via-[#0b4234] to-[#062a23]' },
    { tab: 'charm' as const, title: t.cardCharm, bg: 'from-[#135a4a] via-[#0b473c] to-[#052e29]' },
    { tab: 'room' as const, title: t.cardRoom, bg: 'from-[#0e674b] via-[#0b4935] to-[#052a21]' },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      {cards.map(card => (
        <button type="button" key={card.tab} onClick={() => { sounds.playClick(); setLeaderboardTab(card.tab); setOpenWealthLeaderboardModal(true); }} className={`relative flex min-w-0 flex-col items-center justify-between overflow-hidden rounded-2xl border-2 border-amber-400/70 bg-gradient-to-b ${card.bg} p-2 text-amber-100 shadow-lg transition active:scale-95`}>
          <span className="relative z-10 text-xs font-black">{card.title}</span>
          <Podium/>
          <span className="text-[9px] text-amber-200/80">عرض التصنيف</span>
        </button>
      ))}
    </div>
  );
};
