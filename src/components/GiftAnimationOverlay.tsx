import React, { useEffect } from 'react';
import { Sparkles, Crown, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Lightweight royal gift celebration.
 * Keep the room, seats and chat visible; avoid full-screen blur or bouncing text.
 * The display is driven only by a confirmed gift animation from AppContext.
 */
export const GiftAnimationOverlay: React.FC = () => {
  const { activeGiftAnimation, clearGiftAnimation } = useApp();

  useEffect(() => {
    if (!activeGiftAnimation) return;
    const timer = window.setTimeout(clearGiftAnimation, 3500);
    return () => window.clearTimeout(timer);
  }, [activeGiftAnimation, clearGiftAnimation]);

  if (!activeGiftAnimation) return null;
  const { gift, sender, receiver, count } = activeGiftAnimation;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none font-['Cairo',sans-serif] overflow-hidden" aria-live="polite">
      {/* Compact ticker at the top of the room; names never overlap the art. */}
      <div className="absolute top-[17%] inset-x-4 flex justify-center">
        <div className="relative w-full max-w-sm rounded-2xl border border-amber-300/70 bg-gradient-to-r from-[#25112f]/95 via-[#552147]/95 to-[#25112f]/95 px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,.4),0_0_14px_rgba(251,191,36,.22)]">
          <div className="flex items-center justify-center gap-2 text-amber-100" dir="rtl">
            <Crown className="h-5 w-5 shrink-0 fill-amber-400 text-yellow-100" />
            <span className="min-w-0 truncate text-xs font-black">{sender}</span>
            <span className="shrink-0 text-[11px] text-amber-200">أهدى إلى</span>
            <span className="min-w-0 truncate text-xs font-black">{receiver}</span>
          </div>
        </div>
      </div>

      {/* Gift is a small floating presentation, not a screen-blocking modal. */}
      <div className="absolute top-[36%] left-1/2 -translate-x-1/2 flex w-[min(78vw,270px)] flex-col items-center">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-400/15 blur-2xl" />
          <div className="absolute inset-2 rounded-full border border-amber-200/70 bg-gradient-to-br from-[#3b2044]/90 via-[#1c112a]/95 to-[#53304b]/90 shadow-[0_0_26px_rgba(245,158,11,.42)]" />
          <div className="absolute inset-4 rounded-full border border-amber-400/35" />
          <span className="relative text-6xl leading-none drop-shadow-[0_6px_10px_rgba(0,0,0,.55)]" role="img" aria-label={gift.name}>{gift.icon}</span>
          {count > 1 && (
            <span className="absolute -bottom-1 right-0 rounded-full border border-amber-200 bg-[#4b1e3b] px-3 py-0.5 text-sm font-black text-amber-100 shadow-lg">×{count}</span>
          )}
        </div>
        <div className="mt-3 max-w-full rounded-xl border border-amber-300/40 bg-[#180e26]/90 px-5 py-2 text-center shadow-xl">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
            <h2 className="truncate text-lg font-black text-amber-200">{gift.name}</h2>
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
          </div>
          <p className="mt-0.5 text-[10px] font-bold text-amber-100/75">هدية ملكية · TotiChat</p>
        </div>
      </div>

      <button type="button" onClick={clearGiftAnimation} aria-label="إغلاق تأثير الهدية"
        className="pointer-events-auto absolute top-[30%] right-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[#1a1026]/80 text-white/90">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
