import React, { useId } from 'react';
import './RoyalLevelEmblem.css';

import { Sparkles } from 'lucide-react';
import type { RoyalTrack } from '../utils/royalLevels';

type Props = { track: RoyalTrack; level: number; kind: 'badge' | 'frame'; size?: number; animated?: boolean };
const palettes: Record<RoyalTrack, { primary: string; secondary: string; glow: string }> = {
  wealth: { primary: '#facc15', secondary: '#b45309', glow: '#fef08a' },
  charm: { primary: '#f9a8d4', secondary: '#9333ea', glow: '#f5d0fe' },
  room: { primary: '#34d399', secondary: '#0f766e', glow: '#a7f3d0' },
};
/** Original procedural vector artwork. Level and track affect the ornaments,
 * never the entitlement source. No external art licenses or raster images.
 */
export const RoyalLevelEmblem: React.FC<Props> = ({ track, level, kind, size = 88, animated = true }) => {
  const palette = palettes[track];
  animated = kind === 'frame' ? animated : false;
  const id = useId().replace(/:/g, '');
  const tier = level >= 180 ? 5 : level >= 140 ? 4 : level >= 100 ? 3 : level >= 20 ? 2 : level >= 6 ? 1 : 0;
  const ornaments = Math.min(12, 3 + Math.floor(level / 20));
  const crops:Record<number,[number,number,number,number]>={1:[0,0,217,174],2:[217,0,217,174],3:[434,0,217,174],4:[651,0,217,174],5:[868,0,217,174],6:[1085,0,217,174],7:[1302,0,217,174],8:[1519,0,217,174],9:[1736,0,217,174],10:[1953,0,219,174],20:[0,174,217,201],30:[217,174,217,201],40:[434,174,217,201],50:[651,174,217,201],60:[868,174,217,201],70:[1085,174,217,201],80:[1302,174,217,201],90:[1519,174,217,201],100:[1736,174,436,201],120:[0,375,355,349],140:[355,375,355,349],160:[710,375,390,349],180:[1100,375,430,349],200:[1530,375,642,349]};
  const crop=kind==='badge'&&track==='wealth'?crops[level]:undefined;
  if(crop){const [x,y,w,h]=crop;const z=Math.min(size/w,size/h);return <span role="img" aria-label={`شارة الثروة مستوى ${level}`} className="relative inline-block shrink-0" style={{width:size,height:size}}><span aria-hidden="true" className="absolute overflow-hidden" style={{width:w*z,height:h*z,left:(size-w*z)/2,top:(size-h*z)/2,backgroundImage:"url('/assets/levels/wealth/file_00000000fdf4820aab3743b119988a10.png')",backgroundRepeat:'no-repeat',backgroundSize:`${2172*z}px ${724*z}px`,backgroundPosition:`-${x*z}px -${y*z}px`}}/></span>}


  if (kind === 'badge' && (track === 'wealth' || track === 'charm')) {
    const milestones = [1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,120,140,160,180,200];
    const milestone = [...milestones].reverse().find(n => level >= n) ?? 1;
    const index = milestones.indexOf(milestone);
    const lastRow = index >= 19;
    const column = lastRow ? index - 19 : index % 10;
    const row = lastRow ? 2 : Math.floor(index / 10);
    const sheet = track === 'wealth'
      ? '/assets/levels/wealth/file_00000000fdf4820aab3743b119988a10.png'
      : '/assets/levels/charm/file_000000000cb082109d892cd030b6ce6d.png';
    return <div role="img" aria-label={`شارة ${track === 'wealth' ? 'الثروة' : 'الجاذبية'} تصميم مستوى ${milestone}`}
      title={`المستوى الفعلي ${level}، تصميم الشارة ${milestone}`}
      className="relative inline-flex shrink-0 overflow-hidden"
      style={{width:size,height:size,backgroundImage:`url("${sheet}")`,
        backgroundRepeat:'no-repeat',backgroundColor:'#000',
        backgroundSize:lastRow?'500% 300%':'1000% 300%',
        backgroundPosition:`${lastRow ? column * 25 : column * (100/9)}% ${row*50}%`}} />;
  }
  return <div className={`royal-emblem relative inline-flex shrink-0 items-center justify-center ${animated ? "royal-emblem-animated" : ""}`} style={{ width: size, height: size }} aria-label={`${kind === 'badge' ? 'شارة' : 'إطار'} ${track} مستوى ${level}`}>
    {animated && <span aria-hidden="true" className="absolute inset-1 rounded-full opacity-30 motion-safe:animate-pulse" style={{ boxShadow: `0 0 18px 3px ${palette.glow}` }} />}
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Royal ${track} level ${level}`}>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.glow} />
          <stop offset="48%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>
      </defs>
      {kind === 'badge' && track === 'wealth' && <>
        <g className="royal-emblem-wings" fill={`url(#${id}-metal)`} stroke={palette.secondary} strokeWidth="1.1">
          <path d="M31 32 Q12 7 4 28 Q8 28 12 37 Q3 33 5 46 Q13 43 21 53 L35 61 Z" />
          <path d="M69 32 Q88 7 96 28 Q92 28 88 37 Q97 33 95 46 Q87 43 79 53 L65 61 Z" />
          {tier >= 2 && <><path d="M26 36 Q4 5 2 18 Q6 38 24 56 Z" /><path d="M74 36 Q96 5 98 18 Q94 38 76 56 Z" /></>}
        </g>
        <path d="M50 4 L64 13 L78 13 L89 28 L86 63 L71 82 L50 96 L29 82 L14 63 L11 28 L22 13 L36 13 Z" fill={`url(#${id}-metal)`} stroke={palette.glow} strokeWidth="1.5" />
        <path d="M50 12 L64 20 L75 20 L81 32 L78 60 L65 76 L50 87 L35 76 L22 60 L19 32 L25 20 L36 20 Z" fill="#081713" stroke="#176c4c" strokeWidth="2.5" />
        <path d="M50 12 L64 20 L75 20 L81 32 L78 60 L65 76 L50 87 L35 76 L22 60 L19 32 L25 20 L36 20 Z" fill="none" stroke={palette.glow} strokeWidth=".8" />
        {tier >= 1 && <path d="M31 18 L35 5 L43 13 L50 2 L57 13 L65 5 L69 18 Z" fill={`url(#${id}-metal)`} stroke={palette.glow} strokeWidth="1" />}
        {tier >= 3 && <g fill={palette.primary} stroke={palette.glow} strokeWidth=".6"><path d="M9 57 Q1 70 17 77 L30 81 L21 68 Z" /><path d="M91 57 Q99 70 83 77 L70 81 L79 68 Z" /></g>}
        {tier >= 4 && <g fill={palette.glow}><circle cx="13" cy="38" r="2.5"/><circle cx="87" cy="38" r="2.5"/></g>}
        {tier >= 5 && <g fill={palette.primary}><path d="M0 63 L15 69 L26 85 L9 78 Z"/><path d="M100 63 L85 69 L74 85 L91 78 Z"/></g>}
        <path className="royal-emblem-gem" d="M50 79 L57 86 L50 94 L43 86 Z" fill="#19e4a4" stroke={palette.glow} strokeWidth="1.2" />
        <path d="M50 80 L50 93 L44 86 Z" fill="#a7ffe6" opacity=".8"/>
        <text x="50" y="48" fontSize={level >= 100 ? 12 : 14} fontWeight="800" textAnchor="middle" fill="#fff4ce" fontFamily="Georgia,serif">Lv.</text>
        <text x="50" y="66" fontSize={level >= 100 ? 23 : 27} fontWeight="900" textAnchor="middle" fill="#ffe5a2" fontFamily="Georgia,serif">{level}</text>
        <path className="royal-emblem-shine" d="M22 26 L39 19 L35 27 L20 36 Z" fill="white" opacity=".18"/>
      </>}
      {kind === 'badge' && track !== 'wealth' && <>
        <circle cx="50" cy="50" r="44" fill="#15182e" stroke={`url(#${id}-metal)`} strokeWidth="6" />
        <circle cx="50" cy="50" r="36" fill="none" stroke={palette.glow} strokeWidth="2" />
        <text x="50" y="47" textAnchor="middle" fontSize="13" fill={palette.glow} fontWeight="bold">{track === 'charm' ? 'السحر' : 'الغرفة'}</text>
        <text x="50" y="70" textAnchor="middle" fontSize="28" fill={palette.primary} fontWeight="900">{level}</text>
      </>}
      {kind === 'frame' && <>
        <path d="M37 12 L42 6 L50 12 L58 6 L63 12 L61 20 L39 20 Z" fill={palette.primary} stroke={palette.glow} strokeWidth="1" />
        <rect x="36" y="83" width="28" height="13" rx="5" fill={palette.secondary} stroke={palette.glow} strokeWidth="1.5" />
        <text x="50" y="92.5" fontSize="9" fontWeight="900" textAnchor="middle" fill={palette.glow}>{level}</text>
      </>}

    </svg>

    {level >= 150 && <Sparkles className="absolute -right-1 top-1 h-4 w-4 motion-safe:animate-pulse" color={palette.glow} aria-hidden="true" />}
  </div>;
};
