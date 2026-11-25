import { useEffect, useRef, useState } from 'react';
import { moveSharedLudo, type LudoMatch } from './api';
import { squareFor, track } from './Ludo';

export function SharedLudoBoard({ match, serverTime, refresh }: { match: LudoMatch; serverTime: string; refresh: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [sent, setSent] = useState<number>();
  const [error, setError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    const end = performance.now() + Date.parse(match.deadline) - Date.parse(serverTime);
    const tick = () => setSeconds(Math.max(0, Math.ceil((end - performance.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [match.deadline, serverTime]);
  const mine = match.turn === match.seat;
  const choices = (match.seat === 1 ? match.pieces_one : match.pieces_two).flatMap((position, i) =>
    (position === -1 ? match.die === 6 : position + match.die <= 56) ? [i + 1] : []);
  async function play(piece: number | null) {
    if (lock.current || !mine || !seconds || sent === match.turn_number) return;
    lock.current = true;
    setSent(match.turn_number);
    setError('');
    try { await moveSharedLudo(match.starts_at, match.turn_number, piece); }
    catch {
      setSent(undefined);
      setError('تعذر تأكيد الحركة. تُحدّث اللوحة من الخادم.');
    } finally {
      lock.current = false;
      refresh();
    }
  }
  return <>
    <h3 className="font-bold">لودو · مباراة مباشرة</h3>
    <div dir="ltr" className="mx-auto grid aspect-square max-w-xs gap-px rounded bg-black/30 p-1"
      style={{ gridTemplate: 'repeat(15,minmax(0,1fr)) / repeat(15,minmax(0,1fr))' }}>
      {track.map(([row, column], index) => <span key={index} style={{ gridRow: row + 1, gridColumn: column + 1 }} className="bg-white/20" />)}
      {Array.from({ length: 12 }, (_, index) => <span key={'home' + index} className={index < 6 ? 'bg-emerald-600/40' : 'bg-amber-500/40'}
        style={{ gridRow: 8, gridColumn: 2 + index + (index >= 6 ? 1 : 0) }} />)}
      {[match.pieces_one, match.pieces_two].flatMap((positions, seat) => positions.map((position, index) => {
        const [row, column] = squareFor(position, index, seat === 1);
        return <span key={seat + ':' + index} style={{ gridRow: row + 1, gridColumn: column + 1 }}
          className={seat === 0 ? 'z-10 rounded-full bg-emerald-600 text-[9px]' : 'z-10 rounded-full bg-amber-400 text-[9px] text-black'}>{index + 1}</span>;
      }))}
    </div>
    <p role="status">{mine ? 'دورك' : 'دور الخصم'} · النرد <bdi>{match.die}</bdi> · <bdi>{seconds}</bdi> ثانية</p>
    {mine && <div className="flex flex-wrap justify-center gap-2">
      {choices.map(piece => <button key={piece} type="button" disabled={!seconds || sent === match.turn_number}
        className="rounded bg-emerald-800 px-3 py-2 disabled:opacity-50" onClick={() => void play(piece)}>حرّك القطعة {piece}</button>)}
      {!choices.length && <button type="button" disabled={!seconds || sent === match.turn_number}
        className="rounded bg-emerald-800 px-3 py-2 disabled:opacity-50" onClick={() => void play(null)}>مرّر الدور</button>}
    </div>}
    {error && <p role="alert">{error}</p>}
  </>;
}
