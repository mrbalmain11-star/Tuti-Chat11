import React from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const CategoryCards: React.FC = () => {
  const { setOpenWealthLeaderboardModal, setLeaderboardTab, t, isRtl } = useApp();

  return (
    <div className="px-4 py-2 grid grid-cols-3 gap-2 select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Wealth Card */}
      <div
        onClick={() => {
          sounds.playClick();
          setLeaderboardTab('wealth');
          setOpenWealthLeaderboardModal(true);
        }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#7A1515] via-[#5C0F0F] to-[#3B0909] p-2 flex flex-col items-center justify-between shadow-lg border-2 border-amber-400/70 hover:border-amber-300 transition-all active:scale-95 cursor-pointer group shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
      >
        {/* Subtle Warm Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:10px_10px] opacity-20 pointer-events-none" />
        
        <div className="w-full flex items-center justify-center text-xs font-black text-amber-200 tracking-wide drop-shadow pointer-events-none z-10">
          {t.cardWealth}
        </div>

        {/* 3 Podium Avatars */}
        <div className="flex items-center justify-center mt-2 mb-1 text-amber-200/80" aria-label="التصنيف بدون بيانات ترتيب مفبركة"><span className="text-2xl">✦</span></div>
      </div></div>

      {/* 2. الجاذبية (Charm Card - Center in RTL, Royal Gold & Sapphire) */}
      <div
        onClick={() => {
          sounds.playClick();
          setLeaderboardTab('charm');
          setOpenWealthLeaderboardModal(true);
        }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#123E6E] via-[#0E2E52] to-[#091D33] p-2 flex flex-col items-center justify-between shadow-lg border-2 border-amber-400/70 hover:border-amber-300 transition-all active:scale-95 cursor-pointer group shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
      >
        {/* Subtle Warm Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:10px_10px] opacity-20 pointer-events-none" />
        
        <div className="w-full flex items-center justify-center text-xs font-black text-amber-200 tracking-wide drop-shadow pointer-events-none z-10">
          {t.cardCharm}
        </div>

        {/* 3 Podium Avatars */}
        <div className="flex items-center justify-center mt-2 mb-1 text-amber-200/80" aria-label="التصنيف بدون بيانات ترتيب مفبركة"><span className="text-2xl">✦</span></div>
      </div></div>

      {/* 3. Room Card */}
      <div
        onClick={() => {
          sounds.playClick();
          setLeaderboardTab('room');
          setOpenWealthLeaderboardModal(true);
        }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0F543C] via-[#0A3D2C] to-[#06261B] p-2 flex flex-col items-center justify-between shadow-lg border-2 border-amber-400/70 hover:border-amber-300 transition-all active:scale-95 cursor-pointer group shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
      >
        {/* Subtle Warm Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:10px_10px] opacity-20 pointer-events-none" />
        
        <div className="w-full flex items-center justify-center text-xs font-black text-amber-200 tracking-wide drop-shadow pointer-events-none z-10">
          {t.cardRoom}
        </div>

        {/* 3 Podium Avatars */}
        <div className="flex items-center justify-center mt-2 mb-1 text-amber-200/80" aria-label="التصنيف بدون بيانات ترتيب مفبركة"><span className="text-2xl">✦</span></div>
      </div></div>
    </div>
  );
};
