import { useEffect, useRef, useState } from 'react';
import { dropBall, gameAsset, type Pending, type Risk, type Round, type Rules } from './api';

const risks: [Risk, string][] = [['low', 'منخفض'], ['normal', 'عادي'], ['high', 'مرتفع']];
const color = (factor: number) => factor >= 10 ? '#d7263d' : factor >= 2 ? '#e16c16' : factor >= 1 ? '#42802d' : '#8a6110';
const labels: Record<string, string> = {
  GAMES_INSUFFICIENT_BALANCE: 'الرصيد التجريبي غير كافٍ',
  GAMES_DISABLED: 'اللعبة متوقفة حالياً',
  GAMES_INVALID_STAKE: 'المبلغ خارج النطاق المسموح',
  GAMES_ACCOUNT_REQUIRED: 'يلزم حساب نشط وجلسة موثقة',
  GAMES_REQUEST_CONFLICT: 'إعدادات الطلب المحفوظ غير متطابقة',
  GAMES_INVALID_INPUT: 'إعدادات الجولة غير صالحة',
};

function playSound(file: string, volume: number) {
  const audio = new Audio(gameAsset + file);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

export function Plinko({ accountId, rules, history, onRound }: {
  accountId: string; rules: Rules; history: Round[]; onRound: (round: Round) => void;
}) {
  const pendingKey = 'totichat.practice.plinko.' + accountId;
  const pending = useRef<Pending | null>(null);
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState<Risk>('normal');
  const [stake, setStake] = useState(rules.min_stake);
  const [showRetry, setShowRetry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const [round, setRound] = useState<Round | null>(null);
  const [position, setPosition] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const mounted = useRef(false);
  const inFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    try {
      const saved = sessionStorage.getItem(pendingKey);
      pending.current = saved ? JSON.parse(saved) as Pending : null;
      if (pending.current) {
        setRows(pending.current.p_rows);
        setRisk(pending.current.p_risk);
        setStake(pending.current.p_stake);
        setShowRetry(true);
      }
    } catch { /* The live panel can still retry if storage is unavailable. */ }
    return () => {
      mounted.current = false;
      window.clearInterval(timer.current);
    };
  }, [pendingKey]);

  function remember(next: Pending | null) {
    pending.current = next;
    try {
      if (next) sessionStorage.setItem(pendingKey, JSON.stringify(next));
      else sessionStorage.removeItem(pendingKey);
    } catch { /* Keep the request in memory if storage is unavailable. */ }
  }

  async function drop() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setRound(null);
    setPosition(0);
    const request = pending.current ?? {
      p_request: crypto.randomUUID(), p_rows: rows, p_risk: risk, p_stake: stake,
    };
    remember(request);
    try {
      const result = await dropBall(request);
      remember(null);
      if (!mounted.current) return;
      setShowRetry(false);
      setRound(result);
      onRound(result);
      let next = 0;
      timer.current = window.setInterval(() => {
        next += 1;
        setPosition(next);
        if (next <= result.rows && !muted) playSound('dice_stop.wav', 0.15);
        if (next > result.rows) {
          window.clearInterval(timer.current);
          setBusy(false);
          inFlight.current = false;
          if (result.reward >= result.stake && !muted) {
            playSound(result.multiplier >= 10 ? 'bigwin.wav' : 'win.wav', 0.45);
          }
        }
      }, 160);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      if (labels[code]) remember(null);
      if (!mounted.current) return;
      setShowRetry(Boolean(pending.current));
      setError(labels[code] ?? 'تعذر تأكيد الجولة. أعد المحاولة لاسترجاع الطلب نفسه.');
      setBusy(false);
      inFlight.current = false;
    }
  }

  const factors = rules.payouts[risk][rows];
  const elapsed = Math.min(position, rows);
  const drift = round?.path.slice(0, elapsed).reduce((sum, step) => sum + 2 * step - 1, 0) ?? 0;
  const ballX = 150 + drift * 135 / rows;
  const boardHeight = (rows + 1) * 16 + 8;
  const choose = (nextRows: number, nextRisk: Risk) => {
    setRows(nextRows);
    setRisk(nextRisk);
    setRound(null);
  };
  return <div className="space-y-3">
    <div className="flex gap-1 overflow-x-auto" aria-label="آخر المضاعفات">
      {history.map(item => <span key={item.request_id} className="rounded px-2 py-1 text-xs" style={{ background: color(item.multiplier) }}>×{item.multiplier}</span>)}
    </div>
    <div className="flex items-start gap-2">
      <div className="flex shrink-0 flex-col gap-1 text-xs">
        <span>الصفوف</span>
        {Array.from({ length: 9 }, (_, i) => i + 8).map(value =>
          <button key={value} type="button" aria-pressed={rows === value} disabled={busy || showRetry}
            className="rounded bg-emerald-900 px-3 py-1 aria-pressed:bg-amber-300 aria-pressed:text-black"
            onClick={() => choose(value, risk)}>{value}</button>)}
      </div>
      <div className="min-w-0 flex-1 rounded-2xl border-2 border-orange-500 bg-gradient-to-b from-[#0e3b3b] to-[#6b3a12] p-1.5" dir="ltr">
        <svg className="block w-full" viewBox={'0 0 300 ' + boardHeight} aria-hidden="true">
          {Array.from({ length: rows }, (_, row) => Array.from({ length: row + 2 }, (_, peg) =>
            <circle key={row + '-' + peg} cx={150 + (2 * peg - row - 1) * 135 / rows}
              cy={(row + 1) * 16} r="2.4" fill="#ffe9a4" />))}
          <circle style={{ transition: 'cx 150ms linear, cy 150ms ease-in' }} cx={ballX}
            cy={position * 16 + 7} r="5" fill="#ffa42a" stroke="#fff1aa" />
        </svg>
        <div className="flex">
          {factors.map((factor, index) =>
            <span key={index} className="min-w-0 flex-1 rounded py-1 text-center text-[clamp(6px,2vw,10px)]"
              style={{ background: color(factor), outline: !busy && round?.bucket === index ? '1px solid white' : undefined }}>{factor}</span>)}
        </div>
      </div>
    </div>
    <p role="status" className="min-h-5 text-center text-amber-200">
      {!busy && round && <>×{round.multiplier} · {round.reward.toLocaleString('ar-IQ')} عملة تجريبية</>}
    </p>
    <div className="flex flex-wrap gap-2">
      {risks.map(([value, label]) => <button key={value} type="button" aria-pressed={risk === value}
        className="rounded bg-white/10 px-3 py-1 aria-pressed:bg-amber-300 aria-pressed:text-black"
        disabled={busy || showRetry} onClick={() => choose(rows, value)}>{label}</button>)}
      <button type="button" className="ms-auto underline" aria-pressed={muted} onClick={() => setMuted(value => !value)}>كتم مؤثرات اللعبة</button>
    </div>
    <label className="flex items-center justify-between gap-2">
      المبلغ التجريبي
      <input className="w-24 rounded bg-white/10 px-2 py-1" type="number" inputMode="numeric"
        min={rules.min_stake} max={rules.max_stake} value={stake} disabled={busy || showRetry}
        onChange={event => setStake(Number(event.target.value))} />
    </label>
    <button type="button" className="w-full rounded-xl bg-amber-300 p-2 font-bold text-black disabled:opacity-50"
      disabled={busy || (!showRetry && (!Number.isInteger(stake) || stake < rules.min_stake || stake > rules.max_stake))}
      onClick={() => void drop()}>{busy ? 'الجولة جارية' : showRetry ? 'استرجاع الجولة' : 'إطلاق الكرة'}</button>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    <details className="text-sm text-amber-100">
      <summary>القواعد والاحتمالات</summary>
      <p>لكل صف احتمال متساوٍ للاتجاه يميناً أو يساراً. المكافأة هي المبلغ التجريبي مضروباً في قيمة الخانة، مقرباً للأسفل.</p>
    </details>
  </div>;
}
