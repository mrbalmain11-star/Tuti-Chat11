import React from 'react';
import { Search, Plus, DoorOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

export const Header: React.FC = () => {
  const {
    homeSubTab,
    setHomeSubTab,
    setOpenSearchModal,
    setOpenCreateRoomModal,
    t,
    isRtl,
  } = useApp();

  return (
    <header
      className="sticky top-0 z-30 bg-gradient-to-b from-[#25be8e] via-[#1db184] to-[#17976e] text-white px-4 pt-3 pb-2 transition-all shadow-md select-none relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Islamic background pattern texture */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
      
      {/* Hanging lanterns and stars top row matching screenshot */}
      <div className="absolute top-0.5 left-0 right-0 flex justify-around opacity-30 text-amber-200 text-xs pointer-events-none">
        <span>🏮</span>
        <span>✦</span>
        <span>🏮</span>
        <span>✦</span>
        <span>🏮</span>
        <span>✦</span>
        <span>🏮</span>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        {/* Right side in RTL: Navigation Tabs (حفلة | ملكي | اكتشف - Matches Screenshot 1:1) */}
        <div className="flex items-center gap-4">
          {/* Tab 1: Party */}
          <button
            onClick={() => {
              sounds.playClick();
              setHomeSubTab('party');
            }}
            className={`relative text-lg font-black tracking-wide transition active:scale-95 cursor-pointer pb-0.5 ${
              homeSubTab === 'party'
                ? 'text-[#064e3b] font-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
                : 'text-[#064e3b]/60 hover:text-[#064e3b]'
            }`}
          >
            <span>{t.tabParty}</span>
            {homeSubTab === 'party' && (
              <span className="absolute -bottom-0.5 right-1/2 translate-x-1/2 w-4 h-0.5 bg-[#064e3b] rounded-full" />
            )}
          </button>

          {/* Tab 2: Royal */}
          <button
            onClick={() => {
              sounds.playClick();
              setHomeSubTab('royal');
            }}
            className={`text-base font-bold transition active:scale-95 cursor-pointer pb-0.5 ${
              homeSubTab === 'royal'
                ? 'text-[#064e3b] font-black'
                : 'text-[#064e3b]/60 hover:text-[#064e3b]'
            }`}
          >
            <span>{t.tabRoyal}</span>
            {homeSubTab === 'royal' && (
              <span className="absolute -bottom-0.5 right-1/2 translate-x-1/2 w-4 h-0.5 bg-[#064e3b] rounded-full" />
            )}
          </button>

          {/* Tab 3: Discover */}
          <button
            onClick={() => {
              sounds.playClick();
              setHomeSubTab('discover');
            }}
            className={`text-base font-bold transition active:scale-95 cursor-pointer pb-0.5 ${
              homeSubTab === 'discover'
                ? 'text-[#064e3b] font-black'
                : 'text-[#064e3b]/60 hover:text-[#064e3b]'
            }`}
          >
            <span>{t.tabDiscover}</span>
            {homeSubTab === 'discover' && (
              <span className="absolute -bottom-0.5 right-1/2 translate-x-1/2 w-4 h-0.5 bg-[#064e3b] rounded-full" />
            )}
          </button>
        </div>

        {/* Left side in RTL: Action Icons (Mosque Plus + Search matching screenshot 1:1) */}
        <div className="flex items-center gap-3">
          {/* Golden/Emerald Magnifying Glass Search Button (🔍) */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenSearchModal(true);
            }}
            className="w-9 h-9 rounded-xl border border-white/35 bg-white/15 text-white shadow-sm flex items-center justify-center transition active:scale-90 cursor-pointer"
            title="بحث"
          >
            <Search size={21} strokeWidth={2.2} aria-hidden="true" />
          </button>

          {/* Golden Palace / Mosque with Plus Button (🕌➕) */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenCreateRoomModal(true);
            }}
            className="relative w-9 h-9 rounded-xl border border-amber-200/65 bg-gradient-to-br from-amber-300 to-amber-500 text-emerald-950 shadow-sm flex items-center justify-center transition active:scale-90 cursor-pointer group"
            title="إنشاء غرفة"
          >
            <DoorOpen size={21} strokeWidth={2.1} aria-hidden="true" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border border-white text-emerald-950 flex items-center justify-center shadow-sm">
              <Plus size={11} strokeWidth={3} aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
