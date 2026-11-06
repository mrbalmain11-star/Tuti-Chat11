import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

type LevelEvent = { kind: 'wealth' | 'charm'; level: number };

/** Visual-only level announcement, based on authenticated server-refreshed profile levels. */
export const UserLevelUpBanner: React.FC = () => {
  const { currentUser, isLoggedIn } = useApp();
  const previous = useRef<{ id: string; wealth: number; charm: number } | null>(null);
  const [event, setEvent] = useState<LevelEvent | null>(null);
  useEffect(() => {
    if (!isLoggedIn || !currentUser.id) { previous.current = null; setEvent(null); return; }
    const wealth = Math.max(0, Math.trunc(currentUser.wealthLevel || 0));
    const charm = Math.max(0, Math.trunc(currentUser.charmLevel || 0));
    const old = previous.current;
    previous.current = { id: currentUser.id, wealth, charm };
    if (!old || old.id !== currentUser.id) { setEvent(null); return; }
    if (wealth > old.wealth) setEvent({ kind: 'wealth', level: wealth });
    else if (charm > old.charm) setEvent({ kind: 'charm', level: charm });
  }, [isLoggedIn, currentUser.id, currentUser.wealthLevel, currentUser.charmLevel]);

  useEffect(() => {
    if (!event) return;
    const timer = window.setTimeout(() => setEvent(null), 5500);
    return () => window.clearTimeout(timer);
  }, [event]);

  if (!event) return null;
  return <div className="pointer-events-none fixed inset-x-3 top-[max(74px,env(safe-area-inset-top))] z-[90] mx-auto max-w-sm" role="status" aria-live="polite" dir="rtl">
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-[#04372b] via-[#0b7955] to-[#063a2d] px-4 py-3 shadow-[0_12px_38px_rgba(10,100,72,.45)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 drop-shadow-[0_0_12px_#e9bf61]" role="img" aria-label="صاروخ الترقية">
          <path d="M18 43 L8 52 L24 48 Z M42 19 L52 9 L48 25 Z" fill="#e7b64c"/>
          <path d="M17 47 Q8 57 11 61 Q22 58 27 49 Z" fill="#ff9c34"/>
          <path d="M20 45 Q15 54 16 57 Q24 52 25 47 Z" fill="#fff2a6"/>
          <path d="M17 44 Q18 23 45 8 Q53 26 34 46 L25 51 Z" fill="#fff3bc" stroke="#d5a33b" strokeWidth="2"/>
          <path d="M31 16 Q40 10 45 8 Q48 18 44 26 Z" fill="#17b987"/>
          <circle cx="34" cy="30" r="7" fill="#0b674f" stroke="#d6aa43" strokeWidth="2"/>
          <circle cx="34" cy="30" r="3" fill="#b6ffe5"/>
          <path d="M17 44 L10 43 L15 34 L23 31 M30 49 L31 56 L40 50 L41 41" fill="#dcb45e" stroke="#f9e6a5" strokeWidth="1.5"/>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-amber-100">تهانينا! ارتفع مستواك</div>
          <div className="mt-1 text-lg font-black text-white">{event.kind === 'wealth' ? 'مستوى الثروة' : 'مستوى السحر'} {event.level}</div>
          <div className="text-[11px] text-emerald-100">إنجاز جديد في TotiChat</div>
        </div>
        <span className="rounded-full border border-amber-300/80 bg-amber-200/15 px-2 py-1 text-sm font-black text-amber-100">LV {event.level}</span>
      </div>
    </div>
  </div>;
};
