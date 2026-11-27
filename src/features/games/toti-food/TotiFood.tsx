import { useEffect, useRef, useState, type ReactNode } from 'react';
import { claimFoodReward, enterFood, finishFoodRound, loadFood, loadFoodLeaders, loadFoodRewards, type FoodReward, type FoodPeriod, type FoodRequest, type FoodRound, type FoodState } from './api';
import './food.css';

import { imageUrl } from '../../../services/imageUrl';

function Avatar({ value, name }: { value?: string | null; name?: string | null }) {
  const src = imageUrl(value);
  const [failed, setFailed] = useState('');
  return src && failed !== src
    ? <img src={src} alt="" onError={() => setFailed(src)} />
    : <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', minWidth: '7cqw', color: '#ebc765' }}>{name?.trim().charAt(0) || '♙'}</span>;
}

const foodIcons = ['🍔', '🍕', '🍗', '🥩', '🍟', '🥗', '🍣', '🍰'];

const root = '/assets/games/toti-food/';
const stages = {
  play: 'main-game', royal: 'royal-mode', rules: 'game-rules', recent: 'recent-rounds',
  leaders: 'leaderboard', personal: 'participation-history', rewards: 'rewards',
  result: 'file_00000000b44881f4b7303f3c8df7a87a',
} as const;
type Page = keyof typeof stages;
const food = ['البرغر', 'البيتزا', 'الدجاج', 'اللحم', 'البطاطا', 'السلطة', 'السوشي', 'الكعكة'];
const stakes = [1000, 5000, 10000, 50000, 100000];
const spots = [[50, 34], [67, 37], [76, 46], [67, 55], [50, 58], [33, 55], [24, 46], [33, 37]];
const sectors = [
  "M365 469 Q432 447 500 469 Q535 482 515 529 L480 603 Q432 590 384 603 L348 529 Q329 482 365 469Z",
  "M550 507 Q590 490 630 533 Q670 574 655 607 L535 660 Q520 627 492 612 L532 531 Q540 514 550 507Z",
  "M655 635 Q696 624 704 669 L704 744 Q696 792 655 787 L548 744 Q557 710 548 678Z",
  "M535 761 L650 811 Q675 831 640 877 L594 920 Q558 946 535 909 L492 809 Q520 790 535 761Z",
  "M384 817 Q432 831 480 817 L515 908 Q535 949 490 956 L374 956 Q329 949 348 908Z",
  "M329 761 Q344 790 372 809 L329 909 Q306 946 270 920 L224 877 Q189 831 214 811Z",
  "M209 635 L316 678 Q307 710 316 744 L209 787 Q168 792 160 744 L160 669 Q168 624 209 635Z",
  "M314 507 Q324 514 332 531 L372 612 Q344 627 329 660 L209 607 Q194 574 234 533 Q274 490 314 507Z",
];
function createRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}
const formatted = (value: number | string | null | undefined) =>
  value == null ? '—' : BigInt(value).toLocaleString('en-US');
const roundNumber = (value: string) => Math.floor(Date.parse(value) / 30000);
const shortDate = (value: string) => new Intl.DateTimeFormat('ar-IQ', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Baghdad',
}).format(new Date(value));
const messages: Record<string, string> = {
  GAMES_INSUFFICIENT_BALANCE: 'الرصيد غير كافٍ',
  GAMES_ROUND_CLOSED: 'انتهى وقت المشاركة',
  GAMES_POOL_CAPACITY: 'المشاركة متوقفة مؤقتاً لعدم كفاية رصيد الخزينة',
  GAMES_RATE_LIMITED: 'وصلت إلى حد المشاركات لهذه الجولة',
  GAMES_DISABLED: 'المشاركات متوقفة',
  FOOD_ROYAL_INELIGIBLE: 'يتطلب المستوى 100 وVIP6 معاً',
  FOOD_REWARD_INELIGIBLE: 'شروط الجائزة لم تتحقق أو انتهت مدتها',
  GAMES_INVALID_ENTRY: 'قيمة المشاركة غير صالحة',
  GAMES_REQUEST_CONFLICT: 'سبق تسجيل طلب مختلف بهذا المعرف',
};

function Field({ x, y, w, h, children, className = '' }: {
  x: number; y: number; w: number; h: number; children: ReactNode; className?: string;
}) {
  return <div className={`toti-food-field ${className}`} style={{ left: x + '%', top: y + '%', width: w + '%', height: h + '%' }}>{children}</div>;
}

function Hit({ x, y, w, h, label, action, active = false, disabled = false, className = '', children }: {
  x: number; y: number; w: number; h: number; label: string; action: () => void; active?: boolean; disabled?: boolean; className?: string; children?: ReactNode;
}) {
  return <button type="button" className={`toti-food-hit ${className}`} style={{ left: x + '%', top: y + '%', width: w + '%', height: h + '%' }}
    aria-label={label} data-active={active || undefined} disabled={disabled} onClick={action}>{children}</button>;
}

export default function TotiFood({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const [selectedFoods, setSelectedFoods] = useState<number[]>([]);
  const [waitingSpin, setWaitingSpin] = useState<number>();
  const [sound, setSound] = useState(() => {
    try { return localStorage.getItem('totichat-food-sound') !== 'off'; } catch { return true; }
  });
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => () => { void audio.current?.close().catch(() => {}); audio.current = null; }, []);

  function playTap(frequency = 740, duration = 0.09, volume = 0.045, unlock = true) {
    try {
      if (!unlock && audio.current?.state !== 'running') return;
      const context = audio.current ??= new AudioContext();
      void context.resume().then(() => {
        if (context.state !== 'running') return;
        const tone = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        tone.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        tone.connect(gain);
        gain.connect(context.destination);
        tone.start(now);
        tone.stop(now + duration);
      }).catch(() => {});
    } catch { /* Game interaction remains available when audio is unavailable. */ }
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    try { localStorage.setItem('totichat-food-sound', next ? 'on' : 'off'); } catch { /* Storage may be unavailable. */ }
    if (next) playTap();
    else void audio.current?.suspend().catch(() => {});
  }

  const [royal, setRoyal] = useState(false);
  const [page, setPage] = useState<Page>('play');
  const [state, setState] = useState<FoodState>();
  const [clock, setClock] = useState(0);
  const [period, setPeriod] = useState<FoodPeriod>('day');
  const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof loadFoodLeaders>>>();
  const [leaderError, setLeaderError] = useState(false);
  const [stake, setStake] = useState(stakes[0]);
  const [connected, setConnected] = useState<boolean>();
  const pendingKey = 'totichat-food-request:' + accountId;
  type Bet = FoodRequest & { royal?: boolean };
  const [pending, setPending] = useState<Bet[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(pendingKey) ?? 'null') as Bet | Bet[] | null;
      return saved ? (Array.isArray(saved) ? saved : [saved]) : [];
    } catch { return []; }
  });
  const pendingRef = useRef(pending);
  const [confirmed, setConfirmed] = useState<Bet[]>([]);
  const [unconfirmed, setUnconfirmed] = useState<Set<string>>(() => new Set(pending.map(bet => bet.p_request)));
  const [notice, setNotice] = useState('');
  const [shownResult, setShownResult] = useState<{ round: FoodRound; winners: FoodState['latest_winners'] }>();
  const [spinningSlot, setSpinningSlot] = useState<string>();
  const [resultSeconds, setResultSeconds] = useState(3);
  const [offset, setOffset] = useState(0);
  const [rewardState, setRewardState] = useState<Awaited<ReturnType<typeof loadFoodRewards>>>();
  const [rewardError, setRewardError] = useState('');
  const [rewardBusy, setRewardBusy] = useState(false);
  const [rewardRevision, reloadRewards] = useState(0);
  const [chestDetails, setChestDetails] = useState<number>();
  const royalEntries = useRef(new Set<string>());
  const [rewardRules, showRewardRules] = useState(false);
  const [rewardsTab, setRewardsTab] = useState('المكافآت اليومية');
  const [historyPage, setHistoryPage] = useState(0);
  const refresh = useRef<() => void>(() => {});
  const finishedSlot = useRef<string | undefined>(undefined);
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();
    let loading = false;
    const sync = async () => {
      if (loading) return;
      loading = true;
      const started = performance.now();
      try {
        const snapshot = await loadFood(controller.signal);
        if (controller.signal.aborted) return;
        const serverNow = Date.parse(snapshot.server_time);
        const received = performance.now();
        setOffset(serverNow + (received - started) / 2 - received);
        setClock(received);
        setState(snapshot);
        setConnected(true);
      } catch {
        if (!controller.signal.aborted) setConnected(false);
      } finally {
        loading = false;
      }
    };
    refresh.current = () => void sync();
    void sync();
    const poll = window.setInterval(sync, 2000);
    const ticker = window.setInterval(() => setClock(performance.now()), 200);
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      controller.abort();
      refresh.current = () => {};
      window.clearInterval(poll);
      window.clearInterval(ticker);
      window.removeEventListener('online', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  useEffect(() => {
    if (page !== 'leaders') return;
    const controller = new AbortController();
    setLeaderboard(undefined);
    setLeaderError(false);
    let loading = false;
    const sync = async () => {
      if (loading) return;
      loading = true;
      try {
        const data = await loadFoodLeaders(period, controller.signal);
        if (!controller.signal.aborted) {
          setLeaderboard(data);
          setLeaderError(false);
        }
      } catch {
        if (!controller.signal.aborted) setLeaderError(true);
      } finally {
        loading = false;
      }
    };
    void sync();
    const poll = window.setInterval(sync, 5000);
    return () => { controller.abort(); window.clearInterval(poll); };
  }, [page, period]);

  useEffect(() => {
    if (page !== 'rewards') return;
    const controller = new AbortController();
    const sync = async () => {
      try {
        const next = await loadFoodRewards(controller.signal);
        if (!controller.signal.aborted) setRewardState(next);
      } catch {
        if (!controller.signal.aborted) setRewardState(undefined);
      }
    };
    void sync();
    const poll = window.setInterval(sync, 4000);
    window.addEventListener('online', sync);
    return () => { controller.abort(); window.clearInterval(poll); window.removeEventListener('online', sync); };
  }, [page, rewardRevision]);

  async function claim(reward: FoodReward) {
    if (rewardBusy) return;
    setRewardBusy(true);
    setRewardError('');
    try {
      const result = await claimFoodReward(reward);
      setRewardError(`تم استلام ${formatted(result.coins)} كوينز`);
    } catch (error) {
      setRewardError(messages[(error as { message?: string })?.message ?? ''] ?? 'تعذر تأكيد الاستلام. يمكنك إعادة المحاولة');
    } finally {
      reloadRewards(value => value + 1);
      refresh.current();
      setRewardBusy(false);
    }
  }

  useEffect(() => {
    if (page !== 'result') return;
    const count = window.setInterval(() => setResultSeconds(seconds => Math.max(0, seconds - 1)), 1000);
    const close = window.setTimeout(() => setPage('play'), 3000);
    return () => { window.clearInterval(count); window.clearTimeout(close); };
  }, [page]);

  const seconds = state ? Math.max(0, Math.ceil((Date.parse(state.closes_at) - clock - offset) / 1000)) : null;
  const currentSlot = state?.round_start;
  useEffect(() => {
    setSelectedFoods([]);
    setConfirmed([]);
    setNotice('');
  }, [currentSlot]);
  const closedSlot = state?.enabled && seconds === 0 && currentSlot !== finishedSlot.current ? currentSlot : undefined;
  const activeSlot = page === 'play' ? spinningSlot ?? closedSlot : undefined;
  const serverNow = clock + offset;
  const animationExpired = Boolean(activeSlot && serverNow >= Date.parse(activeSlot) + 21000);
  const missedRound = Boolean(activeSlot && currentSlot !== activeSlot &&
    serverNow >= Date.parse(activeSlot) + 34000);
  useEffect(() => {
    if (!missedRound || !activeSlot) return;
    finishedSlot.current = activeSlot;
    setSpinningSlot(undefined);
    setWaitingSpin(undefined);
  }, [missedRound, activeSlot]);
  const latest = state?.rounds[0];
  const resolvedRound = activeSlot && latest && Date.parse(latest.starts_at) >= Date.parse(activeSlot) ? latest : undefined;
  const winner = resolvedRound?.result.outcome;
  const royalSectorWin = Boolean(resolvedRound && royalEntries.current.has(resolvedRound.starts_at) &&
    state?.entries.some(entry => entry.starts_at === resolvedRound.starts_at && entry.status === 'settled' && (entry.paid ?? 0) > 0));
  const betweenRounds = Boolean(!activeSlot && state?.enabled && currentSlot && finishedSlot.current === currentSlot);
  const counter = activeSlot ? 0 : betweenRounds && currentSlot
    ? Math.max(0, Math.ceil((Date.parse(currentSlot) + 30000 - serverNow) / 1000))
    : seconds;
  const urgent = page === 'play' && !betweenRounds && state?.enabled && counter != null && counter >= 1 && counter <= 3;
  useEffect(() => {
    if (sound && urgent) playTap(900, 0.07, 0.035, false);
  }, [sound, urgent, counter]);
  useEffect(() => {
    if (sound && activeSlot && !resolvedRound && waitingSpin != null && waitingSpin % 2 === 0) {
      playTap(440 + waitingSpin * 35, 0.05, 0.025, false);
    }
  }, [sound, activeSlot, Boolean(resolvedRound), waitingSpin]);
  useEffect(() => {
    if (!activeSlot) return;
    if (!spinningSlot) {
      setSpinningSlot(activeSlot);
      void finishFoodRound(activeSlot).catch(() => {}).finally(() => refresh.current());
    }
  }, [activeSlot, spinningSlot]);
  useEffect(() => {
    if (!activeSlot || resolvedRound || animationExpired) {
      setWaitingSpin(undefined);
      return;
    }
    let step = 0;
    setWaitingSpin(step);
    const timer = window.setInterval(() => setWaitingSpin(++step % food.length), 85);
    return () => window.clearInterval(timer);
  }, [activeSlot, Boolean(resolvedRound), animationExpired]);
  const resolvedKey = resolvedRound?.starts_at;
  useEffect(() => {
    if (!activeSlot || resolvedKey) return;
    const poll = window.setInterval(() => refresh.current(), 600);
    return () => window.clearInterval(poll);
  }, [activeSlot, resolvedKey]);
  useEffect(() => {
    if (!resolvedRound || !state || !activeSlot) return;
    const showResult = () => {
      finishedSlot.current = resolvedRound.starts_at;
      setSpinningSlot(undefined);
      setWaitingSpin(undefined);
      setResultSeconds(3);
      setShownResult({ round: resolvedRound, winners: state.latest_winners });
      setPage('result');
    };
    // Hold the winning sector for one brief beat, then display the result.
    const stop = window.setTimeout(showResult, winner == null ? 0 : 120);
    return () => window.clearTimeout(stop);
  }, [activeSlot, resolvedKey, winner]);
  useEffect(() => {
    if (page === 'result' && shownResult && sound) {
      playTap(shownResult.round.result.refunded ? 440 : 1046, 0.22, 0.05, false);
    }
  }, [page, shownResult, sound]);
  const activeSpin = activeSlot ? winner ?? (resolvedRound || animationExpired ? undefined : waitingSpin ?? 0) : undefined;
  const canEnter = Boolean(!activeSlot && connected && state?.enabled && (!royal || state.royal_eligible) && seconds);
  const go = (target: Page) => { setNotice(''); setPage(target); };
  const rewards = (label: string) => { setRewardsTab(label); showRewardRules(false); setRewardError(''); go('rewards'); };
  function savePending(next: Bet[]) {
    pendingRef.current = next;
    setPending(next);
    try {
      if (next.length) localStorage.setItem(pendingKey, JSON.stringify(next));
      else localStorage.removeItem(pendingKey);
    } catch { /* Storage may be unavailable. */ }
  }

  const submit = async (bet: Bet) => {
    const { royal: royalEntry, ...request } = bet;
    const id = request.p_request;
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    setUnconfirmed(previous => new Set([...previous].filter(value => value !== id)));
    if (!pendingRef.current.some(item => item.p_request === id)) savePending([...pendingRef.current, bet]);
    try {
      const receipt = await enterFood(request, royalEntry);
      if (receipt.status === 'pending') {
        if (royalEntry) royalEntries.current.add(request.p_start);
        setConfirmed(previous => [...previous, bet]);
      }
      savePending(pendingRef.current.filter(item => item.p_request !== id));
    } catch (error) {
      const message = (error as { message?: string })?.message ?? '';
      const known = messages[message];
      if (known) savePending(pendingRef.current.filter(item => item.p_request !== id));
      else setUnconfirmed(previous => new Set(previous).add(id));
      setNotice(known ?? 'تعذر تأكيد إحدى المشاركات');
    } finally {
      inFlight.current.delete(id);
      refresh.current();
    }
  };
  const bet = (pick: number) => {
    setSelectedFoods(previous => previous.includes(pick) ? previous : [...previous, pick]);
    if (sound) playTap();
    if (!canEnter || !state) {
      const suffix = !connected ? 'تعذر الاتصال' : !state?.enabled ? 'المشاركات متوقفة' : !seconds ? 'انتهى وقت المشاركة' : 'بانتظار تأكيد المشاركة';
      setNotice(`تم تحديد ${food[pick]} · ${suffix}`);
      return;
    }
    const request = { p_request: createRequestId(), p_start: state.round_start, p_pick: pick, p_stake: stake, royal };
    void submit(request);
  };
  const recorded = new Set(state?.entries.map(entry => entry.request_id));
  const stakesByFood = { ...state?.bets };
  for (const item of confirmed) {
    if (item.p_start !== currentSlot || recorded.has(item.p_request)) continue;
    stakesByFood[item.p_pick] = (stakesByFood[item.p_pick] ?? 0) + item.p_stake;
  }
  const retryable = pending.filter(item => unconfirmed.has(item.p_request));
  const connectionStatus = connected === false ? 'تعذر الاتصال بخادم اللعبة' : !state ? 'جارٍ الاتصال…' : '';
  const status = connectionStatus || (state && !state.enabled ? 'المشاركات متوقفة' : '');
  const winners = shownResult?.winners;
  const recentRounds = (state?.rounds ?? []).slice(0, 10);
  const resultEntries = shownResult ? (state?.entries ?? []).filter(entry =>
    Date.parse(entry.starts_at) === Date.parse(shownResult.round.starts_at) && entry.status !== 'pending') : [];
  const resultStake = resultEntries.reduce((total, entry) => total + entry.stake, 0);
  const resultPaid = resultEntries.reduce((total, entry) => total + (entry.paid ?? 0), 0);
  const resultNet = resultPaid - resultStake;
  const royalWin = Boolean(shownResult && resultNet > 0 && royalEntries.current.has(shownResult.round.starts_at));
  const hasHeader = page !== 'result';

  return <section className="toti-food" aria-label="توتي للمأكولات">
    <img className="toti-food-art" src={root + stages[page] + '.png'} alt="" draggable={false} />
    {hasHeader && <>
      <Field x={0.9} y={0.1} w={32} h={6.1} className="toti-food-identity">
        <div><Avatar value={state?.player.avatar} name={state?.player.name} /><span>{state?.player.name ?? '—'}<small>ID {state?.player.public_id ?? '—'} · Lv {state?.level ?? '—'} · VIP {state?.vip ?? '—'}</small></span></div>
      </Field>
      <Field x={76} y={1.4} w={17.5} h={2.7}>{formatted(state?.player.balance)}</Field>
      <Hit x={35} y={0} w={30} h={10} label="العودة للعبة" action={() => go('play')} />
      <Hit x={1} y={6.4} w={27} h={5} label="الجولات الأخيرة" action={() => go('recent')} />
      <Hit x={72} y={6.4} w={27} h={5} label="لوحة المتصدرين" action={() => go('leaders')} />
      {page !== 'rewards' && <>
        <Hit x={9} y={12} w={40} h={5} label="الوضع الملكي" action={() => go('royal')} />
        <Hit x={51} y={12} w={40} h={5} label="الوضع العادي" action={() => { setRoyal(false); go('play'); }} />
      </>}
    </>}
    {page === 'play' && <>
      {royal && <Field x={9} y={12.4} w={40} h={4}>الوضع الملكي مفعّل</Field>}
      <Field x={16.3} y={21.4} w={63.3} h={2.1} className="toti-food-progress">
        <span style={{ width: Math.min(100, Number(state?.monthly_stake ?? 0) / 1e7) + '%' }} />
        <b>{formatted(state?.monthly_stake)} / 1,000,000,000</b>
      </Field>
      <Field x={33} y={64.05} w={34} h={4.55} className={`toti-food-clock ${urgent ? 'toti-food-clock-urgent' : ''}`}>
        <bdi>{counter == null || !state?.enabled ? '—' : '00:' + String(counter).padStart(2, '0')}</bdi>
      </Field>
      <Field x={11} y={73.7} w={22} h={2}>{formatted(state?.player.balance)}</Field>
      <Hit x={12} y={28} w={9} h={5} label="قواعد اللعبة" action={() => go('rules')} />
      <Hit x={79} y={28} w={9} h={5} label="سجل مشاركاتي" action={() => { setHistoryPage(0); go('personal'); }} />
      {stakes.map((amount, index) => <Hit key={amount} x={5.1 + index * 18.2} y={77.4} w={17} h={3.1}
        label={formatted(amount)} action={() => setStake(amount)} active={stake === amount} disabled={royal && amount < 10000} className="toti-food-stake">{formatted(amount)}</Hit>)}
      <button type="button" className="toti-food-stake" aria-label="صوت اللعبة" aria-pressed={sound} onClick={toggleSound}
        style={{ position: 'absolute', left: '88%', top: '28.55%', width: '7.1%', aspectRatio: '1', zIndex: 2, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 24 24" width="65%" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor" />
          {sound ? <path d="M16 8q5 4 0 8m3-11q8 7 0 14" /> : <path d="m16 9 6 6m0-6-6 6" />}
        </svg>
      </button>
      <svg className="toti-food-wheel" viewBox="0 0 865 1536" preserveAspectRatio="none" aria-label="أطعمة العجلة">
        {sectors.map((path, index) => <path key={path} d={path} role="button" tabIndex={0}
          aria-label={food[index]} aria-pressed={selectedFoods.includes(index) || Boolean(stakesByFood[index])}
          style={{ pointerEvents: 'all', cursor: 'pointer', touchAction: 'manipulation', outline: 'none', strokeWidth: 0 }}
          onClick={() => bet(index)}
          onKeyDown={event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            bet(index);
          }}
          className={activeSpin === index ? (royalSectorWin ? 'spin toti-food-royal-sector' : 'spin') : (stakesByFood[index] || selectedFoods.includes(index)) ? 'chosen' : undefined} />)}
      </svg>
      {spots.map(([x, y], index) => Boolean(stakesByFood[index]) &&
        <Field key={food[index]} x={x - 6} y={y - 4} w={12} h={2}>{formatted(stakesByFood[index])}</Field>)}
      <Hit x={7} y={88} w={86} h={11} label="المكافآت والصناديق" action={() => rewards('الصناديق الملكية')} />
      {(notice || status || betweenRounds || (activeSlot && animationExpired) || retryable.length > 0) && <Field x={7} y={82.2} w={86} h={5} className="toti-food-status">
        <span role="status">{notice || status || (betweenRounds ? 'الجولة التالية' : activeSlot && animationExpired ? 'بانتظار نتيجة الخادم' : 'تأكيد المشاركة السابقة معلّق')}</span>
        {retryable.length > 0 && <button type="button" disabled={!connected} onClick={() => retryable.forEach(item => void submit(item))}>إعادة المحاولة</button>}
      </Field>}
    </>}
    {page === 'rules' && <>
      <Hit x={83} y={19} w={10} h={6} label="إغلاق القواعد" action={() => go('play')} />
      <Field x={44} y={80.5} w={49} h={7} className="toti-food-status">
        يمكنك اختيار أكثر من طعام وتكرار المشاركة على الطعام نفسه حتى إغلاق المشاركات.
      </Field>
      <Hit x={22} y={92} w={56} h={7} label="ابدأ اللعب" action={() => go('play')} />
    </>}
    {page === 'royal' && <>
      <Field x={49.5} y={50.5} w={35} h={2.7}>{state?.level ?? '—'} / 100</Field>
      <Field x={49.5} y={54.7} w={35} h={2.7}>VIP {state?.vip ?? '—'} / VIP 6</Field>
      <Field x={17} y={58.8} w={33} h={2.7}>التقدم الشهري</Field>
      <Field x={49.5} y={58.8} w={35} h={2.7}>{formatted(state?.monthly_stake)} / 1,000,000,000</Field>
      <Field x={85} y={50.5} w={6} h={2.7}>{state && state.level >= 100 ? '✓' : '—'}</Field>
      <Field x={85} y={54.7} w={6} h={2.7}>{state && state.vip >= 6 ? '✓' : '—'}</Field>
      <Field x={85} y={58.8} w={6} h={2.7}>{Number(state?.monthly_stake) >= 1e9 ? '✓' : '—'}</Field>
      <Hit x={20} y={84} w={60} h={8} label="فتح الوضع الملكي" action={() => {
        if (!state?.royal_eligible) {
          setNotice(!state ? status : 'يتطلب المستوى 100 وVIP6 معاً');
          return;
        }
        setRoyal(true);
        setStake(10000);
        go('play');
      }} />
      {notice && <Field x={12} y={92} w={76} h={4} className="toti-food-status">{notice}</Field>}
    </>}
    {page === 'recent' && <>
      <Hit x={8} y={23} w={12} h={6} label="رجوع" action={() => go('play')} />
      <Hit x={82} y={23} w={12} h={6} label="تحديث الجولات" action={() => refresh.current()} />
      <Field x={8} y={36} w={84} h={43} className="toti-food-list">
        {recentRounds.length ? recentRounds.map(round => <div key={round.starts_at}>
          <span>#{roundNumber(round.starts_at)}</span><span>{shortDate(round.starts_at)}</span><span>{round.result.refunded ? 'مستردة' : `${foodIcons[round.result.outcome ?? -1] ?? ''} ${food[round.result.outcome ?? -1] ?? '—'}`}</span>
          <span>{round.multiplier == null ? '—' : '×' + round.multiplier}</span>
        </div>) : <p>{connectionStatus || 'لا توجد جولات مكتملة'}</p>}
      </Field>
      <Field x={8} y={84} w={84} h={8}>الجولات المعروضة {state ? recentRounds.length : '—'}</Field>
    </>}
    {page === 'personal' && <>
      <Field x={8} y={28.8} w={84} h={6}>سجل المشاركات من الخادم</Field>
      <Field x={7} y={40} w={86} h={44} className="toti-food-list">
        {state?.entries.length ? state.entries.slice(historyPage * 10, (historyPage + 1) * 10).map(entry => <div key={entry.request_id}>
          <span>#{roundNumber(entry.starts_at)}</span><span>{shortDate(entry.starts_at)}</span><span>{food[entry.pick]}</span><span>{formatted(entry.stake)}</span>
          <span>{entry.status === 'pending' ? 'قيد التسوية' : entry.status === 'refunded' ? 'مستردة' : entry.paid ? `ربح ${formatted(entry.paid)}` : 'خسارة'}</span>
        </div>) : <p>{connectionStatus || 'لا توجد مشاركات'}</p>}
      </Field>
      <Field x={41} y={85.8} w={18} h={3}>{historyPage + 1} / {Math.max(1, Math.ceil((state?.entries.length ?? 0) / 10))}</Field>
      <Hit x={17} y={85.5} w={12} h={4} label="أول صفحة" action={() => setHistoryPage(0)} />
      <Hit x={29} y={85.5} w={11} h={4} label="الصفحة السابقة" action={() => setHistoryPage(Math.max(0, historyPage - 1))} />
      <Hit x={60} y={85.5} w={11} h={4} label="الصفحة التالية" action={() => setHistoryPage(Math.min(Math.max(0, Math.ceil((state?.entries.length ?? 0) / 10) - 1), historyPage + 1))} />
      <Hit x={72} y={85.5} w={11} h={4} label="آخر صفحة" action={() => setHistoryPage(Math.max(0, Math.ceil((state?.entries.length ?? 0) / 10) - 1))} />
    </>}
    {page === 'leaders' && <>
      {(['month', 'week', 'day'] as const).map((range, index) => {
        const label = ['الشهري', 'الأسبوعي', 'اليومي'][index];
        return <Hit key={range} x={9 + index * 27.3} y={23.4} w={26} h={3.8}
          label={label} action={() => setPeriod(range)} active={period === range} className="toti-food-stake">{label}</Hit>;
      })}
      {[[50, 34, 40.9], [77, 36.5, 41.4], [22.5, 36.5, 41.4]].map(([x, portraitY, textY], index) => {
        const leader = leaderboard?.leaders[index];
        return <div key={x}>
          <Field x={x - 7} y={portraitY - 3.8} w={14} h={7.5} className="toti-food-portrait">
            {leader && <Avatar value={leader.avatar} name={leader.name} />}
          </Field>
          <Field x={x - 10} y={textY} w={20} h={7.4} className="toti-food-podium">
            <strong>{leader?.name ?? '—'}</strong><small>{leader?.public_id ?? '—'}</small><small>{formatted(leader?.points)}</small>
          </Field>
        </div>;
      })}
      <Field x={6} y={52.8} w={88} h={33.5} className="toti-food-list">
        {leaderError ? <p>تعذر تحميل المتصدرين</p> : leaderboard?.leaders.length ? leaderboard.leaders.slice(3).map(leader => <div key={leader.rank}>
          <span>#{leader.rank}</span><Avatar value={leader.avatar} name={leader.name} />
          <span>{leader.name}</span><span>{leader.public_id}</span><span>{formatted(leader.points)}</span>
        </div>) : <p>{leaderboard ? 'لا يوجد متصدرون بعد' : 'جارٍ التحميل…'}</p>}
      </Field>
      <Field x={8} y={88} w={85} h={6}>ترتيبك {leaderboard?.player?.rank ?? '—'} · {formatted(leaderboard?.player?.points)}</Field>
    </>}
    {page === 'rewards' && <>
      {['الصناديق الملكية', 'المكافآت اليومية', 'بطاقات الجوائز'].map((label, index) => <Hit key={label} x={3 + index * 33} y={12} w={30} h={5}
        label={label} action={() => { setRewardsTab(label); showRewardRules(false); }} active={label === rewardsTab} />)}
      <Field x={5} y={18.5} w={90} h={72} className="toti-food-list">
        {rewardRules ? <p>يُحسب التقدم بتوقيت بغداد. تتطلب المكافأة اليومية مشاركة مسوّاة بقيمة 1,000 كوينز على الأقل. يعيد غياب يوم السلسلة إلى اليوم الأول. تستحق الصناديق يومياً حسب إجمالي المشاركات المسوّاة، وتُفتح البطاقات شهرياً حسب عدد المكافآت اليومية المستلمة.</p>
          : !rewardState ? <p>تعذر تحميل حالة المكافآت</p>
          : rewardState.items.filter(item => item.kind === (
            rewardsTab === 'المكافآت اليومية' ? 'daily' : rewardsTab === 'الصناديق الملكية' ? 'chest' : 'card'
          )).map(item => {
            const name = item.kind === 'daily' ? `اليوم ${item.item}` : item.kind === 'chest'
              ? ['الفضي', 'الذهبي', 'الماسي', 'النخبة'][item.item - 1]
              : ['VIP', 'الجواهر', 'العملات', 'الطاقة', 'المفاجآت'][item.item - 1];
            return <div key={item.item} className={item.kind === 'daily' && item.available ? 'toti-food-reward-ready' : undefined}>
              {item.kind === 'chest' ? <button type="button" aria-expanded={chestDetails === item.item}
                onClick={() => setChestDetails(previous => previous === item.item ? undefined : item.item)}>الصندوق {name}</button>
                : <strong>{name}</strong>}<span>{formatted(item.coins)} كوينز</span>
              {item.kind !== 'daily' && <span>{formatted(item.progress)} / {formatted(item.requirement)}</span>}
              {item.kind === 'chest' && chestDetails === item.item && <small className="toti-food-chest-details">
                الشرط {formatted(item.requirement)} كوينز من المشاركات المسوّاة. {item.claimed ? 'مستلم' : item.available ? 'جاهز للفتح' :
                  `باقي ${formatted(Math.max(0, item.requirement - item.progress))} كوينز`}
              </small>}
              <button type="button" disabled={rewardBusy || !rewardState.enabled || !item.available}
                onClick={() => void claim(item)}>{item.claimed ? 'مستلمة' : item.kind === 'card' ? 'استخدام' : item.kind === 'chest' ? 'فتح' : 'استلام'}</button>
            </div>;
          })}
        {rewardError && <p role="status">{rewardError}</p>}
      </Field>
      <Hit x={15} y={91} w={70} h={6} label="قواعد المكافآت" action={() => showRewardRules(value => !value)} />

    </>}
    {page === 'result' && shownResult && <>
      <Field x={88} y={1.4} w={8} h={5}>{resultSeconds}</Field>
      <Field x={18} y={14} w={64} h={18} className={royalWin ? "toti-food-result toti-food-royal-win" : "toti-food-result"}>
        {royalWin && <span aria-label="فوز ملكي">♛</span>}
        {shownResult.round.result.refunded ? 'أُعيدت المشاركات' : `${food[shownResult.round.result.outcome ?? -1]} ×${shownResult.round.multiplier}`}
      </Field>
      {resultStake > 0 && <Field x={12} y={35} w={76} h={4} className={royalWin ? "toti-food-royal-win" : ""}>
        شاركت بـ{formatted(resultStake)} · استلمت {formatted(resultPaid)} · الصافي {resultNet > 0 ? '+' : ''}{formatted(resultNet)}
      </Field>}
      {[[50, 50.8, 60.3], [22, 54.4, 63.1], [78, 54.4, 63.1]].map(([x, portraitY, textY], index) => {
        const winner = winners?.players[index];
        return <div key={x}>
          <Field x={x - 9} y={portraitY - 5} w={18} h={10} className="toti-food-portrait">
            {winner && <Avatar value={winner.avatar} name={winner.name} />}
          </Field>
          <Field x={x - 12} y={textY} w={24} h={6.4} className="toti-food-podium">
            <strong>{winner?.name ?? '—'}</strong><small>{formatted(winner?.payout)}</small>
          </Field>
        </div>;
      })}
      <Field x={12} y={76} w={76} h={8}>{formatted(winners?.total_payout)}</Field>
      <Hit x={15} y={89} w={70} h={8} label="العودة للعبة" action={() => go('play')} />
    </>}
    <button className="toti-food-close" type="button" onClick={page === 'play' ? onClose : () => go('play')}>
      {page === 'play' ? 'العودة للألعاب' : 'العودة للعبة'}
    </button>
  </section>;
}
