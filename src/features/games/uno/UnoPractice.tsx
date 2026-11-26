import { useEffect, useState } from 'react';
import { applyMove, botMove, canPlay, colors, createRound, type Card, type Color, type Move } from './rules';

const appearance: Record<Color, { name: string; className: string }> = {
  red: { name: 'أحمر', className: 'bg-red-700' },
  yellow: { name: 'أصفر', className: 'bg-amber-300 text-amber-950' },
  green: { name: 'أخضر', className: 'bg-emerald-700' },
  blue: { name: 'أزرق', className: 'bg-blue-700' },
};
const ranks = { skip: 'تخطي', reverse: 'عكس', draw2: '+2', wild: 'تغيير اللون', wild4: '+4' };
const button = 'min-h-11 rounded-xl border border-amber-300/40 px-3 py-2 disabled:opacity-50';
const label = (card: Card) => typeof card.rank === 'number' ? String(card.rank) : ranks[card.rank];

function Face({ card }: { card: Card }) {
  if (card.rank === 'wild4') return <img src="/assets/games/stage6/uno-wild4.png" className="h-14 max-w-full object-contain" alt="" />;
  return <span className="grid min-h-14 place-items-center text-sm font-bold">{label(card)}</span>;
}

export function UnoPractice({ paused }: { paused: boolean }) {
  const [round, setRound] = useState(() => createRound());
  const [wild, setWild] = useState<number | null>(null);
  const act = (move: Move) => {
    setRound(current => applyMove(current, 0, move));
    setWild(null);
  };

  useEffect(() => {
    if (paused || round.turn !== 1 || round.winner !== null) return;
    const timer = window.setTimeout(() => setRound(current => applyMove(current, 1, botMove(current))), 650);
    return () => window.clearTimeout(timer);
  }, [paused, round]);

  const top = round.discard[round.discard.length - 1];
  const myTurn = round.winner === null && round.turn === 0;
  return <div className="space-y-3 text-sm">
    <p className="text-amber-200">تدريب محلي ضد الكمبيوتر</p>
    <p role="status">
      {round.winner === 0 ? 'فزت بالجولة!' : round.winner === 1 ? 'فاز الكمبيوتر' : myTurn ? 'دورك' : 'دور الكمبيوتر'}
      {' · '}قطع الكمبيوتر {round.hands[1].length}
    </p>
    <div className="flex items-center gap-3 rounded-xl bg-black/30 p-3">
      <span role="img" aria-label={`آخر بطاقة: ${label(top)}`}
        className={`w-16 rounded-lg border border-white/70 p-1 ${top.color ? appearance[top.color].className : 'bg-neutral-900'}`}><Face card={top} /></span>
      <p>اللون الحالي: {appearance[round.color].name}<br />أوراق السحب: {round.stock.length}</p>
    </div>
    {wild !== null && <div className="flex flex-wrap items-center gap-2" aria-label="اختيار اللون">
      {colors.map(color => <button key={color} type="button" className={`${button} ${appearance[color].className}`}
        onClick={() => act({ kind: 'play', id: wild, color })}>{appearance[color].name}</button>)}
      <button type="button" className={button} onClick={() => setWild(null)}>إلغاء</button>
    </div>}
    <div className="grid grid-cols-4 gap-2" aria-label="أوراقك">
      {round.hands[0].map(card => <button key={card.id} type="button"
        aria-label={`${label(card)}${card.color ? '، ' + appearance[card.color].name : ''}`}
        className={`grid min-w-0 place-items-center rounded-lg border border-white/70 p-1 disabled:opacity-45 ${card.color ? appearance[card.color].className : 'bg-neutral-900'}`}
        disabled={!canPlay(round, 0, card) || wild !== null}
        onClick={() => card.color ? act({ kind: 'play', id: card.id }) : setWild(card.id)}><Face card={card} /></button>)}
    </div>
    <div className="flex flex-wrap gap-2">
      {round.winner === null ? <>
        <button type="button" className={button} disabled={!myTurn || round.drawn !== null || wild !== null}
          onClick={() => act({ kind: 'draw' })}>اسحب بطاقة</button>
        <button type="button" className={button} disabled={!myTurn || round.drawn === null || wild !== null}
          onClick={() => act({ kind: 'pass' })}>مرّر الدور</button>
      </> : <button type="button" className={button} onClick={() => { setWild(null); setRound(createRound()); }}>جولة جديدة</button>}
    </div>
    <details><summary>قواعد التدريب</summary>
      <p>طابق اللون أو الرقم أو الرمز. في مباراة لاعبين، تعيد بطاقة العكس الدور إليك مثل التخطي. يمكن لعب +4 فقط عندما تخلو يدك من اللون الحالي. تنتهي الجولة عند نفاد أوراق أحد اللاعبين.</p>
    </details>
  </div>;
}
