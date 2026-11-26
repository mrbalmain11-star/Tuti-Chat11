import { Trophy, X } from 'lucide-react';
import { gameAsset, games } from './api';

export function WinNotice({ game, prize, actual = false, onClose }: { game: string; prize?: number; actual?: boolean; onClose: () => void }) {
  const icon = games.find(([, name]) => name === game)?.[2];
  return <aside role="status" aria-live="polite"
    className="relative flex items-center gap-3 rounded-2xl border border-amber-300 bg-gradient-to-l from-emerald-950 to-emerald-800 p-3 text-amber-100">
    {icon ? <img src={gameAsset + icon + '.png'} alt="" className="h-11 w-11 rounded-lg" />
      : <Trophy aria-hidden="true" className="h-8 w-8 shrink-0 text-amber-300" />}
    <div className="flex-1">
      <strong className="block">فزت في {game}!</strong>
      {prize !== undefined && <p className="text-sm">الجائزة <bdi>{prize.toLocaleString('en-US')}</bdi> {actual ? 'كوينز' : 'عملة تجريبية'}</p>}
    </div>
    <button type="button" onClick={onClose} aria-label="إغلاق إشعار الفوز" className="rounded-lg p-2">
      <X aria-hidden="true" className="h-5 w-5" />
    </button>
  </aside>;
}
