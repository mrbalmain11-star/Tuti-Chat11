import React, { useId } from 'react';

/** Purely visual gift announcement. Feed only verified public gift events from the existing backend. */
export const RoyalGiftAnnouncement: React.FC<{
  sender: string;
  receiver: string;
  giftName: string;
  giftPrice: number;
  quantity: number;
  senderAvatar?: string | null;
  receiverAvatar?: string | null;
  onOpenRoom?: () => void;
}> = ({ sender, receiver, giftName, giftPrice, quantity, senderAvatar, receiverAvatar, onOpenRoom }) => {
  const uid = useId().replace(/:/g, '');
  const gold = `gift-banner-gold-${uid}`;
  const total = giftPrice * quantity;
  if (!Number.isFinite(total) || total < 7000) return null;
  return (
    <div dir="rtl" role="status" aria-live="polite" className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-l from-[#043c2f] via-[#087353] to-[#032b24] text-white shadow-[0_8px_35px_rgba(0,0,0,.4)] motion-safe:animate-[royalGiftArrive_.65s_ease-out_both]">
      <style>{`@keyframes royalGiftArrive{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}@media(prefers-reduced-motion:reduce){.royal-gift-spark{animation:none}}`}</style>
      <button type="button" disabled={!onOpenRoom} onClick={onOpenRoom} className="flex w-full items-center gap-2 p-2.5 text-right disabled:cursor-default" aria-label={onOpenRoom ? 'فتح غرفة الهدية' : 'إعلان هدية'}>
        <div className="relative flex shrink-0 items-center gap-1">
          {senderAvatar ? <img src={senderAvatar} alt="" className="h-10 w-10 rounded-full border-2 border-amber-300 object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 bg-emerald-800 text-lg">★</span>}
          {receiverAvatar ? <img src={receiverAvatar} alt="" className="h-10 w-10 rounded-full border-2 border-amber-300 object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 bg-emerald-800 text-lg">♥</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-black text-amber-100">{sender} أهدى إلى {receiver}</div>
          <div className="mt-0.5 truncate text-[11px] font-bold">{giftName} × {quantity}</div>
          <div className="mt-1 text-xs font-black text-amber-200">{total.toLocaleString('en-US')} عملة</div>
        </div>
        <svg aria-hidden="true" viewBox="0 0 52 52" className="h-12 w-12 shrink-0">
          <defs><linearGradient id={gold} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff9c6"/><stop offset=".55" stopColor="#e3b24e"/><stop offset="1" stopColor="#94601e"/></linearGradient></defs>
          <path d="M8 21 H44 V43 H8 Z M5 16 H47 V25 H5 Z" fill={`url(#${gold})`} stroke="#fff1aa" strokeWidth="1.5"/>
          <path d="M23 16 H29 V43 H23 Z" fill="#087453"/>
          <path d="M26 15 C10 9 14 1 22 5 L26 15 C42 9 38 1 30 5 Z" fill="#f9dc83"/>
          <path d="M26 27 L29 32 L26 37 L23 32 Z" fill="#fff6c2"/>
        </svg>
      </button>
    </div>
  );
};
