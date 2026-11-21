import React from 'react';

/** Approved uploaded TotiChat artwork; keep the original ornament/rocket and place live event text above it. */
export const ApprovedRoyalBanner: React.FC<{ asset: string; headline: string; detail: string; badge?: string }> = ({ asset, headline, detail, badge }) => (
  <div className="pointer-events-none fixed inset-x-2 top-[max(76px,env(safe-area-inset-top))] z-[92] mx-auto max-w-lg" role="status" aria-live="polite" dir="rtl">
    <div className="relative w-full aspect-[4/1] animate-[royalBannerIn_.5s_ease-out_both]" style={{ isolation: 'isolate' }}>
      <img src={asset} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" style={{ mixBlendMode: 'screen' }} />
      <div className="absolute inset-y-[24%] right-[22%] left-[14%] flex items-center justify-center gap-2 overflow-hidden text-center drop-shadow-[0_2px_3px_#28120a]">
        <div className="min-w-0"><div className="truncate text-[clamp(10px,3vw,17px)] font-black text-white">{headline}</div><div className="truncate text-[clamp(9px,2.6vw,14px)] font-bold text-amber-100">{detail}</div></div>
        {badge && <span className="shrink-0 text-[clamp(9px,2.6vw,13px)] font-black text-white">{badge}</span>}
      </div>
    </div>
  </div>
);
