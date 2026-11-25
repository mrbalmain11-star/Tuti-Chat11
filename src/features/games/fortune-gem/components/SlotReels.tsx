import React, { useState, useEffect, useRef } from 'react';
import { SymbolId, SpecialSymbolId, WinningLine } from '../types/game';
import { SymbolTile, SpecialSymbolTile } from './SymbolTile';

const ALL_SYMBOLS: SymbolId[] = ['WILD', 'GEM_RED', 'GEM_BLUE', 'GEM_GREEN', 'A', 'K', 'Q', 'J'];
const ALL_SPECIAL_NORMAL: SpecialSymbolId[] = ['1x', '2x', '3x', '5x', '10x', '15x', 'WHEEL'];
const ALL_SPECIAL_EX: SpecialSymbolId[] = ['2x', '3x', '5x', '10x', '15x', 'WHEEL'];

interface SlotReelsProps {
  grid: SymbolId[][];
  specialReel: SpecialSymbolId[];
  isSpinning: boolean;
  reelSpinningState: boolean[];
  winningLines: WinningLine[];
  isExActive: boolean;
  onToggleEx: () => void;
  onOpenExHelp: () => void;
  bannerMessage: string;
  winDisplayAmount: number;
}

export const SlotReels: React.FC<SlotReelsProps> = ({
  grid,
  specialReel,
  isSpinning,
  reelSpinningState,
  winningLines,
  isExActive,
  onToggleEx,
  onOpenExHelp,
  bannerMessage,
  winDisplayAmount,
}) => {
  const [exToast, setExToast] = useState<string | null>(null);
  const exToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spinTick, setSpinTick] = useState<number>(0);

  const anyReelSpinning = reelSpinningState.some(Boolean);

  useEffect(() => {
    if (!anyReelSpinning) return;
    const interval = setInterval(() => {
      setSpinTick((t) => (t + 1) % 1000);
    }, 65);
    return () => clearInterval(interval);
  }, [anyReelSpinning]);

  useEffect(() => {
    return () => {
      if (exToastTimerRef.current) clearTimeout(exToastTimerRef.current);
    };
  }, []);

  const handleExClick = () => {
    onToggleEx();
    const nextState = !isExActive;
    setExToast(nextState ? 'تم تشغيل وظيفة EX' : 'تم إيقاف وظيفة EX');
    if (exToastTimerRef.current) clearTimeout(exToastTimerRef.current);
    exToastTimerRef.current = setTimeout(() => setExToast(null), 2000);
  };

  const getDisplaySymbol = (reelIdx: number, rowIdx: number): SymbolId => {
    if (!reelSpinningState[reelIdx]) return grid[reelIdx][rowIdx];
    const idx = (spinTick + reelIdx * 3 + rowIdx * 2) % ALL_SYMBOLS.length;
    return ALL_SYMBOLS[idx];
  };

  const getDisplaySpecial = (rowIdx: number): SpecialSymbolId => {
    if (!reelSpinningState[3]) return specialReel[rowIdx];
    const pool = isExActive ? ALL_SPECIAL_EX : ALL_SPECIAL_NORMAL;
    return pool[(spinTick + rowIdx * 2) % pool.length];
  };

  const isTileWinning = (reelIdx: number, rowIdx: number) => {
    if (isSpinning || reelSpinningState[reelIdx]) return false;
    return winningLines.some((wl) =>
      wl.coords.some(([r, row]) => r === reelIdx && row === rowIdx)
    );
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none px-1">
      
      {/* Upper Stone Lintel Structure (matching IMG-20261008-WA0081.jpg) */}
      <div className="relative grid grid-cols-12 gap-1 mb-1">
        
        {/* Main Reels Dynamic Red/Gold Lintel Ribbon (Cols 1 to 9) */}
        <div
          className="col-span-9 relative rounded-t-sm py-1 px-2 shadow flex items-center justify-between overflow-hidden min-h-[30px]"
          style={{
            background: 'linear-gradient(90deg, #6b2216 0%, #8d2e1f 50%, #6b2216 100%)',
            borderTop: '2px solid #d4af37',
            borderLeft: '2px solid #d4af37',
            borderRight: '2px solid #d4af37',
          }}
        >
          {/* Text message */}
          <span className="font-black text-[11px] sm:text-xs text-yellow-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate text-right flex-1">
            {bannerMessage}
          </span>
          {/* EX Badge on the right side of the ribbon (matching IMG-20261008-WA0081.jpg) */}
          <div className="mr-1 flex items-center bg-gradient-to-r from-amber-400 to-red-600 px-1 py-[1px] rounded text-[9px] font-black text-stone-950 border border-yellow-200 shadow shrink-0">
            EX
          </div>
        </div>

        {/* Special Reel Header Plaque (Cols 10 to 12) */}
        <div
          className="col-span-3 relative rounded-t-sm py-0.5 flex flex-col items-center justify-center text-center shadow"
          style={{
            background: 'linear-gradient(180deg, #782618 0%, #4a150d 100%)',
            borderTop: '2px solid #d4af37',
            borderLeft: '2px solid #d4af37',
            borderRight: '2px solid #d4af37',
          }}
        >
          <span className="text-[10px] font-black text-amber-200 leading-tight">الفوز</span>
          <span className="text-[10px] font-black text-amber-200 leading-tight">مضاعف</span>
        </div>

      </div>

      {/* Main Temple Stone Structure (Warm Sandstone Architecture matching IMG-20261008-WA0081.jpg) */}
      <div
        className="relative rounded-sm p-1 sm:p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.95)]"
        style={{
          background: 'linear-gradient(180deg, #3d2414 0%, #29160a 100%)',
          border: '3.5px solid #a87944',
        }}
      >
        
        {/* Carved Sandstone Columns on Left and Right (Warm Sandstone matching IMG-20261008-WA0081.jpg) */}
        <div
          className="absolute -left-3 top-0 bottom-0 w-4 rounded-l border-y-2 border-l-2 border-[#b88c56] shadow-lg flex flex-col justify-between py-1"
          style={{
            background: 'linear-gradient(90deg, #caa77c 0%, #e0c5a2 40%, #a88358 100%)',
          }}
        >
          <div className="w-full h-3 bg-[#8c673e] rounded-tl-sm shadow" />
          {/* Vertical fluting ridges */}
          <div className="w-0.5 h-16 bg-[#78532c]/40 mx-auto" />
          <div className="w-full h-3 bg-[#8c673e] rounded-bl-sm shadow" />
        </div>
        <div
          className="absolute -right-3 top-0 bottom-0 w-4 rounded-r border-y-2 border-r-2 border-[#b88c56] shadow-lg flex flex-col justify-between py-1"
          style={{
            background: 'linear-gradient(270deg, #caa77c 0%, #e0c5a2 40%, #a88358 100%)',
          }}
        >
          <div className="w-full h-3 bg-[#8c673e] rounded-tr-sm shadow" />
          <div className="w-0.5 h-16 bg-[#78532c]/40 mx-auto" />
          <div className="w-full h-3 bg-[#8c673e] rounded-br-sm shadow" />
        </div>

        {/* Reels Container: 3 Standard Reels + 1 Special Multiplier Reel */}
        <div className="relative grid grid-cols-12 gap-1 items-stretch">
          
          {/* Main 3 Reels Area (cols 1 to 9) */}
          <div
            className="col-span-9 relative grid grid-cols-3 gap-1 rounded-sm p-1 shadow-inner"
            style={{
              background: '#1a0e06',
              border: '2px solid #8c6035',
            }}
          >
            
            {/* Reel 0 */}
            <div className={`flex flex-col gap-1 transition-all duration-150 ${reelSpinningState[0] ? 'blur-[1px] translate-y-0.5' : ''}`}>
              {[0, 1, 2].map((rowIdx) => (
                <div key={rowIdx} className="h-21 sm:h-25">
                  <SymbolTile
                    symbol={getDisplaySymbol(0, rowIdx)}
                    isWinning={isTileWinning(0, rowIdx)}
                  />
                </div>
              ))}
            </div>

            {/* Reel 1 */}
            <div className={`flex flex-col gap-1 transition-all duration-150 ${reelSpinningState[1] ? 'blur-[1px] -translate-y-0.5' : ''}`}>
              {[0, 1, 2].map((rowIdx) => (
                <div key={rowIdx} className="h-21 sm:h-25">
                  <SymbolTile
                    symbol={getDisplaySymbol(1, rowIdx)}
                    isWinning={isTileWinning(1, rowIdx)}
                  />
                </div>
              ))}
            </div>

            {/* Reel 2 */}
            <div className={`flex flex-col gap-1 transition-all duration-150 ${reelSpinningState[2] ? 'blur-[1px] translate-y-0.5' : ''}`}>
              {[0, 1, 2].map((rowIdx) => (
                <div key={rowIdx} className="h-21 sm:h-25">
                  <SymbolTile
                    symbol={getDisplaySymbol(2, rowIdx)}
                    isWinning={isTileWinning(2, rowIdx)}
                  />
                </div>
              ))}
            </div>

            {/* EX Status Notification Toast across reels (Video 1 at 0:06) */}
            {exToast && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-fade-in">
                <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#991b1b] border-2 border-yellow-300 shadow-[0_4px_20px_rgba(0,0,0,0.95)] flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-stone-950 font-black text-xs">EX</span>
                  <span className="font-black text-base text-yellow-200 drop-shadow">
                    {exToast}
                  </span>
                </div>
              </div>
            )}

            {/* Mid-Reel Win Plaque (matching IMG-20261008-WA0115.jpg) */}
            {winningLines.length > 0 && !isSpinning && winDisplayAmount > 0 && !exToast && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
                <div className="relative flex items-center justify-center filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                  {/* Ornate Golden Winged Backing Frame */}
                  <div className="absolute -inset-x-6 -inset-y-2 flex items-center justify-between pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border border-yellow-100 shadow -mr-2" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tl from-amber-600 to-yellow-300 border border-yellow-100 shadow -ml-2" />
                  </div>
                  {/* Main Crimson Plaque */}
                  <div
                    className="relative z-10 px-6 py-1.5 rounded-lg border-2 border-[#facc15] shadow-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(90deg, #781d13 0%, #991b1b 50%, #781d13 100%)',
                      boxShadow: 'inset 0 1px 2px rgba(254,240,138,0.5), 0 4px 15px rgba(0,0,0,0.9)',
                    }}
                  >
                    <span className="font-black text-2xl sm:text-3xl text-yellow-300 font-mono tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {winDisplayAmount.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* The EXACT EX Bar Capsule from IMG-20261008-WA0081.jpg at bottom left */}
            <div className="absolute -bottom-3.5 -left-1.5 z-40 flex items-center gap-1">
              
              {/* EX Star Badge */}
              <div
                onClick={handleExClick}
                className="w-9 h-8 sm:w-10 sm:h-9 relative cursor-pointer active:scale-95 transition-transform flex items-center justify-center filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
              >
                <svg viewBox="0 0 60 50" className="w-full h-full">
                  <polygon
                    points="30,2 58,14 58,36 30,48 2,36 2,14"
                    fill={isExActive ? '#dc2626' : '#78350f'}
                    stroke="#fde047"
                    strokeWidth="2.5"
                  />
                  <line x1="38" y1="14" x2="48" y2="6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <polygon points="44,5 50,5 50,11" fill="#ffffff" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-black text-sm text-yellow-200 drop-shadow">
                  EX
                </span>
              </div>

              {/* Connected EX Capsule Bar [ بكرة إضافية | ➡ OFF/ON | ? ] */}
              <div className="flex items-center bg-[#290d08] border border-[#d4af37] rounded-full px-1.5 py-0.5 shadow-lg gap-1">
                <span className="text-[9px] font-black text-yellow-200 px-0.5 whitespace-nowrap">
                  بكرة إضافية
                </span>

                {/* ON / OFF Switch */}
                <button
                  type="button"
                  onClick={handleExClick}
                  className={`flex items-center gap-0.5 px-1.5 py-[1px] rounded-full border text-[9px] font-black cursor-pointer transition-all active:scale-90 ${
                    isExActive
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 border-white text-stone-950 shadow-[0_0_8px_#facc15]'
                      : 'bg-[#45130b] border-yellow-500/60 text-yellow-300'
                  }`}
                >
                  <span className="text-[8px]">➡</span>
                  <span>{isExActive ? 'ON' : 'OFF'}</span>
                </button>

                {/* Question mark help button */}
                <button
                  type="button"
                  onClick={onOpenExHelp}
                  className="w-3.5 h-3.5 rounded-full bg-red-800 border border-yellow-300 text-[9px] font-black text-yellow-200 flex items-center justify-center hover:bg-red-700 cursor-pointer"
                >
                  ?
                </button>
              </div>

            </div>

          </div>

          {/* Special Reel (Reel 4) Area (cols 10 to 12) */}
          <div
            className="col-span-3 relative flex flex-col rounded-sm p-1 shadow-inner"
            style={{
              background: '#1f1107',
              border: '2px solid #b45309',
            }}
          >
            <div className={`flex flex-col gap-1 transition-all duration-150 ${reelSpinningState[3] ? 'blur-[1px] -translate-y-0.5' : ''}`}>
              
              {/* Row 0 (Top) */}
              <div className="h-21 sm:h-25">
                <SpecialSymbolTile symbol={getDisplaySpecial(0)} />
              </div>

              {/* Row 1 (Center - DETERMINING MULTIPLIER with Glowing Gold Frame!) */}
              <div className="h-21 sm:h-25 relative">
                <SpecialSymbolTile
                  symbol={getDisplaySpecial(1)}
                  isSelectedCenter={true}
                  isWinning={!reelSpinningState[3] && winningLines.length > 0}
                  isExActive={isExActive}
                />
              </div>

              {/* Row 2 (Bottom) */}
              <div className="h-21 sm:h-25">
                <SpecialSymbolTile symbol={getDisplaySpecial(2)} />
              </div>

            </div>
          </div>

        </div>

        {/* Stepped Sandstone Stairs (3 tiers matching IMG-20261008-WA0081.jpg) */}
        <div className="mt-2 flex flex-col gap-0.5">
          <div className="h-1.5 bg-gradient-to-r from-[#8f6e45] via-[#b59265] to-[#8f6e45] rounded-sm border-t border-[#dfbe95] shadow-sm" />
          <div className="h-1.5 bg-gradient-to-r from-[#7a5a35] via-[#9e7d52] to-[#7a5a35] rounded-sm border-t border-[#c4a277] shadow-sm" />
          <div className="h-2 bg-gradient-to-r from-[#634526] via-[#85633a] to-[#634526] rounded-sm border-t border-[#a6845a] shadow-sm" />
        </div>

      </div>

    </div>
  );
};
