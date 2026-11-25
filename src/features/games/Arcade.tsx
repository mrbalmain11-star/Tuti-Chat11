import { WinNotice } from './WinNotice';
import { useRef, useState } from 'react';
import { gameName, playArcade, type ArcadeInput, type Round } from './api';

const foods = ['🍕 بيتزا', '🍗 دجاج', '🍅 طماطم', '🌽 ذرة', '🐟 سمك', '🥕 جزر', '🍤 روبيان', '🥗 سلطة'];
const hands = ['أ', 'ب', 'ج'];
const wheel = ['0×', '0.5×', '1×', '0×', '2×', '0×', '4×', '0×'];
const symbols = { slot: ['7️⃣', '🔔', '⭐', '💎', '👑', '🪙'], fruit: ['🍒', '🍇', '🍋', '🍉', '🍊', '🍓'] };
const picks: Record<string, { label: string; values: [number, string][] }> = {
  greedy: { label: 'اختر الأكلة', values: foods.map((name, index) => [index, name]) },
  teen_patti: { label: 'اختر اليد الفائزة', values: hands.map((name, index) => [index, name]) },
  roulette: { label: 'اختر الرقم', values: Array.from({ length: 37 }, (_, number) => [number, String(number)]) },
  crash: { label: 'اختر مضاعف الخروج التلقائي', values: [125, 150, 200, 300, 500, 1000].map(value => [value, value / 100 + '×']) },
};

function Result({ round }: { round: Round }) {
  const result = round.arcade;
  if (!result) return null;
  const drawn = result.draw ?? [];
  const scores = result.scores ?? [];
  if (round.game_code === 'teen_patti') return <div className="grid grid-cols-3 gap-1" dir="ltr">
    {hands.map((hand, index) => <div key={hand} className={scores[index] === result.outcome ? 'text-amber-300' : ''}>
      {hand}<div className="whitespace-nowrap text-xs">{drawn.slice(index * 3, index * 3 + 3).map(card =>
        (['2','3','4','5','6','7','8','9','10','J','Q','K','A'][card % 13] + ['♠', '♥', '♦', '♣'][Math.floor(card / 13)])).join(' ')}</div>
    </div>)}
  </div>;
  if (round.game_code === 'slot' || round.game_code === 'fruit') {
    const reel = symbols[round.game_code];
    return <p className="text-3xl" aria-label="نتيجة البكرات">{drawn.map(value => reel[value]).join(' ')}</p>;
  }
  const value = round.game_code === 'greedy' ? foods[result.outcome]
    : round.game_code === 'lucky_wheel' ? wheel[result.outcome]
    : round.game_code === 'crash' ? (result.outcome / 100).toFixed(2) + '×' : result.outcome;
  return <p className="text-xl text-amber-200">النتيجة <bdi>{value}</bdi></p>;
}

export function Arcade({ code, accountId, history, enabled, onRound }: {
  code: string; accountId: string; history: Round[]; enabled: boolean; onRound: (round: Round) => void;
}) {
  const options = picks[code];
  const key = `totichat.practice.arcade.${accountId}.${code}`;
  const [pending, setPending] = useState<ArcadeInput | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(key) ?? 'null') as ArcadeInput | null; }
    catch { return null; }
  });
  const [pick, setPick] = useState(pending?.p_pick ?? options?.values[0][0] ?? 0);
  const [stake, setStake] = useState(pending?.p_stake ?? 10);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<Round>();
  const [win, setWin] = useState<Round>();
  const inFlight = useRef(false);
  const rounds = history.filter(round => round.game_code === code);
  const result = latest ?? rounds[0];

  function remember(input: ArcadeInput | null) {
    setPending(input);
    try {
      if (input) sessionStorage.setItem(key, JSON.stringify(input));
      else sessionStorage.removeItem(key);
    } catch { /* Retry remains available while the panel is open. */ }
  }

  async function play() {
    if (inFlight.current || (!enabled && !pending)) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setWin(undefined);
    try {
      const input = pending ?? { p_code: code, p_request: crypto.randomUUID(), p_stake: stake, p_pick: pick };
      remember(input);
      const round = await playArcade(input);
      remember(null);
      setLatest(round);
      if (round.reward > round.stake) setWin(round);
      onRound(round);
    } catch (cause) {
      const message = (cause as Error).message;
      const labels: Record<string, string> = {
        GAMES_DISABLED: 'اللعبة متوقفة حالياً.',
        GAMES_INSUFFICIENT_BALANCE: 'الرصيد التجريبي غير كافٍ.',
        GAMES_INVALID_STAKE: 'كمية اللعب خارج الحدود.',
        GAMES_INVALID_INPUT: 'إعدادات الجولة غير صالحة.',
        GAMES_REQUEST_CONFLICT: 'تعذر مطابقة الطلب المحفوظ.',
      };
      if (labels[message]) remember(null);
      setError(labels[message] ?? 'تعذر تأكيد الجولة. أعد محاولة نفس الطلب.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <section className="space-y-3 rounded-2xl border border-amber-500/40 bg-emerald-950 p-3 text-center">
    {win && <WinNotice game={gameName(code)} prize={win.reward} onClose={() => setWin(undefined)} />}
    <p className="font-bold">{gameName(code)} · وضع تجريبي</p>
    {options && <label className="flex items-center justify-between gap-2">{options.label}
      <select className="rounded-lg bg-emerald-900 px-2 py-1" value={pick} onChange={event => setPick(Number(event.target.value))} disabled={busy || !!pending}>
        {options.values.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>}
    <label className="flex items-center justify-between gap-2">عملات الجولة التجريبية
      <select className="rounded-lg bg-emerald-900 px-2 py-1" value={stake} onChange={event => setStake(Number(event.target.value))} disabled={busy || !!pending}>
        {[10, 25, 50, 100, 250, 500, 1000].map(value => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>
    <button type="button" className="w-full rounded-xl bg-emerald-600 p-2 font-bold disabled:opacity-50"
      onClick={() => void play()} disabled={busy || (!enabled && !pending)}>
      {busy ? 'جارٍ حساب الجولة…' : pending ? 'إعادة المحاولة' : 'العب الآن'}
    </button>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {result && <div role="status" className="space-y-1 rounded-xl bg-black/20 p-2">
      <Result round={result} />
      <p>الجائزة <bdi>{result.reward.toLocaleString('ar-IQ-u-nu-latn')}</bdi></p>
    </div>}
    {rounds.length > 0 && <details className="text-sm">
      <summary>سجل الجولات</summary>
      {rounds.map(round => <p key={round.request_id}>{round.stake} عملة · الجائزة {round.reward}</p>)}
    </details>}
  </section>;
}
