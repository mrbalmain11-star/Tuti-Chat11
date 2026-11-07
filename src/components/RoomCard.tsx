import React, { useEffect, useState } from 'react';
import { VoiceRoom } from '../types';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { RoyalRoomRankFrame } from './RoyalRoomRankFrame';
import { RoyalRoomRankBadge } from './RoyalRoomRankBadge';

interface RoomCardProps {
  room: VoiceRoom;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const { enterRoom } = useApp();
  const [coverFailed, setCoverFailed] = useState(false);
  const [hostAvatarFailed, setHostAvatarFailed] = useState(false);
  useEffect(() => { setCoverFailed(false); }, [room.coverImage]);
  useEffect(() => { setHostAvatarFailed(false); }, [room.hostAvatar, room.coverImage]);

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
        {room.coverImage && !coverFailed ? (
          <img
            key={room.coverImage}
            src={room.coverImage}
            alt={room.title}
            onError={() => setCoverFailed(true)}
            onLoad={() => setCoverFailed(false)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-950 flex items-center justify-center">
            <span className="text-5xl font-black text-white/75">{room.title.trim().slice(0, 1) || '♪'}</span>
          </div>
        )}

        {(room.rank === 1 || room.rank === 2 || room.rank === 3) && <RoyalRoomRankFrame rank={room.rank} />}

        {/* Subtle dark gradient overlay at top and bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65 pointer-events-none" />

        {(room.rank === 1 || room.rank === 2 || room.rank === 3) && (
          <div className="absolute top-1.5 right-1.5 z-10 w-9 h-9 flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            <RoyalRoomRankBadge rank={room.rank} />
          </div>
        )}

        {/* Bottom Bar: Soundwave Listeners Count (Left in LTR / Right in RTL) & Single Host Avatar (Right) */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
          {/* Soundwave + Listeners Count */}
          <div className="flex items-center gap-1 text-white text-xs font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <span className="text-white text-sm tracking-tighter">ılı</span>
            <span className="font-sans font-bold">{room.listenersCount ?? 0}</span>
          </div>

          {/* Single Host Avatar in Circle with White Border matching Screenshot */}
          <div className="w-5 h-5 rounded-full overflow-hidden border border-white/90 shrink-0 shadow-md">
            {(room.hostAvatar || room.coverImage) && !hostAvatarFailed ? (
              <img
                key={room.hostAvatar || room.coverImage}
                src={room.hostAvatar || room.coverImage}
                alt="Host"
                onError={() => setHostAvatarFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : <span className="block w-full h-full bg-emerald-800 text-white text-center text-xs leading-5">♪</span>}
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
