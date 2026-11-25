import { useEffect, useRef, useState } from 'react';
import { picks, Result } from './Arcade';
import { gameName, joinSharedRound, type Risk, type SharedRequest, type SharedResult, type SharedSnapshot } from './api';
import { SharedLudoBoard } from './SharedLudoBoard';
import { WinNotice } from './WinNotice';

const fmt = (value: number) => value.toLocaleString('en-US');
const errors: Record<string, string> = {
  GAMES_ROUND_CLOSED: 'انتهى وقت المشاركة. انتظر الجولة التالية.',
  GAMES_INSUFFICIENT_BALANCE: 'رصيدك غير كافٍ.',
  GAMES_POOL_CAPACITY: 'الجوائز المحجوزة بلغت حد المحفظة.',
  GAMES_REQUEST_CONFLICT: 'تعذر مطابقة طلب المشاركة.',
  GAMES_NOT_FUNDED: 'محفظة الألعاب غير ممولة.',
  GAMES_LUDO_FULL: 'اكتمل عدد لاعبي هذه الجولة.',
  GAMES_LUDO_ALREADY_ACTIVE: 'عندك مباراة مسجلة بانتظار التسوية.',
  GAMES_DISABLED: 'اللعبة متوقفة حالياً.',
  GAMES_INVALID_INPUT: 'تحقق من إعدادات الجولة.',
  GAMES_INVALID_ENTRY: 'قيمة المشاركة غير صالحة.',
};
const rulesText: Record<string, string> = {
  ludo: 'لاعبان، قيمة المشاركة 10 كوينز. النرد عادِل من 1 إلى 6. للفائز 20 كوينز. إذا ما اكتمل لاعبان تنرد المشاركة. كل دور 30 ثانية، وعند انتهاء الوقت يُنفذ الخادم حركة صالحة أو يمرر الدور. تُرد المشاركات إذا انتهى حد 240 دوراً بدون فائز.',
  plinko: 'اتجاه الكرة في كل صف مستقل، واحتمال اليمين واليسار 50% لكل جهة. تظهر مضاعفات اختيارك أدناه.',
  greedy: 'تُختار أكلة واحدة من 8 باحتمال متساوٍ. الاختيار الصحيح يدفع 7×.',
  lucky_wheel: '8 خانات متساوية الاحتمال. الجوائز بالترتيب 0×، 0.5×، 1×، 0×، 2×، 0×، 4×، 0×.',
  roulette: 'كل رقم من 0 إلى 36 احتماله 1 من 37. الرقم الصحيح يدفع 36×.',
  crash: 'عند هدف T بالنسب المئوية، عدد قيم السحب التي تبلغ الهدف هو الجزء الصحيح من 97 × 65,536 ÷ T. الجائزة هي المضاعف المختار عند بلوغ الهدف.',
  teen_patti: 'توزّع 9 بطاقات عشوائياً دون تكرار على 3 أيدٍ. اليد الأقوى تدفع 2.7×، والتعادل على أفضل يد يرجع قيمة المشاركة.',
  slot: '3 بكرات مستقلة و6 رموز متساوية الاحتمال لكل بكرة. ثلاثة متطابقة تدفع 18×، ورمزان متطابقان يرجعان قيمة المشاركة.',
  fruit: '3 بكرات مستقلة و6 رموز متساوية الاحتمال لكل بكرة. ثلاثة متطابقة تدفع 18×، ورمزان متطابقان يرجعان قيمة المشاركة.',
};

function SharedOutcome({ code, result }: { code: string; result: SharedResult }) {
  if (result.refunded) return <span>أُلغيت الجولة ورُدّت المشاركات.</span>;
  if (code === 'ludo') return <p>الفائز المقعد <bdi>{result.winner}</bdi></p>;
  if (code === 'plinko') return <bdi aria-label="مسار الكرة">{result.draw.map(step => step ? '↗' : '↖').join(' ')}</bdi>;
  if (result.outcome === null) return null;
  return <Result code={code} result={{ pick: 0, outcome: result.outcome, draw: result.draw, scores: result.scores }} />;
}

function PlinkoBoard({ rows, factors, path }: { rows: number; factors: number[]; path?: number[] }) {
  const [position, setPosition] = useState(0);
  useEffect(() => {
    setPosition(0);
    if (!path?.length) return;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setPosition(step);
      if (step >= rows) window.clearInterval(timer);
    }, 150);
    return () => window.clearInterval(timer);
  }, [path, rows]);
  const drift = path?.slice(0, position).reduce((total, value) => total + 2 * value - 1, 0) ?? 0;
  const bucket = path?.slice(0, rows).reduce((total, value) => total + value, 0);
  return <div dir="ltr" className="rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-[#0e3b3b] to-[#6b3a12] p-1.5">
    <svg className="block w-full" viewBox={`0 0 300 ${(rows + 1) * 16 + 8}`} aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => Array.from({ length: row + 2 }, (_, peg) =>
        <circle key={row + ':' + peg} cx={150 + (2 * peg - row - 1) * 135 / rows}
          cy={(row + 1) * 16} r="2.4" fill="#ffe9a4" />))}
      <circle style={{ transition: 'cx 150ms linear, cy 150ms ease-in' }}
        cx={150 + drift * 135 / rows} cy={position * 16 + 7} r="5" fill="#ffa42a" stroke="#fff1aa" />
    </svg>
    <div className="flex">
      {factors.map((value, index) => <span key={index} className={`min-w-0 flex-1 rounded py-1 text-center text-[clamp(6px,2vw,10px)] ${position === rows && bucket === index ? 'bg-amber-300 text-black' : 'bg-emerald-900'}`}>{value}</span>)}
    </div>
  </div>;
}

export function SharedRoundPanel({ code, accountId, snapshot, seconds, online, refresh }: {
  code: string; accountId: string; snapshot: SharedSnapshot; seconds: number; online: boolean; refresh: () => void;
}) {
  const game = snapshot.catalog.find(item => item.code === code);
  const options = picks[code];
  const storageKey = `totichat.games.entry.${accountId}.${code}`;
  const [pending, setPending] = useState<SharedRequest | null>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? 'null'); } catch { return null; }
  });
  const [stake, setStake] = useState(pending?.p_stake ?? 10);
  const [pick, setPick] = useState(pending?.p_pick ?? options?.values[0][0] ?? 0);
  const [rows, setRows] = useState(pending?.p_rows ?? 12);
  const [risk, setRisk] = useState<Risk>(pending?.p_risk ?? 'normal');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState<SharedRequest>();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(storageKey + '.dismissed'); } catch { return null; }
  });
  const lock = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const myEntry = snapshot.entries.find(entry => Date.parse(entry.starts_at) === Date.parse(snapshot.round_start));
  const tracked = accepted ?? pending;
  const receipt = (tracked && snapshot.entries.find(entry => entry.request_id === tracked.p_request))
    ?? (!tracked ? snapshot.entries[0] : undefined);
  const win = receipt?.status === 'settled' && (receipt.paid ?? 0) > receipt.stake && dismissed !== receipt.request_id;
  const payouts = game?.rules.payouts?.[risk]?.[rows];
  const lastPlinkoPath = useRef<{ start: string; path: number[] } | undefined>(undefined);
  const resolved = snapshot.rounds[0];
  if (code === 'plinko' && resolved && !resolved.result.refunded && lastPlinkoPath.current?.start !== resolved.starts_at) {
    lastPlinkoPath.current = { start: resolved.starts_at, path: resolved.result.draw };
  }

  function remember(request: SharedRequest | null) {
    if (request) localStorage.setItem(storageKey, JSON.stringify(request));
    else { try { localStorage.removeItem(storageKey); } catch { /* Retry the same stored request on reopen. */ } }
    if (active.current) setPending(request);
  }

  async function join() {
    if (lock.current || !online) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const request = pending ?? {
        p_request: crypto.randomUUID(), p_code: code, p_start: snapshot.round_start, p_stake: stake,
        ...(code === 'plinko' ? { p_rows: rows, p_risk: risk } : { p_pick: pick }),
      };
      remember(request);
      const entry = await joinSharedRound(request);
      if (!active.current) return;
      if (entry.request_id !== request.p_request) throw new Error('Unmatched game receipt');
      setAccepted(request);
      remember(null);
      refresh();
    } catch (cause) {
      if (!active.current) return;
      const message = (cause as Error).message;
      if (message.includes('entries_player_game_starts_at_key')) {
        remember(null);
        setError('أنت مشارك بهذه الجولة.');
        refresh();
        return;
      }
      if (errors[message]) remember(null);
      setError(errors[message] ?? 'تعذر تأكيد المشاركة. أعد إرسال نفس الطلب للتحقق.');
      refresh();
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  }

  const bank = snapshot.balance ?? 0;
  const locked = busy || !!pending;
  const waiting = (code === 'ludo' ? snapshot.entries.some(entry => entry.status === 'pending') : myEntry?.status === 'pending') || (!!accepted && !receipt);
  const available = online && !busy && (pending || (game?.enabled && seconds > 0 && !myEntry && !waiting && bank >= stake));
  return <section className="space-y-3 rounded-2xl border border-amber-500/40 bg-emerald-950 p-3 text-center">
    {win && <WinNotice game={gameName(code)} prize={receipt.paid! - receipt.stake} actual onClose={() => {
      setDismissed(receipt.request_id);
      try { sessionStorage.setItem(storageKey + '.dismissed', receipt.request_id); } catch { /* Dismiss the current panel. */ }
    }} />}
    {code === 'ludo' && snapshot.ludo ? (
      <SharedLudoBoard match={snapshot.ludo} serverTime={snapshot.server_time} refresh={refresh} />
    ) : <>
    <p className="font-bold">إغلاق المشاركة خلال <bdi>{seconds}</bdi> ثانية</p>
    {options && <label className="flex items-center justify-between gap-2">{options.label}
      <select className="rounded-lg bg-emerald-900 p-2" value={pick} disabled={locked} onChange={event => setPick(Number(event.target.value))}>
        {options.values.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>}
    {code === 'plinko' && payouts && <PlinkoBoard rows={rows} factors={payouts} path={lastPlinkoPath.current?.path} />}
    {code === 'plinko' && <div className="flex justify-between gap-2">
      <label>الصفوف <select className="rounded-lg bg-emerald-900 p-2" value={rows} disabled={locked} onChange={event => setRows(Number(event.target.value))}>
        {Array.from({ length: 9 }, (_, index) => index + 8).map(value => <option key={value}>{value}</option>)}
      </select></label>
      <label>المخاطرة <select className="rounded-lg bg-emerald-900 p-2" value={risk} disabled={locked} onChange={event => setRisk(event.target.value as Risk)}>
        <option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">مرتفعة</option>
      </select></label>
    </div>}
    <label className="flex items-center justify-between gap-2">قيمة المشاركة
      <select className="rounded-lg bg-emerald-900 p-2" value={stake} disabled={locked} onChange={event => setStake(Number(event.target.value))}>
        {(code === 'ludo' ? [10] : [10, 25, 50, 100, 250, 500, 1000]).map(value => <option key={value} value={value}>{fmt(value)}</option>)}
      </select>
    </label>
    <button type="button" className="w-full rounded-xl bg-emerald-600 p-2 font-bold disabled:opacity-50"
      onClick={() => void join()} disabled={!available}>{busy ? 'جارٍ إرسال المشاركة…' : pending ? 'استرجاع الطلب' : waiting ? 'المشاركة مسجلة' : 'شارك بالجولة'}</button>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {!waiting && !myEntry && bank < stake && <p role="status">رصيدك غير كافٍ للمشاركة.</p>}
    </>}
    <details className="text-sm"><summary>القواعد والاحتمالات</summary><p>{rulesText[code]}</p>
      {payouts && <p dir="ltr">{payouts.map(value => value + '×').join(' · ')}</p>}
    </details>
    <details open className="space-y-2 text-sm"><summary>آخر 10 جولات</summary>
      {!snapshot.rounds.length && <p>لا توجد جولات محسومة بعد.</p>}
      {snapshot.rounds.map(round => {
        const entry = snapshot.entries.find(item => item.starts_at === round.starts_at);
        return <article key={round.starts_at} className="rounded-lg bg-black/30 p-2">
          <time>{new Date(round.starts_at).toLocaleTimeString('ar-IQ-u-nu-latn', { timeZone: 'Asia/Baghdad' })}</time>
          <SharedOutcome code={code} result={round.result} />
          {entry?.paid != null && <p>المشاركة <bdi>{fmt(entry.stake)}</bdi> · المبلغ المستلم <bdi>{fmt(entry.paid)}</bdi></p>}
        </article>;
      })}
    </details>
  </section>;
}
