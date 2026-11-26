import { useEffect, useRef, useState, type ReactNode } from 'react';
import { claimFoodReward, enterFood, loadFood, loadFoodLeaders, loadFoodRewards, type FoodReward, type FoodPeriod, type FoodRequest, type FoodRound, type FoodState } from './api';
import './food.css';

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
  const [royal, setRoyal] = useState(false);
  const [page, setPage] = useState<Page>('play');
  const [state, setState] = useState<FoodState>();
  const [clock, setClock] = useState(0);
  const [period, setPeriod] = useState<FoodPeriod>('day');
  const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof loadFoodLeaders>>>();
  const [leaderError, setLeaderError] = useState(false);
  const [stake, setStake] = useState(stakes[0]);
  const [connected, setConnected] = useState<boolean>();
  const [busy, setBusy] = useState(false);
  const pendingKey = 'totichat-food-request:' + accountId;
  const [pending, setPending] = useState<(FoodRequest & { royal?: boolean }) | undefined>(() => {
    try {
      const saved = localStorage.getItem(pendingKey);
      return saved ? JSON.parse(saved) as FoodRequest & { royal?: boolean } : undefined;
    } catch {
      return undefined;
    }
  });
  const [notice, setNotice] = useState('');
  const [shownResult, setShownResult] = useState<{ round: FoodRound; winners: FoodState['latest_winners'] }>();
  const [spin, setSpin] = useState<number>();
  const [resultSeconds, setResultSeconds] = useState(3);
  const [offset, setOffset] = useState(0);
  const [rewardState, setRewardState] = useState<Awaited<ReturnType<typeof loadFoodRewards>>>();
  const [rewardError, setRewardError] = useState('');
  const [rewardBusy, setRewardBusy] = useState(false);
  const [rewardRevision, reloadRewards] = useState(0);
  const [rewardRules, showRewardRules] = useState(false);
  const [rewardsTab, setRewardsTab] = useState('المكافآت اليومية');
  const [historyPage, setHistoryPage] = useState(0);
  const refresh = useRef<() => void>(() => {});
  const lastRound = useRef<string | null | undefined>(undefined);
  const inFlight = useRef(false);

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

  const latest = state?.rounds[0];
  const roundKey = latest?.starts_at;
  useEffect(() => {
    if (!state) return;
    if (lastRound.current === undefined || page !== 'play') {
      lastRound.current = roundKey ?? null;
      return;
    }
    if (!latest || lastRound.current === roundKey || latest.result.outcome == null) return;
    const winner = latest.result.outcome;
    let step = 0;
    const animation = window.setInterval(() => {
      setSpin(step % food.length);
      if (step++ < 16 + winner) return;
      window.clearInterval(animation);
      lastRound.current = latest.starts_at;
      setSpin(undefined);
      setResultSeconds(3);
      setShownResult({ round: latest, winners: state.latest_winners });
      setPage('result');
    }, 70);
    return () => { window.clearInterval(animation); setSpin(undefined); };
    // A refresh of the same authoritative round must not restart the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roundKey, Boolean(state)]);
  useEffect(() => {
    if (page !== 'result') return;
    const count = window.setInterval(() => setResultSeconds(seconds => Math.max(0, seconds - 1)), 1000);
    const close = window.setTimeout(() => setPage('play'), 3000);
    return () => { window.clearInterval(count); window.clearTimeout(close); };
  }, [page]);

  const seconds = state ? Math.max(0, Math.ceil((Date.parse(state.closes_at) - clock - offset) / 1000)) : null;
  const canEnter = Boolean(connected && state?.enabled && (!royal || state.royal_eligible) && seconds && !busy && !pending);
  const go = (target: Page) => { setNotice(''); setPage(target); };
  const rewards = (label: string) => { setRewardsTab(label); showRewardRules(false); setRewardError(''); go('rewards'); };
  const submit = async ({ royal: royalEntry, ...request }: FoodRequest & { royal?: boolean }) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setNotice('');
    setPending({ ...request, royal: royalEntry });
    try { localStorage.setItem(pendingKey, JSON.stringify({ ...request, royal: royalEntry })); } catch { /* Storage may be unavailable. */ }
    const clearPending = () => {
      setPending(undefined);
      try { localStorage.removeItem(pendingKey); } catch { /* Storage may be unavailable. */ }
    };
    try {
      await enterFood(request, royalEntry);
      clearPending();
    } catch (error) {
      const message = (error as { message?: string })?.message ?? '';
      const known = messages[message];
      if (known) clearPending();
      setNotice(known ?? 'تعذر تأكيد المشاركة. أعد المحاولة للتحقق من نفس الطلب');
    } finally {
      inFlight.current = false;
      setBusy(false);
      refresh.current();
    }
  };
  const bet = (pick: number) => {
    if (canEnter && state) void submit({ p_request: crypto.randomUUID(), p_start: state.round_start, p_pick: pick, p_stake: stake, royal });
  };
  const connectionStatus = connected === false ? 'تعذر الاتصال بخادم اللعبة' : !state ? 'جارٍ الاتصال…' : '';
  const status = connectionStatus || (state && !state.enabled ? 'المشاركات متوقفة' : '');
  const picture = state?.player.avatar;
  const winners = shownResult?.winners;
  const hasHeader = page !== 'result';

  return <section className="toti-food" aria-label="توتي للمأكولات">
    <img className="toti-food-art" src={root + stages[page] + '.png'} alt="" draggable={false} />
    {hasHeader && <>
      <Field x={0.9} y={0.1} w={32} h={6.1} className="toti-food-identity">
        <div>{picture && <img src={picture} alt="" />}<span>{state?.player.name ?? '—'}<small>ID {state?.player.public_id ?? '—'} · Lv {state?.level ?? '—'} · VIP {state?.vip ?? '—'}</small></span></div>
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
      <Field x={32} y={64.2} w={36} h={4.8} className="toti-food-clock">
        {seconds == null || !state?.enabled ? '—' : '00:' + String(seconds).padStart(2, '0')}
      </Field>
      <Field x={11} y={73.7} w={22} h={2}>{formatted(state?.player.balance)}</Field>
      <Hit x={12} y={28} w={9} h={5} label="قواعد اللعبة" action={() => go('rules')} />
      <Hit x={79} y={28} w={9} h={5} label="سجل مشاركاتي" action={() => { setHistoryPage(0); go('personal'); }} />
      {stakes.map((amount, index) => <Hit key={amount} x={5.1 + index * 18.2} y={77.4} w={17} h={3.1}
        label={formatted(amount)} action={() => setStake(amount)} active={stake === amount} disabled={royal && amount < 10000} className="toti-food-stake">{formatted(amount)}</Hit>)}
      <svg className="toti-food-wheel" viewBox="0 0 865 1536" aria-hidden="true">
        {sectors.map((path, index) => <path key={path} d={path}
          className={spin === index ? 'spin' : state?.bets[index] ? 'chosen' : undefined} />)}
      </svg>
      {spots.map(([x, y], index) => <div key={food[index]}>
        <Hit x={x - 7} y={y - 4} w={14} h={8} label={food[index]} action={() => bet(index)}
          disabled={!canEnter} />
        {Boolean(state?.bets[index]) && <Field x={x - 6} y={y - 4} w={12} h={2}>{formatted(state?.bets[index])}</Field>}
      </div>)}
      <Hit x={7} y={88} w={86} h={11} label="المكافآت والصناديق" action={() => rewards('الصناديق الملكية')} />
      {(notice || status || pending) && <Field x={7} y={82.2} w={86} h={5} className="toti-food-status">
        <span role="status">{notice || status || 'تأكيد المشاركة السابقة معلّق'}</span>
        {pending && <button type="button" disabled={busy || !connected} onClick={() => void submit(pending)}>إعادة المحاولة</button>}
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
        {state?.rounds.length ? state.rounds.map(round => <div key={round.starts_at}>
          <span>#{roundNumber(round.starts_at)}</span><span>{shortDate(round.starts_at)}</span><span>{round.result.refunded ? 'مستردة' : food[round.result.outcome ?? -1]}</span>
          <span>{round.multiplier == null ? '—' : '×' + round.multiplier}</span>
        </div>) : <p>{connectionStatus || 'لا توجد جولات مكتملة'}</p>}
      </Field>
      <Field x={8} y={84} w={84} h={8}>الجولات المعروضة {state?.rounds.length ?? '—'}</Field>
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
            {leader?.avatar && <img src={leader.avatar} alt="" />}
          </Field>
          <Field x={x - 10} y={textY} w={20} h={7.4} className="toti-food-podium">
            <strong>{leader?.name ?? '—'}</strong><small>{leader?.public_id ?? '—'}</small><small>{formatted(leader?.points)}</small>
          </Field>
        </div>;
      })}
      <Field x={6} y={52.8} w={88} h={33.5} className="toti-food-list">
        {leaderError ? <p>تعذر تحميل المتصدرين</p> : leaderboard?.leaders.length ? leaderboard.leaders.slice(3).map(leader => <div key={leader.rank}>
          <span>#{leader.rank}</span>{leader.avatar && <img src={leader.avatar} alt="" />}
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
              <strong>{name}</strong><span>{formatted(item.coins)} كوينز</span>
              {item.kind !== 'daily' && <span>{formatted(item.progress)} / {formatted(item.requirement)}</span>}
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
      <Field x={18} y={14} w={64} h={18} className="toti-food-result">
        {food[shownResult.round.result.outcome ?? -1]} ×{shownResult.round.multiplier}
      </Field>
      {[[50, 50.8, 60.3], [22, 54.4, 63.1], [78, 54.4, 63.1]].map(([x, portraitY, textY], index) => {
        const winner = winners?.players[index];
        return <div key={x}>
          <Field x={x - 9} y={portraitY - 5} w={18} h={10} className="toti-food-portrait">
            {winner?.avatar && <img src={winner.avatar} alt="" />}
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
