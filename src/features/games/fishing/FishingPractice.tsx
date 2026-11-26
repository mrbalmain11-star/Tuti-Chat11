import { useEffect, useRef, useState } from 'react';
import { advanceFishing, catchFish, duration, startFishing, visibleFish, type FishingRound } from './rules';

const fishArt = {
  silver: { emoji: '🐟', label: 'سمكة فضية، نقطة واحدة' },
  tropical: { emoji: '🐠', label: 'سمكة استوائية، نقطة واحدة' },
  puffer: { emoji: '🐡', label: 'سمكة منتفخة، ثلاث نقاط' },
};

export function FishingPractice({ paused }: { paused: boolean }) {
  const [round, setRound] = useState<FishingRound>();
  const [best, setBest] = useState(0);
  const clock = useRef<{ started: number; prior: number } | null>(null);
  const elapsed = useRef(0);
  const active = Boolean(round && round.elapsed < duration);

  useEffect(() => {
    if (paused || !active) return;
    const current = { started: performance.now(), prior: elapsed.current };
    clock.current = current;
    const tick = () => {
      const time = Math.min(duration, current.prior + performance.now() - current.started);
      elapsed.current = time;
      setRound(value => value && advanceFishing(value, time));
    };
    const timer = window.setInterval(tick, 100);
    return () => {
      window.clearInterval(timer);
      elapsed.current = Math.min(duration, current.prior + performance.now() - current.started);
      clock.current = null;
    };
  }, [active, paused]);

  const finished = round?.elapsed === duration;
  const remaining = Math.ceil((duration - (round?.elapsed ?? 0)) / 1000);
  const fish = round ? visibleFish(round) : [];
  return <div className="space-y-3 text-sm">
    <p className="text-amber-200">تدريب محلي · اضغط على السمك قبل أن يختفي</p>
    <div className="flex flex-wrap justify-between gap-2">
      <span>النقاط <bdi>{round?.score ?? 0}</bdi></span>
      <span>الوقت <bdi>{remaining}</bdi> ث</span>
      <span>أفضل نتيجة <bdi>{Math.max(best, finished ? round.score : 0)}</bdi></span>
    </div>
    <div dir="ltr" aria-label="حوض الصيد"
      className="relative grid min-h-60 grid-cols-5 grid-rows-4 overflow-hidden rounded-2xl border border-amber-300/40 bg-[#07544d] bg-cover bg-center p-2"
      style={{ backgroundImage: 'linear-gradient(#062e2a44, #062e2a88), url(/assets/games/stage6/fishing-board.webp)' }}>
      {fish.map(target => <button key={target.id} type="button" aria-label={fishArt[target.kind].label}
        style={{ gridColumn: target.cell % 5 + 1, gridRow: Math.floor(target.cell / 5) + 1 }}
        className="animate-in zoom-in m-1 min-h-11 rounded-xl border border-white/45 bg-teal-950/75 text-2xl active:scale-90 motion-reduce:transform-none"
        disabled={paused}
        onClick={() => {
          const running = clock.current;
          if (!running) return;
          const time = running.prior + performance.now() - running.started;
          setRound(value => value && catchFish(value, target.id, time));
        }}>{fishArt[target.kind].emoji}</button>)}
      {!active && <div dir="rtl" className="absolute inset-0 grid place-items-center bg-emerald-950/70 p-3 text-center">
        <div>
          {finished && <p role="status" className="mb-3 font-bold">انتهت الجولة · {round.score} نقطة</p>}
          <button type="button" className="min-h-11 rounded-xl border border-amber-300 bg-emerald-900 px-4 py-2 font-bold"
            onClick={() => {
              if (finished) setBest(previous => Math.max(previous, round.score));
              elapsed.current = 0;
              setRound(startFishing());
            }}>{finished ? 'العب مرة أخرى' : 'ابدأ الصيد'}</button>
        </div>
      </div>}
    </div>
  </div>;
}
