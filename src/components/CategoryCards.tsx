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
        <div className="w-full flex items-center justify-center -space-x-1 space-x-reverse mt-2 mb-1 z-10">
          {/* Rank 2 (Right) */}
          <div className="relative w-7 h-7 rounded-full border border-slate-300 p-0.5 bg-black/40 shrink-0 z-10">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80"
              alt="Rank 2"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥈</span>
          </div>

          {/* Rank 1 (Center) */}
          <div className="relative w-9 h-9 rounded-full border-2 border-amber-400 p-0.5 bg-black/40 shrink-0 z-20 shadow-[0_0_12px_rgba(251,191,36,0.8)] -mt-1 ring-1 ring-amber-300/60">
            <img
              src="/src/assets/images/noor_girl_cover_1790179137152.jpg"
              alt="Rank 1"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥇</span>
          </div>

          {/* Rank 3 (Left) */}
          <div className="relative w-7 h-7 rounded-full border border-amber-600 p-0.5 bg-black/40 shrink-0 z-10">
            <img
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&fit=crop&q=80"
              alt="Rank 3"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥉</span>
          </div>
        </div>
      </div>

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
        <div className="w-full flex items-center justify-center -space-x-1 space-x-reverse mt-2 mb-1 z-10">
          {/* Rank 2 (Right) */}
          <div className="relative w-7 h-7 rounded-full border border-slate-300 p-0.5 bg-black/40 shrink-0 z-10">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&fit=crop&q=80"
              alt="Rank 2"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥈</span>
          </div>

          {/* Rank 1 (Center) */}
          <div className="relative w-9 h-9 rounded-full border-2 border-amber-400 p-0.5 bg-black/40 shrink-0 z-20 shadow-[0_0_12px_rgba(251,191,36,0.8)] -mt-1 ring-1 ring-amber-300/60">
            <img
              src="/src/assets/images/noor_girl_cover_1790179137152.jpg"
              alt="Rank 1"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥇</span>
          </div>

          {/* Rank 3 (Left) */}
          <div className="relative w-7 h-7 rounded-full border border-amber-600 p-0.5 bg-black/40 shrink-0 z-10">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80"
              alt="Rank 3"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥉</span>
          </div>
        </div>
      </div>

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
        <div className="w-full flex items-center justify-center -space-x-1 space-x-reverse mt-2 mb-1 z-10">
          {/* Rank 2 (Right) */}
          <div className="relative w-7 h-7 rounded-full border border-slate-300 p-0.5 bg-black/40 shrink-0 z-10">
            <img
              src="/src/assets/images/oman_agency_cover_1790179177131.jpg"
              alt="Rank 2"
              className="w-full h-full rounded-xl object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥈</span>
          </div>

          {/* Rank 1 (Center) */}
          <div className="relative w-9 h-9 rounded-full border-2 border-amber-400 p-0.5 bg-black/40 shrink-0 z-20 shadow-[0_0_12px_rgba(251,191,36,0.8)] -mt-1 ring-1 ring-amber-300/60">
            <img
              src="/src/assets/images/noor_girl_cover_1790179137152.jpg"
              alt="Rank 1"
              className="w-full h-full rounded-xl object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥇</span>
          </div>

          {/* Rank 3 (Left) */}
          <div className="relative w-7 h-7 rounded-full border border-amber-600 p-0.5 bg-black/40 shrink-0 z-10">
            <img
              src="/src/assets/images/hekayat_qadar_cover_1790179154248.jpg"
              alt="Rank 3"
              className="w-full h-full rounded-xl object-cover"
            />
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] drop-shadow">🥉</span>
          </div>
        </div>
      </div>
    </div>
  );
};
