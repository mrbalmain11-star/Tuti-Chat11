import React from 'react';
import { VoiceRoom } from '../types';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

interface RoomCardProps {
  room: VoiceRoom;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const { enterRoom } = useApp();

  return (
    <div
      onClick={() => {
        sounds.playClick();
        enterRoom(room.id);
      }}
      className="flex flex-col cursor-pointer group active:scale-98 transition select-none"
      dir="rtl"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[1/1] w-full rounded-2xl overflow-hidden bg-slate-200 border border-slate-200/80 shadow-md group-hover:shadow-lg transition">
        <img
          src={room.coverImage}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
        />

        {/* Subtle dark gradient overlay at top and bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65 pointer-events-none" />

        {/* Top-Right Badge: Rank 1 (Gold Royal Laurel Crest) */}
        {room.rank === 1 && (
          <div className="absolute top-1.5 right-1.5 z-10 w-9 h-9 flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              {/* Golden Laurel Wings */}
              <defs>
                <linearGradient id="goldCrestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>
                <linearGradient id="redGemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b91c1c" />
                  <stop offset="50%" stopColor="#991b1b" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
              </defs>
              {/* Outer Crown Crest */}
              <path
                d="M20 4 L24 9 L30 6 L28 14 L34 16 L29 22 L31 29 L23 27 L20 33 L17 27 L9 29 L11 22 L6 16 L12 14 L10 6 L16 9 Z"
                fill="url(#goldCrestGrad)"
                stroke="#fff"
                strokeWidth="0.75"
              />
              {/* Inner Diamond / Shield */}
              <polygon points="20,10 27,20 20,30 13,20" fill="url(#redGemGrad)" stroke="#fef08a" strokeWidth="1" />
              {/* Number 1 */}
              <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                1
              </text>
            </svg>
          </div>
        )}

        {/* Top-Right Badge: Rank 2 (Silver / Blue Royal Laurel Crest) */}
        {room.rank === 2 && (
          <div className="absolute top-1.5 right-1.5 z-10 w-9 h-9 flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <defs>
                <linearGradient id="silverCrestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="blueGemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
              </defs>
              <path
                d="M20 4 L24 9 L30 6 L28 14 L34 16 L29 22 L31 29 L23 27 L20 33 L17 27 L9 29 L11 22 L6 16 L12 14 L10 6 L16 9 Z"
                fill="url(#silverCrestGrad)"
                stroke="#fff"
                strokeWidth="0.75"
              />
              <polygon points="20,10 27,20 20,30 13,20" fill="url(#blueGemGrad)" stroke="#e2e8f0" strokeWidth="1" />
              <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                2
              </text>
            </svg>
          </div>
        )}

        {/* Top-Right Badge: Rank 3 (Bronze / Rose-gold Laurel Crest) */}
        {room.rank === 3 && (
          <div className="absolute top-1.5 right-1.5 z-10 w-9 h-9 flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <defs>
                <linearGradient id="bronzeCrestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fed7aa" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
                <linearGradient id="purpleGemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7e22ce" />
                  <stop offset="50%" stopColor="#6b21a8" />
                  <stop offset="100%" stopColor="#581c87" />
                </linearGradient>
              </defs>
              <path
                d="M20 4 L24 9 L30 6 L28 14 L34 16 L29 22 L31 29 L23 27 L20 33 L17 27 L9 29 L11 22 L6 16 L12 14 L10 6 L16 9 Z"
                fill="url(#bronzeCrestGrad)"
                stroke="#fff"
                strokeWidth="0.75"
              />
              <polygon points="20,10 27,20 20,30 13,20" fill="url(#purpleGemGrad)" stroke="#fed7aa" strokeWidth="1" />
              <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                3
              </text>
            </svg>
          </div>
        )}

        {/* Bottom Bar: Soundwave Listeners Count (Left in LTR / Right in RTL) & Single Host Avatar (Right) */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
          {/* Soundwave + Listeners Count */}
          <div className="flex items-center gap-1 text-white text-xs font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <span className="text-white text-sm tracking-tighter">ılı</span>
            <span className="font-sans font-bold">{room.listenersCount ?? 50}</span>
          </div>

          {/* Single Host Avatar in Circle with White Border matching Screenshot */}
          <div className="w-5 h-5 rounded-full overflow-hidden border border-white/90 shrink-0 shadow-md">
            <img
              src={room.hostAvatar || room.coverImage}
              alt="Host"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Room Title with Flag Underneath (Matching Screenshot 1:1) */}
      <div className="mt-1.5 flex items-center justify-center gap-1 px-1">
        <span className="text-xs font-black text-slate-800 truncate group-hover:text-emerald-700 transition">
          {room.title}
        </span>
        {room.countryFlag && (
          <span className="text-sm leading-none shrink-0">
            {room.countryFlag}
          </span>
        )}
      </div>
    </div>
  );
};
