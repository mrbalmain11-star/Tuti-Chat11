import { useState } from 'react';
import { discardOkey, drawOkey, startOkey, type Tile } from './rules';

const colors = [
  ['أحمر', 'text-red-800'], ['أزرق', 'text-blue-800'],
  ['أسود', 'text-neutral-900'], ['أصفر', 'text-amber-800'],
];
const button = 'min-h-11 rounded-xl border border-amber-300/40 bg-emerald-900 px-3 py-2 disabled:opacity-50';
const label = (tile: Tile) => `${colors[tile.color][0]} ${tile.value}`;

export function OkeyPractice() {
  const [round, setRound] = useState(() => startOkey());
  const [covered, setCovered] = useState(true);
  const [selected, setSelected] = useState<number>();
  const [error, setError] = useState(false);
  const discard = round.discards.at(-1);
  const player = round.turn + 1;

  function finishTurn(declare: boolean) {
    if (selected === undefined) return;
    const updated = discardOkey(round, selected, declare);
    if (updated === round) {
      setError(declare);
      return;
    }
    setRound(updated);
    setSelected(undefined);
    setError(false);
    setCovered(true);
  }

  return <div className="space-y-3 text-sm">
    <p className="text-amber-200">تدريب محلي للاعبين يتناوبان على نفس الجهاز</p>
    {round.result !== null ? <>
      <p role="status">{round.result === 'draw' ? 'انتهت قطع السحب · تعادل' : `فاز اللاعب ${round.result + 1}`}</p>
      <button type="button" className={button} onClick={() => {
        setRound(startOkey());
        setCovered(true);
        setSelected(undefined);
        setError(false);
      }}>جولة جديدة</button>
    </> : covered ? <div className="rounded-xl bg-black/25 p-4">
      <p className="mb-2">سلّم الجهاز للاعب {player} قبل عرض قطعه.</p>
      <button type="button" className={button} onClick={() => setCovered(false)}>عرض القطع</button>
    </div> : <>
      <p role="status">اللاعب {player} · {round.drawn ? 'اختر قطعة للرمي' : 'اسحب قطعة'}</p>
      <p>المخزون {round.stock.length} · آخر قطعة مرمية: {discard ? label(discard) : '—'}</p>
      {!round.drawn && <div className="flex flex-wrap gap-2">
        <button type="button" className={button}
          onClick={() => setRound(drawOkey(round, 'stock'))}>{round.stock.length ? 'اسحب من المخزون' : 'إنهاء الجولة'}</button>
        <button type="button" className={button} disabled={!discard}
          onClick={() => setRound(drawOkey(round, 'discards'))}>خذ القطعة المرمية</button>
      </div>}
      <div className="grid grid-cols-5 gap-2" aria-label="قطعك">
        {[...round.hands[round.turn]].sort((a, b) => a.color - b.color || a.value - b.value).map(tile =>
          <button key={tile.id} type="button" aria-label={label(tile)} aria-pressed={selected === tile.id}
            disabled={!round.drawn}
            style={{ backgroundImage: 'url(/assets/games/stage6/okey-tile.webp)' }}
            className={`min-h-11 rounded-lg border-2 bg-amber-100 bg-cover bg-center text-base font-black ${colors[tile.color][1]} ${selected === tile.id ? 'border-amber-500' : 'border-transparent'}`}
            onClick={() => { setSelected(tile.id); setError(false); }}>{tile.value}</button>)}
      </div>
      {round.drawn && <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={selected === undefined} onClick={() => finishTurn(false)}>ارمِ القطعة</button>
        <button type="button" className={button} disabled={selected === undefined} onClick={() => finishTurn(true)}>ارمِ وأعلن الفوز</button>
      </div>}
      {error && <p role="alert" className="text-rose-300">القطع المتبقية لا تكوّن تشكيلة فائزة.</p>}
    </>}
    <details><summary>قواعد التدريب</summary>
      <p>كوّن مجموعات من ثلاثة أو أربعة ألوان للرقم نفسه، أو سلاسل من ثلاث قطع متتالية فأكثر من لون واحد، أو سبعة أزواج متطابقة. يمكن استخدام ١ في بداية السلسلة أو بعد ١٣. هذا الوضع يستخدم القطع المرقمة فقط.</p>
    </details>
  </div>;
}
