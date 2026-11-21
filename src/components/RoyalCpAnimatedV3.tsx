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
      <div className="royal-cp-v3" dir="ltr" aria-label="إطار علاقة CP الملكي الثابت">
        <div className="royal-cp-v3-avatar royal-cp-v3-left">{leftAvatar && <img src={leftAvatar} alt={leftName || 'صاحب العلاقة'} />}</div>
        <button className="royal-cp-v3-avatar royal-cp-v3-right" type="button" onClick={onRightClick} disabled={!onRightClick} aria-label={rightName || 'الشريك'}>{rightAvatar && <img src={rightAvatar} alt={rightName || 'الشريك'} />}</button>
        <img className="royal-cp-v3-art" src={root + 'file_00000000020c82468cf757971387776b.png'} alt="" draggable={false} />
        <div className="royal-cp-v3-wing-overlays" aria-hidden="true">{['left-outer', 'left-inner', 'right-inner', 'right-outer'].map(wing => <img key={wing} className={`royal-cp-v3-wing-cutout ${wing}`} src={root + 'file_00000000020c82468cf757971387776b.png'} alt="" draggable={false} />)}</div>
        {leftName && <span className="royal-cp-v3-live-name left" dir="auto">{leftName}</span>}
        {rightName && <span className="royal-cp-v3-live-name right" dir="auto">{rightName}</span>}
        <span className="royal-cp-v3-live-level" aria-label={`مستوى العلاقة ${Number.isFinite(level) ? level : 'غير متوفر'}`}>{Number.isFinite(level) ? level : '—'}</span>
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
