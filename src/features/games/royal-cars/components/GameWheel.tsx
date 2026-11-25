import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { CarId, CARS, WHEEL_SLOTS, GamePhase, BetMap } from '../types/game';
import { CarLogoComponent } from './CarLogos';

interface GameWheelProps {
  currentSlotIndex: number;
  winnerSlotIndex: number | null;
  phase: GamePhase;
  countdown: number;
  userBets: BetMap;
  tableBets: BetMap;
  selectedChip: number;
  onPlaceBet: (carId: CarId) => void;
  isSpinning: boolean;
}

// 5 rows x 2 columns matching the exact positions in Screenshot 1
const INNER_GRID_ROWS: Array<{ left: CarId; right: CarId }> = [
  { left: 'vw', right: 'bmw' },             // Row 1: VW x2 | x5 BMW
  { left: 'mercedes', right: 'jaguar' },     // Row 2: Mercedes x8 | x18 Jaguar
  { left: 'ferrari', right: 'lamborghini' }, // Row 3: Ferrari x66 | x50 Lamborghini
  { left: 'bugatti', right: 'bentley' },     // Row 4: Bugatti x100 | x88 Bentley
  { left: 'porsche', right: 'landrover' },   // Row 5: Porsche x30 | x20 Land Rover
];

export const GameWheel: React.FC<GameWheelProps> = ({
  currentSlotIndex,
  winnerSlotIndex,
  phase,
  countdown,
  userBets,
  tableBets,
  onPlaceBet,
  isSpinning,
}) => {
  const totalSlots = WHEEL_SLOTS.length; // 16

  // Coordinates for the 16 perimeter slots around 360 degrees
  const perimeterSlots = useMemo(() => {
    const radius = 162; // px on 370x370 viewBox
    const center = 185;

    return WHEEL_SLOTS.map((carId, idx) => {
      // 0 starts at top (12 o'clock, -90 degrees)
      const angleDeg = (idx / totalSlots) * 360 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);

      return {
        idx,
        carId,
        x,
        y,
        angleDeg,
      };
    });
  }, [totalSlots]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 0)}K`;
    return num.toLocaleString("en-US");
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none px-2 flex flex-col items-center">
      {/* Container of the circular wheel with social & timer side widgets */}
      <div className="relative w-full aspect-square max-w-[370px] flex items-center justify-center">
        {/* Left Widget: Orange Social Room Button with 3 avatars (Image 1) */}
        <div className="absolute -left-2 sm:left-0 top-[26%] -translate-y-1/2 z-40">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#f59e0b] to-[#d97706] border-2 border-[#fef08a] shadow-[0_0_12px_rgba(245,158,11,0.6)] flex items-center justify-center text-slate-900 cursor-pointer hover:scale-105 active:scale-95 transition-transform">
            <Users className="w-5 h-5 fill-slate-900 stroke-slate-900" />
          </div>
        </div>

        {/* Right Widget: Green Alarm Clock (Image 1) */}
        <div className="absolute -right-2 sm:right-0 top-[26%] -translate-y-1/2 z-40 flex flex-col items-center">
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] border-2 border-[#86efac] shadow-[0_0_15px_rgba(34,197,94,0.6)] flex items-center justify-center text-white">
            {/* Clock bells */}
            <div className="absolute -top-1.5 -left-1 w-3.5 h-2 bg-[#86efac] rounded-t-full -rotate-45" />
            <div className="absolute -top-1.5 -right-1 w-3.5 h-2 bg-[#86efac] rounded-t-full rotate-45" />

            {/* Inner Clock Face */}
            <div className="w-8 h-8 rounded-full bg-[#15803d] border border-emerald-300 flex items-center justify-center">
              {phase === 'SPINNING' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-base font-black font-['Outfit'] tracking-tight drop-shadow">
                  {countdown}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Outer Circular Indigo/Violet Plate */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#1b1c44] via-[#141639] to-[#0f112c] border-2 border-indigo-500/40 shadow-[0_0_40px_rgba(30,27,75,0.8)]" />

        {/* Outer Perimeter Light Rings SVG */}
        <svg
          viewBox="0 0 370 370"
          className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
        >
          {/* Subtle outer neon ring */}
          <circle
            cx="185"
            cy="185"
            r="178"
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="3 4"
            opacity="0.4"
          />
          <circle
            cx="185"
            cy="185"
            r="148"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1"
            opacity="0.3"
          />

          {/* Active / Winning Slot Highlighting Indicator */}
          {perimeterSlots.map((slot) => {
            const isCurrent = currentSlotIndex === slot.idx;
            const isWinner = winnerSlotIndex === slot.idx && phase === 'RESULT';

            if (!isCurrent && !isWinner) return null;

            return (
              <g key={`indicator-${slot.idx}`}>
                <circle
                  cx={slot.x}
                  cy={slot.y}
                  r="23"
                  fill={isWinner ? 'rgba(250, 204, 21, 0.45)' : 'rgba(239, 68, 68, 0.45)'}
                  stroke={isWinner ? '#FACC15' : '#EF4444'}
                  strokeWidth="3.5"
                  className={isWinner ? 'animate-ping' : ''}
                />
                <circle
                  cx={slot.x}
                  cy={slot.y}
                  r="20"
                  fill="none"
                  stroke={isWinner ? '#FEF08A' : '#FCA5A5'}
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* 16 Perimeter Badges along the wheel circle */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {perimeterSlots.map((slot) => {
            const isCurrent = currentSlotIndex === slot.idx;
            const isWinner = winnerSlotIndex === slot.idx && phase === 'RESULT';

            return (
              <div
                key={`slot-${slot.idx}`}
                style={{
                  left: `${(slot.x / 370) * 100}%`,
                  top: `${(slot.y / 370) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all duration-75 ${
                  isWinner
                    ? 'ring-4 ring-yellow-400 bg-amber-400/40 scale-125 z-40 shadow-[0_0_20px_#facc15]'
                    : isCurrent
                    ? 'ring-3 ring-rose-400 bg-rose-500/40 scale-115 z-30 shadow-[0_0_15px_#f43f5e]'
                    : 'bg-slate-900/95 ring-1 ring-slate-600/60'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <CarLogoComponent carId={slot.carId} className="w-full h-full object-contain drop-shadow" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Inner Center Circle: Deep Wine-Red Velvet Table Plate (Matching Image 1) */}
        <div className="relative z-30 w-[69%] h-[69%] rounded-full bg-gradient-to-b from-[#bd1e54] via-[#9e1644] to-[#6d092a] border-[2.5px] border-pink-400/40 shadow-[inset_0_0_30px_rgba(0,0,0,0.6),0_0_20px_rgba(190,24,93,0.3)] flex flex-col justify-center items-center p-2 overflow-hidden">
          {/* Subtle inner gold/pink decorative rings */}
          <div className="absolute inset-1.5 rounded-full border border-pink-300/20 pointer-events-none" />

          {/* 10 Multiplier Betting Options (5 Rows x 2 Columns) matching Image 1 layout:
              Left Col:  [Logo] [x2/x8/x66/x100/x30]
              Right Col: [x5/x18/x50/x88/x20] [Logo]
          */}
          <div className="w-full h-full flex flex-col justify-between py-1 px-1 z-10">
            {INNER_GRID_ROWS.map((row, rowIdx) => {
              const leftCar = CARS[row.left];
              const rightCar = CARS[row.right];
              const leftMyBet = userBets[row.left] || 0;
              const rightMyBet = userBets[row.right] || 0;
              const leftPool = tableBets[row.left] || 0;
              const rightPool = tableBets[row.right] || 0;

              const isLeftWinner =
                phase === 'RESULT' &&
                winnerSlotIndex !== null &&
                WHEEL_SLOTS[winnerSlotIndex] === row.left;

              const isRightWinner =
                phase === 'RESULT' &&
                winnerSlotIndex !== null &&
                WHEEL_SLOTS[winnerSlotIndex] === row.right;

              return (
                <div key={rowIdx} className="grid grid-cols-2 gap-1.5 flex-1 items-center">
                  {/* Left Option: [Logo] [Multiplier] */}
                  <button
                    type="button"
                    disabled={phase === 'SPINNING'}
                    onClick={() => onPlaceBet(row.left)}
                    className={`relative flex items-center justify-between px-1.5 py-0.5 rounded-md transition-all duration-100 ${
                      isLeftWinner
                        ? 'bg-amber-400/40 border border-yellow-300 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.7)] animate-pulse'
                        : leftMyBet > 0
                        ? 'bg-white/20 border border-pink-200/50 shadow-sm'
                        : 'bg-black/10 hover:bg-white/10 border border-white/5 active:scale-95'
                    } ${phase === 'SPINNING' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                  >
                    {/* Left Car Logo */}
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center drop-shadow">
                      <CarLogoComponent
                        carId={row.left}
                        className={`w-full h-full object-contain ${
                          row.left === 'vw' || row.left === 'mercedes' ? 'opacity-70' : ''
                        }`}
                      />
                    </div>

                    {/* Left Multiplier */}
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#fecdd3] hover:text-white drop-shadow font-['Outfit']">
                      x{leftCar.multiplier}
                    </span>

                    {/* Placed Chip Badge */}
                    {leftMyBet > 0 && (
                      <div className="absolute -top-1.5 -right-1 z-20 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow border border-white animate-in zoom-in-75">
                        {formatNumber(leftMyBet)}
                      </div>
                    )}

                    {leftPool > 0 && (
                      <div className="absolute -bottom-1 left-1 z-10 text-[8px] text-pink-200/80 font-mono tracking-tighter">
                        {formatNumber(leftPool)}
                      </div>
                    )}
                  </button>

                  {/* Right Option: [Multiplier] [Logo] */}
                  <button
                    type="button"
                    disabled={phase === 'SPINNING'}
                    onClick={() => onPlaceBet(row.right)}
                    className={`relative flex items-center justify-between px-1.5 py-0.5 rounded-md transition-all duration-100 ${
                      isRightWinner
                        ? 'bg-amber-400/40 border border-yellow-300 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.7)] animate-pulse'
                        : rightMyBet > 0
                        ? 'bg-white/20 border border-pink-200/50 shadow-sm'
                        : 'bg-black/10 hover:bg-white/10 border border-white/5 active:scale-95'
                    } ${phase === 'SPINNING' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                  >
                    {/* Right Multiplier */}
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#fecdd3] hover:text-white drop-shadow font-['Outfit']">
                      x{rightCar.multiplier}
                    </span>

                    {/* Right Car Logo */}
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center drop-shadow">
                      <CarLogoComponent
                        carId={row.right}
                        className={`w-full h-full object-contain ${
                          row.right === 'bmw' || row.right === 'jaguar' ? 'opacity-70' : ''
                        }`}
                      />
                    </div>

                    {/* Placed Chip Badge */}
                    {rightMyBet > 0 && (
                      <div className="absolute -top-1.5 -right-1 z-20 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow border border-white animate-in zoom-in-75">
                        {formatNumber(rightMyBet)}
                      </div>
                    )}

                    {rightPool > 0 && (
                      <div className="absolute -bottom-1 left-1 z-10 text-[8px] text-pink-200/80 font-mono tracking-tighter">
                        {formatNumber(rightPool)}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Under Wheel Bets Counter Bar (Image 1: "0 جولات اللعب" & "0 اختياري") */}
      <div className="w-full flex items-center justify-between px-3 mt-1.5 text-xs sm:text-sm font-bold text-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-white text-base">
            {Object.values(tableBets).reduce((a, b) => a + b, 0).toLocaleString("en-US")}
          </span>
          <span className="text-slate-300 font-bold">جولات اللعب</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-white text-base">
            {Object.values(userBets).reduce((a, b) => a + b, 0).toLocaleString("en-US")}
          </span>
          <span className="text-slate-300 font-bold">اختياري</span>
        </div>
      </div>
    </div>
  );
};
