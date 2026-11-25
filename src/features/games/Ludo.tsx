import { WinNotice } from './WinNotice';
import { useState } from 'react';

export const track = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
];
const finish = 56;
const safe = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const base = () => [-1, -1, -1, -1];
const dieRoll = () => Math.floor(Math.random() * 6) + 1;
const valid = (positions: number[], die: number) => positions.flatMap((position, index) =>
  (position < 0 ? die === 6 : position < finish && position + die <= finish) ? [index] : []);

function move(own: number[], other: number[], index: number, die: number, offset: number) {
  const position = own[index] < 0 ? 0 : own[index] + die;
  const square = (position + offset) % 52;
  const opponentOffset = (offset + 26) % 52;
  const captured = position < 51 && !safe.has(square);
  return [
    own.map((value, i) => i === index ? position : value),
    other.map(value => captured && value >= 0 && value < 51 && (value + opponentOffset) % 52 === square ? -1 : value),
  ] as const;
}

export function squareFor(position: number, index: number, bot: boolean) {
  if (position < 0) return [2 + (index >> 1) + (bot ? 9 : 0), 2 + index % 2 + (bot ? 9 : 0)];
  if (position >= 51) return [7, bot ? 13 - (position - 51) : 1 + (position - 51)];
  return track[(position + (bot ? 26 : 0)) % 52];
}

export function Ludo({ enabled }: { enabled: boolean }) {
  const [player, setPlayer] = useState(base);
  const [bot, setBot] = useState(base);
  const [die, setDie] = useState(0);
  const [message, setMessage] = useState('ارمِ النرد، تحتاج 6 لإخراج قطعة.');
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const choices = die ? valid(player, die) : [];

  function botTurn(currentPlayer: number[], currentBot: number[], prefix = '') {
    let yours = currentPlayer;
    let theirs = currentBot;
    let roll: number;
    do {
      roll = dieRoll();
      const moves = valid(theirs, roll);
      const index = moves.find(i => theirs[i] < 0) ?? moves.sort((a, b) => theirs[b] - theirs[a])[0];
      if (index !== undefined) [theirs, yours] = move(theirs, yours, index, roll, 26);
      if (theirs.every(position => position === finish)) {
        setFinished(true);
        setMessage('فاز الكمبيوتر.');
        break;
      }
      setMessage(prefix + 'رمية الكمبيوتر: ' + roll + ' · دورك');
    } while (roll === 6);
    setPlayer(yours);
    setBot(theirs);
  }

  function roll() {
    const value = dieRoll();
    if (valid(player, value).length) {
      setDie(value);
      setMessage('رميتك: ' + value + ' · اختر قطعة.');
    } else {
      botTurn(player, bot, 'رميتك: ' + value + ' · ماكو حركة. ');
    }
  }

  function play(index: number) {
    if (!choices.includes(index)) return;
    const [nextPlayer, nextBot] = move(player, bot, index, die, 0);
    setDie(0);
    if (nextPlayer.every(position => position === finish)) {
      setPlayer(nextPlayer);
      setFinished(true);
      setMessage('انتهت المباراة.');
      setWon(true);
    } else if (die === 6) {
      setPlayer(nextPlayer);
      setBot(nextBot);
      setMessage('جبت 6، ارمِ مرة ثانية.');
    } else botTurn(nextPlayer, nextBot);
  }

  const pieces = (positions: number[], computer: boolean) => positions.map((position, index) => {
    const [row, column] = squareFor(position, index, computer);
    const style = { gridRow: row + 1, gridColumn: column + 1, transform: index % 2 ? 'translateX(16%)' : undefined };
    return computer ? <span key={index} style={style} className="z-10 rounded-full bg-amber-400 text-[9px] text-black">{index + 1}</span>
      : <button type="button" key={index} style={style} disabled={!choices.includes(index) || !enabled}
        aria-label={'حرّك القطعة ' + (index + 1)} className="z-10 rounded-full bg-emerald-500 text-[9px] font-bold disabled:bg-emerald-800"
        onClick={() => play(index)}>{index + 1}</button>;
  });

  return <section className="space-y-3 rounded-xl border border-amber-500/40 bg-emerald-950 p-3 text-center">
    {won && <WinNotice game="لودو" onClose={() => setWon(false)} />}
    <h3 className="font-bold">لودو ضد الكمبيوتر</h3>
    <div dir="ltr" className="mx-auto grid aspect-square max-w-xs gap-px rounded bg-black/30 p-1"
      style={{ gridTemplate: 'repeat(15,minmax(0,1fr)) / repeat(15,minmax(0,1fr))' }}>
      {track.map(([row, column], index) => <span key={index} style={{ gridRow: row + 1, gridColumn: column + 1 }}
        className={safe.has(index) ? 'bg-amber-200/40' : 'bg-white/20'} />)}
      {Array.from({ length: 6 }, (_, index) => <span key={index} className="bg-emerald-700/35" style={{ gridRow: 8, gridColumn: index + 2 }} />)}
      {Array.from({ length: 6 }, (_, index) => <span key={index} className="bg-amber-500/35" style={{ gridRow: 8, gridColumn: index + 9 }} />)}
      {pieces(bot, true)}
      {pieces(player, false)}
    </div>
    <p role="status" className="text-sm">{message}</p>
    {choices.length > 0 && <div className="flex flex-wrap justify-center gap-2">
      {choices.map(index => <button type="button" key={index} disabled={!enabled}
        className="rounded-lg bg-emerald-800 px-3 py-1" onClick={() => play(index)}>حرّك القطعة {index + 1}</button>)}
    </div>}
    <button type="button" disabled={!enabled || die > 0} className="w-full rounded-xl bg-emerald-600 p-2 font-bold disabled:opacity-50"
      onClick={() => {
        if (finished) { setPlayer(base()); setBot(base()); setFinished(false); setWon(false); setMessage('ارمِ النرد للبدء.'); }
        else roll();
      }}>{finished ? 'مباراة جديدة' : 'ارمِ النرد'}</button>
  </section>;
}
