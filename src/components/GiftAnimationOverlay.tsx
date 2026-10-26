import React, { useEffect } from 'react';
import { Sparkles, Crown, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const GiftAnimationOverlay: React.FC = () => {
  const { activeGiftAnimation, clearGiftAnimation } = useApp();

  useEffect(() => {
    if (activeGiftAnimation) {
      const timer = setTimeout(() => {
        clearGiftAnimation();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeGiftAnimation, clearGiftAnimation]);

  if (!activeGiftAnimation) return null;

  const { gift, sender, receiver, count } = activeGiftAnimation;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 font-['Cairo',sans-serif]">
      {/* Dark overlay backdrop with gentle glow */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity duration-300" />

      {/* Animation Card */}
      <div className="relative pointer-events-auto flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-300">
        {/* Close Button */}
        <button
          onClick={clearGiftAnimation}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sender & Receiver Banner */}
        <div className="bg-gradient-to-r from-amber-600/90 via-yellow-500/90 to-amber-600/90 text-slate-950 px-6 py-2 rounded-full shadow-2xl border-2 border-amber-300 flex items-center gap-2 mb-4 animate-bounce">
          <Crown className="w-5 h-5 fill-slate-950" />
          <span className="font-black text-sm">{sender}</span>
          <span className="text-xs font-bold text-slate-900">أهدى إلى</span>
          <span className="font-black text-sm">{receiver}</span>
        </div>

        {/* Giant Floating Gift Graphic */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Radial light burst */}
          <div className="absolute -inset-10 bg-radial from-amber-400/30 via-yellow-500/10 to-transparent rounded-full animate-spin" />

          {/* Golden Ring */}
          <div className="w-36 h-36 rounded-full border-4 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.8)] flex items-center justify-center bg-black/50 backdrop-blur-md">
            <span className="text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform scale-110 animate-pulse">
              {gift.icon}
            </span>
          </div>

          {/* Multiplier pill */}
          {count > 1 && (
            <div className="absolute -bottom-3 -right-3 bg-red-600 text-white font-black text-lg px-3 py-0.5 rounded-full border-2 border-white shadow-lg animate-bounce">
              x{count}
            </div>
          )}
        </div>

        {/* Gift Name Title */}
        <div className="mt-2 text-center">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {gift.name}
          </h2>
          <div className="flex items-center justify-center gap-1 text-amber-200 text-xs mt-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="font-bold">هدية ملكية فاخرة في توتي شات</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
        </div>
      </div>
    </div>
  );
};
