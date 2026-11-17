import React, { useState } from 'react';

/**
 * Royal CP V3: use the approved 1536x512 artwork at native aspect ratio.
 * No stretching or animated transforms are applied to the original artwork.
 * The artwork must be exported to /public/assets/cp/royal-cp-v3.png before enabling.
 * Until then the parent should keep the existing CP UI.
 */
export const RoyalCpAnimatedV3: React.FC<{
  leftAvatar?: string | null;
  rightAvatar?: string | null;
  leftName?: string;
  rightName?: string;
  onRightClick?: () => void;
}> = ({ leftAvatar, rightAvatar, leftName, rightName, onRightClick }) => {
  const [assetReady, setAssetReady] = useState(false);
  return <div className="relative w-full overflow-visible" style={{ aspectRatio: '3 / 1', isolation: 'isolate' }}>
    <img src="/assets/cp/royal-cp-v3.png" alt="إطار CP الملكي"
      onLoad={() => setAssetReady(true)}
      onError={() => setAssetReady(false)}
      className="absolute inset-0 h-full w-full object-contain pointer-events-none" />
    {assetReady && <>
      <div className="absolute overflow-hidden rounded-full" style={{ left: '13.1%', top: '25.5%', width: '18.2%', aspectRatio: '1' }}>
        {leftAvatar && <img src={leftAvatar} alt={leftName || 'صاحب العلاقة'} className="h-full w-full object-cover" />}
      </div>
      <button type="button" onClick={onRightClick} disabled={!onRightClick}
        aria-label={rightName ? `فتح ملف ${rightName}` : 'الشريك'}
        className="absolute overflow-hidden rounded-full" style={{ left: '68.8%', top: '25.5%', width: '18.2%', aspectRatio: '1' }}>
        {rightAvatar && <img src={rightAvatar} alt={rightName || 'الشريك'} className="h-full w-full object-cover" />}
      </button>
    </>}
  </div>;
};
