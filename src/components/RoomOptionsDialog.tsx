import { useId } from 'react';
import { ExternalLink, LogOut, SquareMinus, X } from 'lucide-react';
import './room-options-dialog.css';

export function RoyalOrnament({ top = false }: { top?: boolean }) {
  const gold = useId();
  const green = useId();
  return <svg viewBox="0 0 320 100" className={top ? 'room-options-crest' : 'room-options-finial'} aria-hidden="true">
    <defs>
      <linearGradient id={gold} x2=".4" y2="1">
        <stop stopColor="#fff2a0" /><stop offset=".31" stopColor="#bd6710" />
        <stop offset=".48" stopColor="#ffea86" /><stop offset=".75" stopColor="#cf861c" /><stop offset="1" stopColor="#692b08" />
      </linearGradient>
      <linearGradient id={green} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#d1ffcf" /><stop offset=".27" stopColor="#35e2a2" />
        <stop offset=".54" stopColor="#075f44" /><stop offset=".83" stopColor="#02a779" /><stop offset="1" stopColor="#003123" />
      </linearGradient>
    </defs>
    <path d="M3 71C66 71 60 29 120 56L160 67 200 56C260 29 254 71 317 71Q266 97 215 73L160 76 105 73Q54 97 3 71Z" fill={'url(#' + green + ')'} />
    <path d="M4 72C49 65 62 101 119 70Q146 53 160 67Q174 53 201 70C258 101 271 65 316 72 276 78 260 108 200 77Q174 64 160 76Q146 64 120 77C60 108 44 78 4 72Z" fill={'url(#' + gold + ')'} stroke="#ffe791" strokeWidth="1" />
    {top && <path d="M120 24Q151 57 147 25L160 3 173 25Q169 57 200 24L187 59Q160 48 133 59Z" fill={'url(#' + gold + ')'} stroke="#ffeaa0" strokeWidth="2" />}
    <path d="M160 43l22 27-22 29-22-29Z" fill={'url(#' + gold + ')'} stroke="#fff093" />
    <path d="M160 50l15 20-15 20-15-20Z" fill={'url(#' + green + ')'} stroke="#fff5aa" strokeWidth="1.3" />
    <path d="M160 51l-7 19 7 20 7-20Z" fill="#7dfdc8" opacity=".55" />
  </svg>;
}

function Laurel() {
  return <svg viewBox="0 0 36 42" className="room-options-laurel" aria-hidden="true" fill="currentColor">
    <path d="M5 1c1 10 13 15 16 22C9 20 4 10 5 1Zm-4 12c6 6 16 8 24 16C11 28 4 23 1 13Zm5 13 24 9C16 36 10 32 6 26Zm9 10 20 4c-9 2-16 0-20-4Z" />
  </svg>;
}

type Props = { open: boolean; onClose: () => void; onMinimize: () => void; onLeave: () => void };

export function RoomOptionsDialog({ open, onClose, onMinimize, onLeave }: Props) {
  const title = useId();
  return <div className="room-options-overlay" data-open={open} inert={!open} aria-hidden={!open || undefined} onClick={onClose}>
    <section className="room-options-panel" dir="rtl" role="dialog" aria-modal={open || undefined} aria-labelledby={title}
      onClick={event => event.stopPropagation()}>
      <RoyalOrnament top />
      <header className="room-options-header">
        <button type="button" className="room-options-close" onClick={onClose} aria-label="إغلاق خيارات الغرفة"><X /></button>
        <Laurel /><h3 id={title}>خيارات الغرفة</h3><Laurel />
      </header>
      <div className="room-options-actions">
        <button type="button" className="room-options-action room-options-return" onClick={onClose}>
          <ExternalLink aria-hidden="true" />العودة إلى الغرفة
        </button>
        <button type="button" className="room-options-action room-options-minimize" onClick={onMinimize}>
          <SquareMinus aria-hidden="true" />تصغير الغرفة
        </button>
        <button type="button" className="room-options-action room-options-leave" onClick={onLeave}>
          <LogOut aria-hidden="true" />الخروج من الغرفة
        </button>
      </div>
      <RoyalOrnament />
    </section>
  </div>;
}
