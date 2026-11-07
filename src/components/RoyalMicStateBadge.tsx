import React from 'react';
import { Mic, MicOff, LockKeyhole } from 'lucide-react';

/** Visual-only microphone state badge. Never controls media or microphone permissions. */
export const RoyalMicStateBadge: React.FC<{ muted?: boolean; locked?: boolean; className?: string }> = ({ muted = false, locked = false, className = '' }) => {
  const label = locked ? 'المقعد مقفل' : muted ? 'المايك مكتوم' : 'المايك مفتوح';
  return (
    <span title={label} aria-label={label} className={`inline-flex h-6 w-6 items-center justify-center rounded-full border shadow-[0_2px_8px_rgba(0,0,0,.4)] ${locked ? 'border-amber-200 bg-amber-800 text-amber-50' : muted ? 'border-rose-200 bg-rose-800 text-white' : 'border-emerald-200 bg-emerald-700 text-white'} ${className}`}>
      {locked ? <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> : muted ? <MicOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Mic className="h-3.5 w-3.5" aria-hidden="true" />}
    </span>
  );
};
