import { useEffect, useRef, useState } from 'react';
import { newKnifeRound, rotateTarget, targetCount, throwAtTarget, type KnifeRound } from './rules';

export function KnifePractice({ paused }: { paused: boolean }) {
  const current = useRef<KnifeRound | null>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const timestamp = useRef<number | null>(null);
  const [round, setRound] = useState<KnifeRound>();
  const [best, setBest] = useState(0);
  const active = round !== undefined && !round.over;

  useEffect(() => {
    if (!active || paused) return;
    let frame = 0;
    const update = (time: number) => {
      const state = current.current;
      if (!state || state.over) return;
      const elapsed = timestamp.current === null ? 0 : Math.min(time - timestamp.current, 50);
      const next = rotateTarget(state, elapsed);
      timestamp.current = time;
      current.current = next;
      if (wheel.current) wheel.current.style.transform = `rotate(${next.angle}rad)`;
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => {
      window.cancelAnimationFrame(frame);
      timestamp.current = null;
    };
  }, [active, paused]);

  function start() {
    const next = newKnifeRound();
    current.current = next;
    if (wheel.current) wheel.current.style.transform = 'rotate(0rad)';
    setRound(next);
  }

  function launch() {
    if (!current.current || paused) return;
    const next = throwAtTarget(current.current);
    current.current = next;
    setRound(next);
    if (next.over) setBest(value => Math.max(value, next.score));
  }

  return <div className="space-y-3 text-sm">
    <p className="text-amber-200">تدريب محلي · أطلق نحو الفراغ بين العلامات</p>
    <div className="flex flex-wrap justify-between gap-2">
      <span>المستوى {round?.level ?? 1}</span>
      <span>النقاط {round?.score ?? 0}</span>
      <span>أفضل نتيجة {best}</span>
    </div>
    <div className="grid min-h-60 place-items-center overflow-hidden rounded-2xl border border-amber-300/40 bg-emerald-950 bg-cover bg-center"
      style={{ backgroundImage: 'linear-gradient(#062d25aa, #062d25cc), url(/assets/games/stage6/knife-board.webp)' }}>
      <div className="relative h-44 w-44">
        <div ref={wheel} className="absolute inset-5 rounded-full border-4 border-amber-500/80 bg-[#77451f] shadow-lg [background:repeating-radial-gradient(circle,#8b5024_0_8px,#9e6330_9px_12px)]"
          aria-hidden="true">
          {round?.marks.map((angle, index) => <span key={index}
            className="absolute start-1/2 top-1/2 h-1.5 w-[calc(50%+11px)] origin-left rounded-e bg-gradient-to-r from-transparent from-75% to-amber-100"
            style={{ left: '50%', right: 'auto', transform: `rotate(${angle}rad)` }} />)}
        </div>
        <div className="absolute start-1/2 top-[calc(100%-12px)] h-6 w-0.5 bg-amber-100" aria-hidden="true" />
      </div>
    </div>
    {active ? <>
      <p>إصابات المستوى: {round.marks.length} / {targetCount(round.level)}</p>
      <button type="button" disabled={paused} onClick={launch}
        className="min-h-12 w-full rounded-xl border border-amber-300 bg-emerald-900 font-bold">أطلق</button>
    </> : <>
      {round?.over && <p role="status">انتهت الجولة · {round.score} نقطة</p>}
      <button type="button" onClick={start}
        className="min-h-12 w-full rounded-xl border border-amber-300 bg-emerald-900 font-bold">{round ? 'العب مرة أخرى' : 'ابدأ الجولة'}</button>
    </>}
  </div>;
}
