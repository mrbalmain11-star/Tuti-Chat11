import { VIP_BEAST_METADATA } from '../../components/VipBadge';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, Coins, History as HistoryIcon, List, Minus, Plus, Search, Wallet, X, Zap } from 'lucide-react';
import { imageUrl } from '../../services/imageUrl';
import { agentRpc, digits, num, timestamp, type AgentState, type History, type Intent, type Recipient, type Result } from './api';
import './recharge-agent.css';

const max = 1_000_000_000;
const chargePresets = [5_000, 10_000, 50_000, 100_000];
const messages: Record<string, string> = {
  AGENT_NOT_APPROVED: 'وكالة الشحن غير معتمدة أو أُوقف اعتمادها.',
  AGENT_INSUFFICIENT: 'رصيد الوكيل غير كافٍ.',
  AGENT_WALLET_MISSING: 'محفظة المستخدم غير متاحة.',
  AGENT_WALLET_LIMIT: 'الشحن يتجاوز حد رصيد المستخدم.',
  AGENT_RECIPIENT_CHANGED: 'تغيّر الحساب. تحقق من الرقم مرة أخرى.',
  AGENT_SELF_CHARGE: 'لا يمكن شحن حساب الوكيل نفسه.',
  AGENT_PENDING_LIMIT: 'لديك خمسة طلبات تزويد قيد المراجعة.',
  AGENT_RATE_LIMIT: 'انتظر قليلاً قبل إجراء عملية أخرى.',
  AGENT_RETRY_CONFLICT: 'تعذر مطابقة بيانات الطلب المحفوظ.',
};

function Account({ person }: { person: Recipient }) {
  return <div className="ra-account">
    <img src={imageUrl(person.avatar_url || '') || '/placeholder-avatar.svg'} alt="" onError={event => {
      if (event.currentTarget.getAttribute('src') !== '/placeholder-avatar.svg') event.currentTarget.src = '/placeholder-avatar.svg';
    }} />
    <div className="ra-person"><strong>{person.display_name} {['male', 'ذكر'].includes(person.gender ?? '') ? '♂' : ['female', 'أنثى'].includes(person.gender ?? '') ? '♀' : ''}</strong>
      <small dir="ltr">ID {person.public_id}</small></div>
    <div className="ra-level">
      {VIP_BEAST_METADATA[person.vip_level] && <img src={VIP_BEAST_METADATA[person.vip_level].badgeImg} alt={'VIP ' + person.vip_level} />}
      {typeof person.level === 'number' && <b dir="ltr">Lv. {person.level}</b>}
    </div>
  </div>;
}

export function RechargeAgent({ actor, onClose }: { actor: string; onClose: () => void }) {
  const key = 'totichat:recharge-agent:' + actor;
  const [state, setState] = useState<AgentState>();
  const [person, setPerson] = useState<Recipient>();
  const [id, setId] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState<'history' | 'supplies'>();
  const [rows, setRows] = useState<History[]>([]);
  const [more, setMore] = useState(false);
  const [supplyAmount, setSupplyAmount] = useState('');
  const [confirm, setConfirm] = useState<{ person: Recipient; coins: number; left: number }>();
  const [pending, setPending] = useState<Intent>();
  const lock = useRef(false);
  const searchVersion = useRef(0);
  const [checking, setChecking] = useState(false);

  async function refresh() {
    try {
      setState(await agentRpc<AgentState>('state'));
    } catch (error) {
      setState(undefined);
      setNotice(messages[(error as Error).message] ?? 'تعذر تحميل بيانات الوكيل.');
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setPending(JSON.parse(saved) as Intent);
    } catch { setNotice('تعذر قراءة العملية المحفوظة.'); }
    void refresh();
  }, [key]);

  function editId(input: string) {
    searchVersion.current += 1;
    setId(digits(input).slice(0, 6));
    setPerson(undefined);
    setChecking(false);
    setNotice('');
  }

  async function lookup() {
    const version = ++searchVersion.current;
    setNotice('');
    setPerson(undefined);
    setChecking(true);
    try {
      const match = await agentRpc<Recipient | null>('lookup', { public_id: Number(id) });
      if (version !== searchVersion.current) return;
      if (match) setPerson(match);
      else setNotice('ما لقينا حساب معتمَد بهذا الرقم.');
    } catch (error) {
      if (version === searchVersion.current) setNotice(messages[(error as Error).message] ?? 'تعذر التحقق من الحساب.');
    } finally {
      if (version === searchVersion.current) setChecking(false);
    }
  }

  async function loadPage(next: 'history' | 'supplies', append = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('');
    setPage(next);
    if (!append) { setRows([]); setMore(false); }
    try {
      const records = await agentRpc<History[]>(next, { offset: append ? rows.length : 0 });
      setRows(previous => append ? [...previous, ...records] : records);
      setMore(records.length === 30);
    } catch (error) { setNotice(messages[(error as Error).message] ?? 'تعذر تحميل السجل.'); }
    finally { lock.current = false; setBusy(false); }
  }

  async function submit(intent: Intent) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('');
    try {
      localStorage.setItem(key, JSON.stringify(intent));
      setPending(intent);
      const result = await agentRpc<Result>(intent.action, intent.data, intent.requestId);
      localStorage.removeItem(key);
      setPending(undefined);
      setConfirm(undefined);
      if (result.status === 'completed') {
        setAmount('');
        setNotice('تم الشحن بنجاح.');
      } else if (result.status === 'pending') {
        setSupplyAmount('');
        setNotice('أُرسل طلب التزويد للإدارة.');
        const records = await agentRpc<History[]>('supplies');
        setRows(records);
        setMore(records.length === 30);
      } else setNotice(messages[result.error ?? ''] ?? 'لم تنجح العملية.');
      await refresh();
    } catch (error) {
      const code = (error as Error).message;
      if (messages[code] && code !== 'AGENT_NOT_APPROVED') {
        localStorage.removeItem(key);
        setPending(undefined);
        setConfirm(undefined);
        if (code === 'AGENT_RECIPIENT_CHANGED') setPerson(undefined);
      }
      setNotice(messages[code] ?? 'تعذر تأكيد العملية. استرجع نفس الطلب قبل بدء عملية جديدة.');
    } finally { lock.current = false; setBusy(false); }
  }

  const coins = Number(amount);
  const canCharge = Boolean(person && state && !checking && coins > 0 && coins <= max && coins <= state.balance && !pending && !busy);
  const send = (action: Intent['action'], data: Intent['data']) => void submit({ action, data, requestId: crypto.randomUUID() });
  const back = () => { setNotice(''); if (page) setPage(undefined); else onClose(); };

  return <div className="ra-screen" dir="rtl">
    <div className="ra-frame" inert={Boolean(confirm && !pending)}>
      <header className="ra-header">
        <button type="button" aria-label="سجل عمليات الشحن" disabled={busy} onClick={() => void loadPage('history')}><HistoryIcon /></button>
        <h1><Wallet />{page === 'history' ? 'سجل عمليات الشحن' : page === 'supplies' ? 'طلبات التزويد' : 'وكيل الشحن'}</h1>
        <button type="button" aria-label="رجوع" disabled={busy} onClick={back}><ArrowLeft /></button>
      </header>
      {page ? <main className="ra-history">
        {page === 'supplies' && <form onSubmit={event => {
          event.preventDefault();
          send('request_supply', { coins: Number(supplyAmount) });
        }}>
          <label htmlFor="ra-supply">الكمية المطلوبة</label>
          <input id="ra-supply" inputMode="numeric" dir="ltr" value={supplyAmount}
            onChange={event => setSupplyAmount(digits(event.target.value).slice(0, 10))} />
          <button className="ra-primary" disabled={busy || !!pending || !state || Number(supplyAmount) < 1 || Number(supplyAmount) > max}>إرسال الطلب</button>
        </form>}
        {!busy && !rows.length && <p>لا توجد عمليات لعرضها.</p>}
        {rows.map(row => <article key={row.id}>
          {page === 'history' && row.result.recipient && <Account person={row.result.recipient} />}
          <p>{num(row.coins)} عملة · {row.status === 'completed' ? page === 'history' ? 'ناجحة' : 'تم التزويد' : row.status === 'pending' ? 'قيد المراجعة' : page === 'history' ? 'فاشلة' : 'مرفوض'}</p>
          <small>{timestamp(row.created_at)} · <bdi>{row.id}</bdi></small>
          {row.result.note && <p>{row.result.note}</p>}
        </article>)}
        {more && <button type="button" className="ra-primary" disabled={busy} onClick={() => void loadPage(page, true)}>عرض المزيد</button>}
      </main> : <>
        <section className="ra-balance" aria-label="رصيد الوكيل">
          <button type="button" className="ra-primary" disabled={busy} onClick={() => void loadPage('supplies')}><Plus /> طلب تزويد</button>
          <div><span>رصيد الوكيل</span><strong dir="ltr">{state ? num(state.balance) : '—'}</strong></div>
          <Coins />
        </section>
        <section className="ra-charge">
          <h2>شحن مستخدم</h2>
          <div className="ra-row">
            <button type="button" className="ra-primary" disabled={id.length !== 6 || checking || !!pending || busy || !state} onClick={() => void lookup()}><Search /> تحقق</button>
            <div className="ra-id">
              <input aria-label="رقم ID المستخدم" dir="ltr" inputMode="numeric" placeholder="000000" value={id} onChange={event => editId(event.target.value)} disabled={!!pending || busy} />
              {id && <button type="button" aria-label="مسح الرقم" disabled={!!pending || busy} onClick={() => editId('')}><X /></button>}
            </div>
          </div>
          {person ? <Account person={person} /> : <div className="ra-account ra-placeholder">{checking ? 'جارٍ التحقق…' : 'تحقّق من ID لعرض الحساب'}</div>}
          <div className="ra-presets" role="group" aria-label="كميات الشحن الجاهزة">
            {chargePresets.map(preset => (
              <button type="button" key={preset} aria-pressed={coins === preset} dir="ltr"
                disabled={!!pending || busy} onClick={() => setAmount(String(preset))}>{num(preset)}</button>
            ))}
          </div>
          <div className="ra-row ra-amount">
            <button type="button" className="ra-primary" aria-label="زيادة العملات" disabled={!!pending || busy} onClick={() => setAmount(String(Math.min(max, coins + 1000)))}><Plus /></button>
            <input aria-label="كمية العملات" dir="ltr" inputMode="numeric" placeholder="0" value={amount ? num(coins) : ''} disabled={!!pending || busy}
              onChange={event => setAmount(digits(event.target.value).slice(0, 10))} />
            <button type="button" className="ra-primary" aria-label="تقليل العملات" disabled={!!pending || busy} onClick={() => setAmount(String(Math.max(0, coins - 1000)))}><Minus /></button>
          </div>
          <button type="button" className="ra-primary ra-submit" disabled={!canCharge} onClick={() => {
            if (person && state) setConfirm({ person, coins, left: state.balance - coins });
          }}><Zap /> شحن الآن</button>
        </section>
        <section className="ra-stats">
          {[[BarChart3, 'شحن الشهر', state?.month], [CalendarDays, 'شحن اليوم', state?.today], [List, 'العمليات', state?.count]].map(([Icon, label, value]) => {
            const StatIcon = Icon as typeof BarChart3;
            return <div key={String(label)}><StatIcon /><span>{String(label)}</span><strong dir="ltr">{typeof value === 'number' ? num(value) : '—'}</strong></div>;
          })}
        </section>
      </>}
      <footer className="ra-feedback" role="status">
        {notice || (state && coins > state.balance ? 'رصيد الوكيل غير كافٍ.' : '')}
        {pending && <button type="button" disabled={busy} onClick={() => void submit(pending)}>استرجاع العملية</button>}
        {!state && !pending && <button type="button" onClick={() => void refresh()}>تحديث</button>}
      </footer>
    </div>
    {confirm && !pending && <div className="ra-overlay" role="dialog" aria-modal="true" aria-label="تأكيد الشحن">
      <section><h2>تأكيد الشحن</h2><Account person={confirm.person} />
        <p>كمية الشحن <b>{num(confirm.coins)}</b></p><p>رصيد الوكيل بعد الشحن <b>{num(confirm.left)}</b></p>
        <div className="ra-row">
          <button type="button" className="ra-primary" disabled={busy} onClick={() => send('charge', {
            coins: confirm.coins, public_id: confirm.person.public_id, recipient_id: confirm.person.id,
          })}>تأكيد</button>
          <button type="button" disabled={busy} onClick={() => setConfirm(undefined)}>إلغاء</button>
        </div>
      </section>
    </div>}
  </div>;
}
