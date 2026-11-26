import React, { useState, useEffect, useRef } from 'react';
import { WHEEL_MULTIPLIERS } from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { ASSETS } from '../assets/assets';

interface FortuneWheelProps {
  currentBet: number;
  isSpinning: boolean;
  targetMultiplier?: number | null;
  onSpinComplete?: (wonMultiplier: number, prizeCoins: number) => void;
  className?: string;
  isTriggeredBonus?: boolean;
}

export const FortuneWheel: React.FC<FortuneWheelProps> = ({
  currentBet,
  isSpinning,
  targetMultiplier,
  onSpinComplete,
  className = '',
  isTriggeredBonus = false,
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [internalSpinning, setInternalSpinning] = useState<boolean>(false);
  const [highlightedSlice, setHighlightedSlice] = useState<number | null>(null);

  const rotationRef = useRef<number>(0);
  const currentBetRef = useRef<number>(currentBet);
  const onSpinCompleteRef = useRef(onSpinComplete);

  useEffect(() => {
    currentBetRef.current = currentBet;
  }, [currentBet]);

  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  const sliceCount = WHEEL_MULTIPLIERS.length;
  const sliceAngle = 360 / sliceCount;

  // Format slice values matching the screenshots (50K, 150K, 250K, 400K, 500K, 750K, 1M, 1.5M, 2.5M, 5M, 10M, 50M)
  const formatPrize = (multiplier: number) => {
    if (currentBet === 0) return `×${multiplier}`;
    const coins = multiplier * currentBet;
    if (coins >= 1_000_000) {
      const millions = coins / 1_000_000;
      return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
    }
    if (coins >= 1_000) {
      const thousands = coins / 1_000;
      return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
    }
    return `${coins}`;
  };

  // Colors matching the screenshots: purple, cyan, olive gold, magenta, turquoise, blue
  const sliceColors = [
    { bg: '#2563eb', text: '#ffffff', stroke: '#1d4ed8' }, // Blue
    { bg: '#0284c7', text: '#e0f2fe', stroke: '#0369a1' }, // Cyan
    { bg: '#a21caf', text: '#fdf4ff', stroke: '#86198f' }, // Purple
    { bg: '#ca8a04', text: '#fef9c3', stroke: '#a16207' }, // Gold
    { bg: '#0d9488', text: '#ccfbf1', stroke: '#0f766e' }, // Teal
    { bg: '#c026d3', text: '#fae8ff', stroke: '#a21caf' }, // Magenta
    { bg: '#b45309', text: '#fef3c7', stroke: '#92400e' }, // Amber
    { bg: '#1d4ed8', text: '#ffffff', stroke: '#1e40af' }, // Blue
    { bg: '#9333ea', text: '#ffffff', stroke: '#7e22ce' }, // Deep Purple
    { bg: '#059669', text: '#ffffff', stroke: '#047857' }, // Emerald
    { bg: '#d97706', text: '#ffffff', stroke: '#b45309' }, // Gold 200x
    { bg: '#dc2626', text: '#ffffff', stroke: '#b91c1c' }, // Red 1000x
  ];

  useEffect(() => {
    if (isSpinning && targetMultiplier) {
      setHighlightedSlice(null);
      setInternalSpinning(true);

      const targetIndex = WHEEL_MULTIPLIERS.indexOf(targetMultiplier);
      const safeIndex = targetIndex >= 0 ? targetIndex : 0;

      const targetCenterAngle = safeIndex * sliceAngle + sliceAngle / 2;
      const targetAngleAtTop = (360 - targetCenterAngle + 270) % 360;

      const baseRotation = rotationRef.current;
      const extraSpins = 6 + Math.floor(Math.random() * 3);
      const targetTotalRotation =
        baseRotation + extraSpins * 360 + ((targetAngleAtTop - (baseRotation % 360) + 360) % 360);

      let tickCount = 0;
      const tickInterval: ReturnType<typeof setInterval> = setInterval(() => {
        tickCount++;
        soundEngine.playWheelTick();
        if (tickCount > 40) clearInterval(tickInterval);
      }, 110);

      rotationRef.current = targetTotalRotation;
      setRotation(targetTotalRotation);

      const spinDuration = 5200;

      const timer = setTimeout(() => {
        clearInterval(tickInterval);
        setInternalSpinning(false);
        setHighlightedSlice(safeIndex);
        soundEngine.playWheelWin();

        if (onSpinCompleteRef.current) {
          onSpinCompleteRef.current(targetMultiplier, targetMultiplier * currentBetRef.current);
        }
      }, spinDuration);

      return () => {
        clearTimeout(timer);
        clearInterval(tickInterval);
      };
    }
  }, [isSpinning, targetMultiplier, sliceAngle]);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      
      {/* Upper Arch with Golden Crest and Ruby Jewel (matching Screenshot 1 & 3) */}
      <div className="relative w-72 h-38 sm:w-80 sm:h-42 overflow-hidden flex items-end justify-center">
        
        {/* Glowing aura when triggered */}
        {isTriggeredBonus && (
          <div className="absolute inset-0 bg-yellow-400/40 rounded-full blur-2xl animate-pulse pointer-events-none" />
        )}

        {/* Top Temple Pediment / Arch Finial */}
        <div className="absolute top-1 z-30 flex flex-col items-center">
          {/* Gold crown finial with central oval ruby */}
          <div className="relative flex flex-col items-center">
            {/* Crown arch */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-t from-[#b45309] via-[#f59e0b] to-[#fef08a] border-2 border-yellow-200 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {/* Oval Ruby */}
              <div className="w-4 h-5 rounded-full bg-gradient-to-b from-rose-400 via-red-600 to-red-950 border border-yellow-200 shadow-inner" />
            </div>

            {/* Twin golden pointer prongs pointing straight into wheel */}
            <div className="flex gap-2.5 -mt-1">
              <div className="w-0.5 h-6 bg-gradient-to-b from-yellow-300 to-amber-700 shadow" />
              <div className="w-0.5 h-6 bg-gradient-to-b from-yellow-300 to-amber-700 shadow" />
            </div>

            {/* Central golden needle pointer */}
            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] border-t-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] -mt-1" />
          </div>
        </div>

        {/* Rotating Wheel Disc */}
        <div
          className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.9)] border-4 border-[#b45309]"
          style={{
            transform: `translateY(45%) rotate(${rotation}deg)`,
            transitionDuration: internalSpinning ? '5200ms' : '0ms',
            transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.2, 1)',
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full rounded-full">
            <defs>
              <radialGradient id="goldMeanderBorder" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="90%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#78350f" />
              </radialGradient>
            </defs>

            {/* Outer Aztec Meander Gold Ring */}
            <circle cx="100" cy="100" r="99" fill="none" stroke="#facc15" strokeWidth="11" />
            <circle cx="100" cy="100" r="94" fill="none" stroke="#78350f" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="99" fill="none" stroke="#78350f" strokeWidth="1" strokeDasharray="4 2" />

            {/* Wheel Slices */}
            {WHEEL_MULTIPLIERS.map((mult, idx) => {
              const startAngle = (idx * sliceAngle) * (Math.PI / 180);
              const endAngle = ((idx + 1) * sliceAngle) * (Math.PI / 180);
              const radius = 93;
              const cx = 100;
              const cy = 100;

              const x1 = cx + radius * Math.cos(startAngle);
              const y1 = cy + radius * Math.sin(startAngle);
              const x2 = cx + radius * Math.cos(endAngle);
              const y2 = cy + radius * Math.sin(endAngle);

              const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

              const midAngleDeg = idx * sliceAngle + sliceAngle / 2;
              const color = sliceColors[idx % sliceColors.length];
              const isSelected = highlightedSlice === idx;

              return (
                <g key={mult}>
                  <path
                    d={pathData}
                    fill={isSelected ? '#fef08a' : color.bg}
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                  />
                  {/* Text on slice */}
                  <g transform={`rotate(${midAngleDeg}, 100, 100)`}>
                    <text
                      x="160"
                      y="103"
                      fill={isSelected ? '#1c1917' : color.text}
                      fontSize="9"
                      fontWeight="900"
                      textAnchor="middle"
                      transform="rotate(90, 160, 103)"
                      className="select-none font-sans"
                    >
                      {formatPrize(mult)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Inner Gold Ring dividing slices from center boss */}
            <circle cx="100" cy="100" r="32" fill="none" stroke="#fef08a" strokeWidth="2.5" />
          </svg>

          {/* 3D Golden Lion Deity Boss Hub in Center of Wheel (matching Screenshots) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full border-2 border-yellow-300 bg-gradient-to-tr from-amber-700 via-yellow-500 to-amber-900 shadow-[0_2px_8px_rgba(0,0,0,0.9)] flex items-center justify-center p-0.5 overflow-hidden">
              <img
                src={ASSETS.wildMask}
                alt="Wheel Boss"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
