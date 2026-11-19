import React from 'react';
import './RoyalCpAnimatedV3.css';

const root = '/assets/cp/';
type Props = {
  leftAvatar?: string | null;
  rightAvatar?: string | null;
  leftName?: string;
  rightName?: string;
  level?: number;
  progressPoints?: number | null;
  nextLevelPoints?: number | null;
  onRightClick?: () => void;
};

export const RoyalCpAnimatedV3: React.FC<Props> = ({
  leftAvatar, rightAvatar, leftName, rightName, level,
  progressPoints, nextLevelPoints, onRightClick,
}) => {
  const hasRealProgress = typeof progressPoints === 'number' && Number.isFinite(progressPoints)
    && progressPoints >= 0 && typeof nextLevelPoints === 'number'
    && Number.isFinite(nextLevelPoints) && nextLevelPoints > 0;
  const percentage = hasRealProgress ? Math.min(100, Math.max(0, (progressPoints! / nextLevelPoints!) * 100)) : null;
  return (
    <div className="royal-cp-v3-shell">
      <div className="royal-cp-v3" dir="ltr" aria-label="إطار علاقة CP الملكي المتحرك">
        <div className="royal-cp-v3-avatar royal-cp-v3-left">{leftAvatar && <img src={leftAvatar} alt={leftName || 'صاحب العلاقة'} />}</div>
        <button className="royal-cp-v3-avatar royal-cp-v3-right" type="button" onClick={onRightClick} disabled={!onRightClick} aria-label={rightName || 'الشريك'}>{rightAvatar && <img src={rightAvatar} alt={rightName || 'الشريك'} />}</button>
        <img className="royal-cp-v3-art" src={root + 'a_png_cutout_of_the_same_ornate_cp_relationship_ba(1).png'} alt="" draggable={false} />
        <svg className="royal-cp-v3-wings" viewBox="0 0 1536 512" aria-hidden="true">
          <image className="royal-cp-wing w0" href={root + 'wing-1.png'} x="4" y="10" width="156" height="320" />
          <image className="royal-cp-wing w1" href={root + 'wing-2.png'} x="518" y="25" width="131" height="259" />
          <image className="royal-cp-wing w2" href={root + 'wing-3.png'} x="886" y="26" width="136" height="258" />
          <image className="royal-cp-wing w3" href={root + 'wing-4.png'} x="1377" y="10" width="156" height="320" />
        </svg>
        {leftName && <span className="royal-cp-v3-live-name left" dir="auto">{leftName}</span>}
        {rightName && <span className="royal-cp-v3-live-name right" dir="auto">{rightName}</span>}
        <span className="royal-cp-v3-live-level" aria-label={`مستوى العلاقة ${Number.isFinite(level) ? level : 'غير متوفر'}`}>{Number.isFinite(level) ? level : '—'}</span>
        <span className="royal-cp-v3-wing-glow" aria-hidden="true" />
        <span className="royal-cp-v3-gem" aria-hidden="true" />
      </div>
      {hasRealProgress ? (
        <div className="royal-cp-v3-progress" dir="rtl" aria-label={`تقدم علاقة CP ${Math.round(percentage!)} بالمئة`}>
          <div className="royal-cp-v3-progress-label"><span>تقدم العلاقة</span><span dir="ltr">{progressPoints!.toLocaleString()} / {nextLevelPoints!.toLocaleString()}</span></div>
          <div className="royal-cp-v3-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={nextLevelPoints!} aria-valuenow={Math.min(progressPoints!, nextLevelPoints!)}><span style={{ width: `${percentage}%` }} /></div>
        </div>
      ) : <p className="royal-cp-v3-progress-unavailable" dir="rtl">بيانات تقدم العلاقة غير متوفرة حالياً</p>}
    </div>
  );
};
