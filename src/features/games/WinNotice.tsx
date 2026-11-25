import { Trophy, X } from 'lucide-react';

export function WinNotice({ game, prize, onClose }: { game: string; prize?: number; onClose: () => void }) {
  return <aside role="status" aria-live="polite"
    className="relative flex items-center gap-3 rounded-2xl border border-amber-300 bg-gradient-to-l from-emerald-950 to-emerald-800 p-3 text-amber-100">
    <Trophy aria-hidden="true" className="h-8 w-8 shrink-0 text-amber-300" />
    <div className="flex-1">
      <strong className="block">فزت في {game}!</strong>
      {prize !== undefined && <p className="text-sm">الجائزة <bdi>{prize.toLocaleString('en-US')}</bdi> عملة تجريبية</p>}
    </div>
    <button type="button" onClick={onClose} aria-label="إغلاق إشعار الفوز" className="rounded-lg p-2">
      <X aria-hidden="true" className="h-5 w-5" />
    </button>
  </aside>;
}
