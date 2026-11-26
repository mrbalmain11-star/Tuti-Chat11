import { useState } from 'react';
import { playBluff, resolveBluff, startBluff } from './rules';

const button = 'min-h-11 rounded-xl border border-amber-300/50 bg-emerald-950/85 px-3 py-2 disabled:opacity-50';

export function LiarsPractice() {
  const [round, setRound] = useState(() => startBluff());
  const [covered, setCovered] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const lastHandEmpty = round.last && round.hands[round.last.player].length === 0;
  return <div className="space-y-3 text-sm">
    <p className="text-amber-200">تدريب محلي للاعبين على نفس الجهاز</p>
    <div className="min-h-52 space-y-3 rounded-2xl border border-amber-300/40 bg-emerald-950 bg-cover bg-center p-3"
      style={{ backgroundImage: 'linear-gradient(#062d25bb,#062d25ee), url(/assets/games/stage6/liars-bar-board.webp)' }}>
      <p>الورقة المطلوبة: <bdi>{round.target}</bdi></p>
      {round.winner !== null ? <>
        <p role="status">فاز اللاعب {round.winner + 1}</p>
        {round.revealed.length > 0 && <p>الأوراق المكشوفة: <bdi>{round.revealed.join(' · ')}</bdi></p>}
        <button type="button" className={button} onClick={() => {
          setRound(startBluff());
          setCovered(true);
          setSelected([]);
        }}>جولة جديدة</button>
      </> : covered ? <>
        <p>سلّم الجهاز للاعب {round.turn + 1}.</p>
        <button type="button" className={button} onClick={() => setCovered(false)}>اعرض أوراقي</button>
      </> : <>
        <p role="status">دور اللاعب {round.turn + 1}{round.last && ` · ورق الخصم المقلوب: ${round.last.cards.length}`}</p>
        <div className="grid grid-cols-6 gap-1">
          {round.hands[round.turn].map(card => <button key={card.id} type="button"
            className="min-h-12 rounded-lg border border-amber-300 bg-amber-50 font-bold text-emerald-950 aria-pressed:bg-amber-400"
            aria-pressed={selected.includes(card.id)} disabled={Boolean(lastHandEmpty)}
            onClick={() => setSelected(items => items.includes(card.id) ? items.filter(id => id !== card.id)
              : items.length < 3 ? [...items, card.id] : items)}>{card.rank}</button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {lastHandEmpty ? <button type="button" className={button} onClick={() => setRound(resolveBluff(round, round.turn, false))}>اقبل نتيجة الجولة</button>
            : <button type="button" className={button} disabled={!selected.length} onClick={() => {
              setRound(playBluff(round, round.turn, selected));
              setSelected([]);
              setCovered(true);
            }}>العب مقلوب</button>}
          {round.last && <button type="button" className={button}
            onClick={() => setRound(resolveBluff(round, round.turn, true))}>اعترض</button>}
        </div>
      </>}
    </div>
    <details><summary>طريقة اللعب</summary>
      <p>العب من ورقة إلى ثلاث مقلوبة. إذا اعترض الخصم وكانت كل الأوراق مطابقة للرتبة المطلوبة، تفوز. إذا ظهر بينها ورق مختلف، يفوز الخصم. عند نفاد يدك يختار الخصم الاعتراض أو قبول النتيجة.</p>
    </details>
  </div>;
}
