import React from 'react';
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
            className="w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer"
            title="بحث"
          >
            <span className="text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">🔍</span>
          </button>

          {/* Golden Palace / Mosque with Plus Button (🕌➕) */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenCreateRoomModal(true);
            }}
            className="relative w-8 h-8 flex items-center justify-center transition active:scale-90 cursor-pointer group"
            title="إنشاء غرفة"
          >
            <img
              src="/src/assets/images/nav_home_mosque_1790179628609.jpg"
              alt="إنشاء غرفة"
              className="w-8 h-8 object-cover rounded-lg drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)] group-hover:scale-105 transition"
            />
            {/* Green Plus Badge on Mosque */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10b981] border-2 border-white text-white flex items-center justify-center text-[10px] font-black leading-none shadow-md">
              +
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
