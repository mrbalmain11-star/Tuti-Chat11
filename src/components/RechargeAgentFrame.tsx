import { UserRound } from 'lucide-react';

const leafAngles = [-59, -42, -25, -8, 9, 26];
export function RechargeAgentFrame({ avatar }: { avatar: string }) {
  return <div className="tu-agent-frame" aria-hidden="true">
    <UserRound className="tu-avatar-fallback" />
    {avatar && <img src={avatar} alt="" onError={event => { event.currentTarget.hidden = true; }} />}
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="48" r="43" stroke="#ffe6a1" strokeWidth="2" />
      <circle cx="50" cy="48" r="40" stroke="#b47718" strokeWidth="1.5" />
      <g fill="#e9b547" stroke="#fff0ad" strokeWidth=".6">
        {leafAngles.flatMap(angle => [-1, 1].map(side =>
          <path key={side + ':' + angle} transform={'rotate(' + side * angle + ' 50 48)'} d={side === 1 ? 'M50 91 Q58 77 66 77 Q63 88 50 91Z' : 'M50 91 Q42 77 34 77 Q37 88 50 91Z'} />,
        ))}
      </g>
      <path d="m50 88 6 6-6 5-6-5Z" fill="#2dd4a0" stroke="#ffde83" strokeWidth="2" />
    </svg>
  </div>;
}
