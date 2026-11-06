import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

/** Announces only an increase in the server-refreshed VIP entitlement, never a local purchase claim. */
export const VipActivationBanner: React.FC = () => {
  const { currentUser, isLoggedIn } = useApp();
  const last = useRef<{ id: string; tier: number } | null>(null);
  const [tier, setTier] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !currentUser.id) { last.current = null; setTier(null); return; }
    const activeTier = currentUser.vipExpiry && Date.parse(currentUser.vipExpiry) <= Date.now()
      ? 0 : Math.max(0, Math.trunc(currentUser.vipLevel || 0));
    const previous = last.current;
    last.current = { id: currentUser.id, tier: activeTier };
    if (!previous || previous.id !== currentUser.id) { setTier(null); return; }
    if (activeTier > previous.tier && activeTier <= 10) setTier(activeTier);
  }, [isLoggedIn, currentUser.id, currentUser.vipLevel, currentUser.vipExpiry]);

  useEffect(() => {
    if (tier === null) return;
    const timeout = window.setTimeout(() => setTier(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [tier]);

  if (tier === null) return null;
  return <div role="status" aria-live="polite" dir="rtl" className="pointer-events-none fixed inset-x-3 top-[max(76px,env(safe-area-inset-top))] z-[92] mx-auto max-w-sm">
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#ffe7a1] bg-gradient-to-r from-[#38200a] via-[#9e6b18] to-[#3e280d] px-4 py-3 shadow-[0_10px_40px_rgba(212,162,57,.55)]">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 drop-shadow-[0_0_12px_#ffe2a0]" role="img" aria-label="صاروخ VIP الذهبي">
          <path d="M19 45 Q10 53 10 61 Q22 58 27 49 Z" fill="#ff9b2f"/>
          <path d="M21 46 Q16 52 17 57 Q24 53 25 49 Z" fill="#fff4a5"/>
          <path d="M18 43 Q18 25 46 7 Q54 25 35 46 L26 51 Z" fill="#ffe8a0" stroke="#a76a13" strokeWidth="2"/>
          <path d="M32 16 Q40 10 46 7 Q49 16 44 25 Z" fill="#fff9d7"/>
          <circle cx="34" cy="30" r="7" fill="#7b4810" stroke="#fff4c2" strokeWidth="2"/>
          <path d="M31 30 L34 25 L37 30 L34 35 Z" fill="#ffda68"/>
          <path d="M18 43 L10 43 L15 34 L23 31 M30 49 L31 56 L41 50 L42 40" fill="#d9a33d" stroke="#fff1b3" strokeWidth="1.5"/>
          <path d="M7 15 L9 20 L14 22 L9 24 L7 29 L5 24 L1 22 L5 20 Z M52 39 L54 43 L59 45 L54 47 L52 51 L50 47 L46 45 L50 43 Z" fill="#fff2bd"/>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-[#fff2c6]">تهانينا! تم تفعيل امتياز VIP</div>
          <div className="mt-1 text-xl font-black tracking-wide text-white">VIP {tier}</div>
          <div className="text-[11px] text-amber-100">مستوى ملكي جديد في TotiChat</div>
        </div>
        <div className="rounded-xl border border-[#ffedb6] bg-black/20 px-2 py-1 text-sm font-black text-[#ffe6a0]">VIP {tier}</div>
      </div>
    </div>
  </div>;
};
