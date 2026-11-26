import React from 'react';
import { SymbolId, SpecialSymbolId } from '../types/game';
import { ASSETS } from '../assets/assets';

interface SymbolTileProps {
  symbol: SymbolId;
  isWinning?: boolean;
  className?: string;
}

export const SymbolTile: React.FC<SymbolTileProps> = ({
  symbol,
  isWinning = false,
  className = '',
}) => {
  // Check if this is a Gem or Letter or Wild
  const isGem = symbol === 'GEM_RED' || symbol === 'GEM_BLUE' || symbol === 'GEM_GREEN';
  const isWild = symbol === 'WILD';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none transition-all duration-200 ${
        isWinning ? 'scale-105 z-10' : ''
      } ${className}`}
    >
      {/* 
        TILE BACKGROUND MATCHING IMG-20261008-WA0081.jpg:
        - GEMS: Ornate embossed golden filigree square tile with engraved borders.
        - LETTERS: Warm light sandstone carved stone tile.
        - WILD: Ornate gold tile with 3D mask.
      */}
      <div
        className={`w-full h-full rounded flex items-center justify-center relative overflow-hidden transition-all ${
          isWinning ? 'ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.95)]' : ''
        }`}
        style={
          isGem || isWild
            ? {
                background: 'linear-gradient(135deg, #c9933b 0%, #a26b21 35%, #784812 70%, #573108 100%)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.8), 0 2px 5px rgba(0,0,0,0.6)',
                border: '2px solid #dfb15b',
              }
            : {
                background: 'linear-gradient(180deg, #d8c3a5 0%, #c4ab89 50%, #a88d6c 100%)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.7), 0 2px 5px rgba(0,0,0,0.5)',
                border: '1.5px solid #8c6e4e',
              }
        }
      >
        {/* Ornate corner studs for gem & wild tiles (matching IMG-20261008-WA0081.jpg) */}
        {(isGem || isWild) && (
          <>
            <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-yellow-300 border border-amber-900 shadow-sm" />
            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-yellow-300 border border-amber-900 shadow-sm" />
            <div className="absolute bottom-0.5 left-0.5 w-2 h-2 rounded-full bg-yellow-300 border border-amber-900 shadow-sm" />
            <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-yellow-300 border border-amber-900 shadow-sm" />
            <div className="absolute inset-1 border border-yellow-200/40 pointer-events-none" />
          </>
        )}

        {/* Win glow overlay */}
        {isWinning && (
          <div className="absolute inset-0 bg-yellow-300/30 animate-pulse pointer-events-none z-10" />
        )}

        {/* 1. WILD: 3D Golden Lion/Garuda Deity Mask */}
        {symbol === 'WILD' && (
          <div className="relative w-full h-full flex items-center justify-center p-0.5">
            <img
              src={ASSETS.wildMask}
              alt="WILD"
              className="w-[96%] h-[96%] object-contain rounded-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] filter brightness-110 contrast-110"
            />
          </div>
        )}

        {/* 2. GEM_RED: Round Faceted Ruby in Ornate Square Gold Frame (matching IMG-20261008-WA0081.jpg) */}
        {symbol === 'GEM_RED' && (
          <div className="relative w-full h-full flex items-center justify-center p-1">
            <svg viewBox="0 0 60 60" className="w-[88%] h-[88%] filter drop-shadow-[0_2px_10px_rgba(239,68,68,0.95)]">
              <defs>
                <radialGradient id="rubyRoundReal" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#fed7aa" />
                  <stop offset="15%" stopColor="#fda4af" />
                  <stop offset="35%" stopColor="#f43f5e" />
                  <stop offset="70%" stopColor="#be123c" />
                  <stop offset="100%" stopColor="#4c0519" />
                </radialGradient>
              </defs>
              {/* Outer gold ring around ruby */}
              <circle cx="30" cy="30" r="28" fill="#78350f" stroke="#fde047" strokeWidth="1.5" />
              {/* Brilliant Round Faceted Ruby Sphere */}
              <circle cx="30" cy="30" r="25" fill="url(#rubyRoundReal)" stroke="#ffe4e6" strokeWidth="1" />
              <circle cx="30" cy="30" r="17" fill="#e11d48" opacity="0.5" stroke="#fda4af" strokeWidth="0.8" />
              <circle cx="30" cy="30" r="9" fill="#9f1239" opacity="0.6" />
              {/* Facet facets */}
              <line x1="12" y1="20" x2="48" y2="20" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
              <line x1="12" y1="40" x2="48" y2="40" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
              <line x1="20" y1="12" x2="20" y2="48" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
              <line x1="40" y1="12" x2="40" y2="48" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
              {/* Bright shine highlight */}
              <ellipse cx="22" cy="18" rx="4" ry="2.5" fill="#ffffff" opacity="0.95" transform="rotate(-30, 22, 18)" />
            </svg>
          </div>
        )}

        {/* 3. GEM_BLUE: Octagonal Faceted Blue Sapphire Diamond (matching IMG-20261008-WA0081.jpg) */}
        {symbol === 'GEM_BLUE' && (
          <div className="relative w-full h-full flex items-center justify-center p-1">
            <svg viewBox="0 0 60 60" className="w-[88%] h-[88%] filter drop-shadow-[0_2px_10px_rgba(59,130,246,0.95)]">
              <defs>
                <radialGradient id="sapphireReal" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#dbeafe" />
                  <stop offset="20%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#2563eb" />
                  <stop offset="80%" stopColor="#1e40af" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
              </defs>
              {/* Outer gold octagon */}
              <polygon points="17,3 43,3 57,17 57,43 43,57 17,57 3,43 3,17" fill="#78350f" stroke="#fde047" strokeWidth="1.5" />
              {/* Faceted Sapphire */}
              <polygon points="18,5 42,5 55,18 55,42 42,55 18,55 5,42 5,18" fill="url(#sapphireReal)" stroke="#bfdbfe" strokeWidth="1" />
              <polygon points="22,12 38,12 48,22 48,38 38,48 22,48 12,38 12,22" fill="#1d4ed8" opacity="0.6" stroke="#93c5fd" strokeWidth="0.8" />
              <polygon points="26,18 34,18 40,24 40,36 34,42 26,42 20,36 20,24" fill="#1e3a8a" opacity="0.7" />
              {/* Glint */}
              <circle cx="22" cy="18" r="3.5" fill="#ffffff" opacity="0.95" />
            </svg>
          </div>
        )}

        {/* 4. GEM_GREEN: Hexagonal Faceted Emerald (matching IMG-20261008-WA0081.jpg) */}
        {symbol === 'GEM_GREEN' && (
          <div className="relative w-full h-full flex items-center justify-center p-1">
            <svg viewBox="0 0 60 60" className="w-[88%] h-[88%] filter drop-shadow-[0_2px_10px_rgba(16,185,129,0.95)]">
              <defs>
                <radialGradient id="emeraldReal" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#d1fae5" />
                  <stop offset="20%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="80%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#064e3b" />
                </radialGradient>
              </defs>
              <polygon points="15,4 45,4 56,30 45,56 15,56 4,30" fill="#78350f" stroke="#fde047" strokeWidth="1.5" />
              <polygon points="16,6 44,6 54,30 44,54 16,54 6,30" fill="url(#emeraldReal)" stroke="#a7f3d0" strokeWidth="1" />
              <polygon points="20,14 40,14 48,30 40,46 20,46 12,30" fill="#047857" opacity="0.6" stroke="#6ee7b7" strokeWidth="0.8" />
              <polygon points="24,20 36,20 42,30 36,40 24,40 18,30" fill="#065f46" opacity="0.7" />
              <circle cx="22" cy="18" r="3.5" fill="#ffffff" opacity="0.95" />
            </svg>
          </div>
        )}

        {/* 5. Letter A on Sandstone tile (matching IMG-20261008-WA0081.jpg) */}
        {symbol === 'A' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-[82%] h-[82%] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
              <defs>
                <linearGradient id="stoneLetterRealA" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e8d8be" />
                  <stop offset="50%" stopColor="#c5ab89" />
                  <stop offset="100%" stopColor="#7a5a3a" />
                </linearGradient>
              </defs>
              <path
                d="M40 8 L65 68 L50 68 L44 52 L36 52 L30 68 L15 68 Z M40 22 L37 42 L43 42 Z"
                fill="url(#stoneLetterRealA)"
                stroke="#4a3018"
                strokeWidth="2.8"
                strokeLinejoin="bevel"
              />
              <circle cx="40" cy="38" r="4.5" fill="#dc2626" stroke="#fef08a" strokeWidth="1.2" />
            </svg>
          </div>
        )}

        {/* 6. Letter K on Sandstone tile */}
        {symbol === 'K' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-[82%] h-[82%] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
              <defs>
                <linearGradient id="stoneLetterRealK" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e8d8be" />
                  <stop offset="50%" stopColor="#c5ab89" />
                  <stop offset="100%" stopColor="#7a5a3a" />
                </linearGradient>
              </defs>
              <path
                d="M18 10 L34 10 L34 38 L54 10 L70 10 L47 40 L72 68 L55 68 L34 44 L34 68 L18 68 Z"
                fill="url(#stoneLetterRealK)"
                stroke="#4a3018"
                strokeWidth="2.8"
                strokeLinejoin="bevel"
              />
              <circle cx="56" cy="40" r="4.5" fill="#9333ea" stroke="#fef08a" strokeWidth="1.2" />
            </svg>
          </div>
        )}

        {/* 7. Letter Q on Sandstone tile */}
        {symbol === 'Q' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-[82%] h-[82%] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
              <defs>
                <linearGradient id="stoneLetterRealQ" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e8d8be" />
                  <stop offset="50%" stopColor="#c5ab89" />
                  <stop offset="100%" stopColor="#7a5a3a" />
                </linearGradient>
              </defs>
              <path
                d="M40 8 C22 8 12 20 12 40 C12 60 22 70 40 70 C46 70 51 68 56 64 L65 72 L72 65 L64 56 C66 51 68 46 68 40 C68 20 58 8 40 8 Z M40 20 C48 20 54 28 54 40 C54 52 48 58 40 58 C32 58 26 52 26 40 C26 28 32 20 40 20 Z"
                fill="url(#stoneLetterRealQ)"
                stroke="#4a3018"
                strokeWidth="2.8"
                strokeLinejoin="bevel"
              />
              <circle cx="61" cy="57" r="4.5" fill="#2563eb" stroke="#fef08a" strokeWidth="1.2" />
            </svg>
          </div>
        )}

        {/* 8. Letter J on Sandstone tile (matching IMG-20261008-WA0081.jpg) */}
        {symbol === 'J' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-[82%] h-[82%] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
              <defs>
                <linearGradient id="stoneLetterRealJ" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e8d8be" />
                  <stop offset="50%" stopColor="#c5ab89" />
                  <stop offset="100%" stopColor="#7a5a3a" />
                </linearGradient>
              </defs>
              <path
                d="M38 10 L56 10 L56 48 C56 64 45 72 28 72 C18 72 10 65 10 56 L24 54 C24 58 28 60 32 60 C38 60 42 56 42 48 L42 10 Z"
                fill="url(#stoneLetterRealJ)"
                stroke="#4a3018"
                strokeWidth="2.8"
                strokeLinejoin="bevel"
              />
              <circle cx="28" cy="46" r="4.5" fill="#16a34a" stroke="#fef08a" strokeWidth="1.2" />
            </svg>
          </div>
        )}

      </div>
    </div>
  );
};

interface SpecialSymbolTileProps {
  symbol: SpecialSymbolId;
  isSelectedCenter?: boolean;
  isWinning?: boolean;
  isExActive?: boolean;
  className?: string;
}

export const SpecialSymbolTile: React.FC<SpecialSymbolTileProps> = ({
  symbol,
  isSelectedCenter = false,
  isWinning = false,
  isExActive = false,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none ${
        isSelectedCenter ? 'z-20' : 'opacity-95'
      } ${className}`}
    >
      {/* Background for special reel cell: warm dark stone */}
      <div
        className="w-full h-full rounded flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #573319 0%, #3e220e 50%, #241206 100%)',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -2px 5px rgba(0,0,0,0.85)',
          border: '1.5px solid #6b3e1a',
        }}
      >
        {/* The prominent Thick Golden Frame around the Center Row (matching IMG-20261008-WA0081.jpg) */}
        {isSelectedCenter && (
          <div
            className="absolute inset-0 rounded z-20 pointer-events-none"
            style={{
              border: '4px solid #facc15',
              boxShadow: '0 0 24px rgba(250,204,21,1), inset 0 0 14px rgba(250,204,21,0.6)',
            }}
          />
        )}

        {/* Attached EX badge ribbon on left of center multiplier when active */}
        {isSelectedCenter && isExActive && (
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 border border-yellow-100 rounded-l px-1 py-0.5 text-[9px] font-black text-stone-950 shadow-[0_0_10px_rgba(245,158,11,0.95)]">
              EX
            </div>
          </div>
        )}

        {/* WHEEL Symbol */}
        {symbol === 'WHEEL' ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-[86%] h-[86%] filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              <circle cx="40" cy="40" r="38" fill="#78350f" stroke="#facc15" strokeWidth="2.5" />
              <circle cx="40" cy="40" r="32" fill="#991b1b" stroke="#ca8a04" strokeWidth="1.5" />
              <circle cx="40" cy="40" r="24" fill="#047857" stroke="#fef08a" strokeWidth="1" />
              <circle cx="40" cy="40" r="14" fill="#eab308" stroke="#fef08a" strokeWidth="1.5" />
              <circle cx="40" cy="40" r="7" fill="#dc2626" />
            </svg>
            <div className="absolute bottom-1 px-1.5 py-[1px] rounded bg-black/85 border border-emerald-400 text-[10px] font-black tracking-wider text-emerald-300 shadow">
              WHEEL
            </div>
          </div>
        ) : (
          /* Multiplier Rosette Medallions matching IMG-20261008-WA0081.jpg */
          <div className="relative w-full h-full flex items-center justify-center">
            {symbol === '1x' && (
              <div className="relative w-[88%] h-[88%] rounded-full border-2 border-yellow-300 bg-gradient-to-br from-blue-900 via-sky-800 to-indigo-950 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 60 60" className="w-[84%] h-[84%] absolute">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <ellipse
                      key={deg}
                      cx="30"
                      cy="15"
                      rx="6"
                      ry="9"
                      fill="#e2e8f0"
                      stroke="#94a3b8"
                      strokeWidth="0.8"
                      transform={`rotate(${deg}, 30, 30)`}
                    />
                  ))}
                  <circle cx="30" cy="30" r="12" fill="#1e3a8a" stroke="#fde047" strokeWidth="1.5" />
                </svg>
                <span className="relative z-10 font-black text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  1x
                </span>
              </div>
            )}

            {symbol === '2x' && (
              /* Green rosette ring matching 2x in IMG-20261008-WA0081.jpg bottom row */
              <div className="relative w-[88%] h-[88%] rounded-full border-2 border-yellow-300 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-950 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 60 60" className="w-[84%] h-[84%] absolute">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <ellipse
                      key={deg}
                      cx="30"
                      cy="15"
                      rx="6"
                      ry="9"
                      fill="#86efac"
                      stroke="#22c55e"
                      strokeWidth="0.8"
                      transform={`rotate(${deg}, 30, 30)`}
                    />
                  ))}
                  <circle cx="30" cy="30" r="12" fill="#064e3b" stroke="#fde047" strokeWidth="1.5" />
                </svg>
                <span
                  className="relative z-10 font-black text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  style={{ WebkitTextStroke: '1px #14532d' }}
                >
                  2x
                </span>
              </div>
            )}

            {symbol === '3x' && (
              /* Cyan rosette */
              <div className="relative w-[88%] h-[88%] rounded-full border-2 border-yellow-300 bg-gradient-to-br from-sky-900 via-blue-800 to-slate-950 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 60 60" className="w-[84%] h-[84%] absolute">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <ellipse
                      key={deg}
                      cx="30"
                      cy="15"
                      rx="6"
                      ry="9"
                      fill="#7dd3fc"
                      stroke="#0284c7"
                      strokeWidth="0.8"
                      transform={`rotate(${deg}, 30, 30)`}
                    />
                  ))}
                  <circle cx="30" cy="30" r="12" fill="#0c4a6e" stroke="#fde047" strokeWidth="1.5" />
                </svg>
                <span
                  className="relative z-10 font-black text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  style={{ WebkitTextStroke: '1px #0369a1' }}
                >
                  3x
                </span>
              </div>
            )}

            {symbol === '5x' && (
              /* Royal blue rosette with yellow 5x (matching IMG-20261008-WA0081.jpg middle row!) */
              <div className="relative w-[88%] h-[88%] rounded-full border-2 border-yellow-300 bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-950 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 60 60" className="w-[84%] h-[84%] absolute">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <ellipse
                      key={deg}
                      cx="30"
                      cy="15"
                      rx="6"
                      ry="9"
                      fill="#60a5fa"
                      stroke="#2563eb"
                      strokeWidth="0.8"
                      transform={`rotate(${deg}, 30, 30)`}
                    />
                  ))}
                  <circle cx="30" cy="30" r="12" fill="#1e3a8a" stroke="#fde047" strokeWidth="1.5" />
                </svg>
                <span
                  className="relative z-10 font-black text-2xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  style={{ WebkitTextStroke: '1px #1e3a8a' }}
                >
                  5x
                </span>
              </div>
            )}

            {symbol === '10x' && (
              /* Purple rosette */
              <div className="relative w-[88%] h-[88%] rounded-full border-2 border-yellow-300 bg-gradient-to-br from-purple-950 via-fuchsia-900 to-slate-950 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 60 60" className="w-[84%] h-[84%] absolute">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <ellipse
                      key={deg}
                      cx="30"
                      cy="15"
                      rx="6"
                      ry="9"
                      fill="#c084fc"
                      stroke="#9333ea"
                      strokeWidth="0.8"
                      transform={`rotate(${deg}, 30, 30)`}
                    />
                  ))}
                  <circle cx="30" cy="30" r="12" fill="#581c87" stroke="#fde047" strokeWidth="1.5" />
                </svg>
                <span
                  className="relative z-10 font-black text-2xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  style={{ WebkitTextStroke: '1px #581c87' }}
                >
                  10x
                </span>
              </div>
            )}

            {symbol === '15x' && (
              /* Crimson rosette */
              <div className="relative w-[88%] h-[88%] rounded-full border-2 border-yellow-300 bg-gradient-to-br from-rose-950 via-red-900 to-amber-950 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 60 60" className="w-[84%] h-[84%] absolute">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <ellipse
                      key={deg}
                      cx="30"
                      cy="15"
                      rx="6"
                      ry="9"
                      fill="#f87171"
                      stroke="#dc2626"
                      strokeWidth="0.8"
                      transform={`rotate(${deg}, 30, 30)`}
                    />
                  ))}
                  <circle cx="30" cy="30" r="12" fill="#7f1d1d" stroke="#fde047" strokeWidth="1.5" />
                </svg>
                <span
                  className="relative z-10 font-black text-2xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  style={{ WebkitTextStroke: '1px #7f1d1d' }}
                >
                  15x
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
