import { Armchair, Crown, Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FreeGameHeader, useFreeGame } from '../freeGame';
import { GameWheel } from './components/GameWheel';
import { CarLogoComponent } from './components/CarLogos';
import { CARS, WHEEL_SLOTS, type CarId } from './types/game';
import { sounds } from './utils/soundEffects';
import palace from './assets/palace.webp';

type Result = { slot: number; choice: CarId; won: boolean };

export default function RoyalCars({ accountId }: { accountId: string }) {
  const game = useFreeGame<Result>('royal-cars', accountId);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<Result>();
  const [spinning, setSpinning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [help, showHelp] = useState(false);
  const [choice, setChoice] = useState<CarId>();
  const animation = useRef(0);
  useEffect(() => () => window.clearTimeout(animation.current), []);
  async function spin(car: CarId) {
    if (!game.ready || game.busy || spinning) return;
    setChoice(car);
    setResult(undefined);
    if (!muted) sounds.playSpinStart();
    const draw = await game.play(car);
    if (!draw) return;
    setSpinning(true);
    const steps = 32 + (draw.slot - index + 16) % 16;
    const animate = (step: number) => {
      setIndex((index + step) % WHEEL_SLOTS.length);
      if (!muted) sounds.playWheelTick();
      if (step < steps) animation.current = window.setTimeout(() => animate(step + 1), 36 + 130 * (step / steps) ** 5);
      else {
        setSpinning(false);
        setResult(draw);
        if (draw.won && !muted) sounds.playWinChime();
      }
    };
    animate(1);
  }
  return <div className="relative overflow-hidden rounded-xl bg-cover bg-center p-2" style={{ backgroundImage: `url(${palace})` }}>
    <FreeGameHeader {...game}>
      <button type="button" onClick={() => showHelp(!help)}>التعليمات</button>
      <button type="button" onClick={() => setMuted(!muted)}>{muted ? 'تشغيل الصوت' : 'كتم صوت اللعبة'}</button>
    </FreeGameHeader>
    {help && <p className="rounded bg-black/90 p-3">اختر سيارة لتدور العجلة. إذا توقفت عند سيارتك تفوز بالجولة. كل خانة من الخانات الـ16 متساوية الاحتمال.</p>}
    <div className="my-2 flex items-center justify-around rounded-xl border border-amber-500/60 bg-black/55 p-2 text-amber-200">
      {[1, 2].map(seat => <div key={seat} className="grid justify-items-center text-xs">
        <div className="relative"><Armchair className="size-8" /><Lock className="absolute bottom-0 end-0 size-3" /></div>
        <span>VIP {seat}</span>
      </div>)}
      <p className="text-xs">حجز المقاعد المدفوع غير مفعّل</p>
    </div>
    <GameWheel currentSlotIndex={index} winnerSlotIndex={result?.slot ?? null}
      phase={spinning || game.busy ? 'SPINNING' : result ? 'RESULT' : 'BETTING'}
      countdown={0} userBets={{}} tableBets={{}} selectedChip={0} onPlaceBet={car => { if (!game.retrying) setChoice(car); }} isSpinning={spinning} />
    <div className="grid grid-cols-5 gap-1 rounded-xl bg-black/75 p-2" aria-label="اختيار السيارة">
      {Object.values(CARS).map(car => <button key={car.id} type="button" aria-pressed={choice === car.id}
        disabled={game.busy || spinning || game.retrying} onClick={() => setChoice(car.id)} className="rounded border border-white/20 p-1 text-[10px] aria-pressed:border-amber-400">
        <CarLogoComponent carId={car.id} className="mx-auto size-5" /><span>{car.name}</span>
      </button>)}
    </div>
    <button type="button" className="mt-2 w-full rounded-xl bg-amber-700 p-2 font-bold"
      disabled={!game.ready || !choice || game.busy || spinning} onClick={() => choice && void spin(choice)}>{game.retrying ? 'إعادة المحاولة' : 'دوّر العجلة'}</button>
    {result && <p role="status" className="mt-2 rounded-xl border border-amber-400 bg-black/85 p-3 text-center text-amber-200">
      {result.won ? <><Crown className="mx-auto mb-1 size-7 animate-bounce" /> فزت بالجولة!</> : 'نتيجة الجولة'} · {CARS[WHEEL_SLOTS[result.slot]].name}
    </p>}
  </div>;
}
