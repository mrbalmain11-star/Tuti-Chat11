import React from 'react';

/** Presentational room exit/minimize dialog; parent owns actions and session state. */
export const RoyalRoomExitDialog: React.FC<{
  onMinimize: () => void;
  onLeave: () => void;
  onCancel: () => void;
  busy?: boolean;
}> = ({ onMinimize, onLeave, onCancel, busy = false }) => (
  <div role="dialog" aria-modal="true" aria-label="خيارات الغرفة" dir="rtl"
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5">
    <div className="relative w-full max-w-xs overflow-hidden rounded-[28px] border-2 border-amber-300/80 bg-gradient-to-b from-[#0c644b] via-[#064532] to-[#032b23] p-5 text-center text-white shadow-2xl">
      <svg viewBox="0 0 100 64" className="mx-auto h-16 w-24" fill="none" aria-hidden="true">
        <path d="M20 53 H80 V58 H20 Z" fill="#d5a44d"/>
        <path d="M24 49 V29 L50 12 L76 29 V49 Z" fill="#087154" stroke="#e7bf70" strokeWidth="3"/>
        <path d="M40 49 V35 Q50 24 60 35 V49" fill="#033b2e" stroke="#fff0ba" strokeWidth="2"/>
        <path d="M50 6 L54 13 L62 15 L54 18 L50 25 L46 18 L38 15 L46 13 Z" fill="#fff0ae"/>
      </svg>
      <h2 className="mt-2 text-lg font-black text-amber-100">خيارات الغرفة</h2>
      <p className="mb-5 mt-2 text-xs leading-relaxed text-emerald-50">تقدر تصغّر الغرفة وتكمل استخدام التطبيق، أو تغادر الغرفة.</p>
      <div className="space-y-2.5">
        <button type="button" disabled={busy} onClick={onMinimize} className="w-full rounded-xl border border-amber-300/70 bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-sm font-black text-emerald-950 disabled:opacity-50">تصغير الغرفة</button>
        <button type="button" disabled={busy} onClick={onLeave} className="w-full rounded-xl border border-rose-300/60 bg-[#5b2928] px-4 py-3 text-sm font-black text-white disabled:opacity-50">مغادرة الغرفة</button>
        <button type="button" disabled={busy} onClick={onCancel} className="w-full rounded-xl border border-emerald-300/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-emerald-50 disabled:opacity-50">إلغاء</button>
      </div>
    </div>
  </div>
);
