import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Gamepad2, Landmark, Users, Building2, Coins } from 'lucide-react';
import { stagingBackend } from '../../services/stagingBackend';
import { imageUrl } from '../../services/imageUrl';

const pools = {
  games: { name: 'محفظة الألعاب', Icon: Gamepad2 },
  accounts: { name: 'محفظة الحسابات', Icon: Users },
  agents: { name: 'محفظة الوكلاء', Icon: Building2 },
} as const;
type Pool = keyof typeof pools;
type Account = Pool | 'treasury' | 'issuance' | 'user' | 'agent';
type Action = 'issue' | 'fund' | 'withdraw' | 'transfer' | 'charge' | 'reverse';
const labels: Record<Action, string> = {
  issue: 'إصدار كوينز', fund: 'شحن المحفظة', withdraw: 'سحب إلى الخزينة',
  transfer: 'تحويل بين المحافظ', charge: 'شحن حساب', reverse: 'عكس العملية',
};
const scopeLabels: Record<string, string> = {
  'games.read': 'عرض محفظة الألعاب', 'games.fund': 'شحن محفظة الألعاب',
  'accounts.read': 'عرض محفظة الحسابات', 'accounts.fund': 'شحن محفظة الحسابات', 'accounts.charge': 'شحن المستخدمين',
  'agents.read': 'عرض محفظة الوكلاء', 'agents.fund': 'شحن محفظة الوكلاء', 'agents.charge': 'شحن الوكلاء',
  transfer: 'التحويل بين المحافظ', withdraw: 'السحب إلى الخزينة', ledger: 'السجلات', stats: 'الإحصائيات',
};

const accountName = (account: Account) => account in pools ? pools[account as Pool].name :
  ({ treasury: 'خزينة التطبيق', issuance: 'إصدار', user: 'حساب مستخدم', agent: 'حساب وكيل' } as const)[account as Exclude<Account,Pool>];
const money = (value?: string | number | null) => value == null ? '—' : BigInt(value).toLocaleString('en-US');
const control = 'w-full min-w-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-slate-900';
const button = 'rounded-lg bg-emerald-900 px-3 py-2 text-white disabled:opacity-50';
type Overview = {
  owner: boolean; scopes: string[]; treasury: string | null; balances: Partial<Record<Pool,string>>;
  games: { reserved: string; available: string; byGame: { game: string; stakes: string; prizes: string; net: string }[] } | null;
  poolTotals: Partial<Record<Pool,{funded:string;charged:string;withdrawn:string;recovered:string;recipients:number}>>;
  stats: { circulating: string; gameNet: string; agentSales: string; issued: string; users: string; agentBalances: string; approvedAgents: number;
    periods: Record<string, Record<'fund' | 'charge' | 'transfer' | 'withdraw',string>> } | null;
};
type Recipient = { id: string; name: string; public_id: number; avatar_url: string | null; special_id: number | null; balance: string | null; approved: boolean };
type Entry = {
  id: string; kind: Action; amount: string; source: Account; destination: Account; target: string | null;
  actor_identity: { id: number; name: string }; target_identity?: { id: number; name: string };
  reason: string; status: string; created_at: string; reversed_operation: string | null;
  entries: { account: Account; before: string | null; after: string | null }[];
};
type Draft = { kind: Action; source: Account; destination: Account; amount: string; reason: string; target?: string; recipient?: string; reverse?: string };
type Pending = Draft & { request: string };
const date = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Baghdad' });

async function rpc<T>(name: string,args?: Record<string,unknown>): Promise<T> {
  if (!stagingBackend) throw new Error('offline');
  const { data, error } = await stagingBackend.rpc(name,args);
  if (error) throw error;
  return data as T;
}

export function AdminFinance({ accountId }: { accountId: string }) {
  const storageKey = 'totichat:finance-pending:' + accountId;
  const [overview,setOverview] = useState<Overview>();
  const [page,setPage] = useState<Pool | 'ledger' | null>(null);
  const [action,setAction] = useState<Action>();
  const [target,setTarget] = useState<Recipient>();
  const [query,setQuery] = useState('');
  const [recipients,setRecipients] = useState<Recipient[]>([]);
  const [pending,setPending] = useState<Pending | undefined>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? 'null') ?? undefined; }
    catch { return undefined; }
  });
  const [busy,setBusy] = useState(false);
  const lock = useRef(false);
  const [error,setError] = useState('');
  const [result,setResult] = useState('');
  const [revision,setRevision] = useState(0);
  const [reconciliation,setReconciliation] = useState<{at:string;report:Record<string,number|boolean>}>();
  const [ledger,setLedger] = useState<Entry[]>();
  const [filters,setFilters] = useState<Record<string,unknown>>({});
  const [reverse,setReverse] = useState<Entry>();
  const can = (scope: string) => overview?.scopes.includes(scope) ?? false;
  const allowedPools = (Object.keys(pools) as Pool[]).filter(pool => can(pool+'.read'));
  useEffect(() => {
    let active = true;
    void rpc<Overview>('totichat_finance_overview').then(data => { if(active) setOverview(data); }).catch(() => {
      if(active) setError('تعذّر تحميل الأرصدة والصلاحيات.');
    });
    return () => { active=false; };
  },[revision,accountId]);
  const statsAllowed = can('stats');
  useEffect(() => {
    let active = true;
    if (statsAllowed) void rpc<{at:string;report:Record<string,number|boolean>}>('totichat_finance_reconciliation')
      .then(data=>{if(active) setReconciliation(data);}).catch(()=>{if(active) setReconciliation(undefined);});
    return ()=>{active=false;};
  },[statsAllowed,revision]);
  const ledgerAllowed = can('ledger');
  useEffect(() => {
    if (!ledgerAllowed || (page===null)) return;
    let active=true;
    setLedger(undefined);
    void rpc<Entry[]>('totichat_finance_ledger',{...filters,p_pool:page==='ledger'?null:page})
      .then(data => { if(active) setLedger(data); })
      .catch(() => { if(active) setError('تعذّر تحميل سجل العمليات.'); });
    return () => { active=false; };
  },[page,filters,revision,ledgerAllowed]);

  function navigate(next: typeof page) {
    setPage(next); setAction(undefined); setTarget(undefined); setRecipients([]); setQuery(''); setFilters({}); setError('');
  }
  async function search(e: FormEvent) {
    e.preventDefault();
    setTarget(undefined); setRecipients([]); setError('');
    try { setRecipients(await rpc<Recipient[]>('totichat_finance_search',{p_pool:page,p_term:query})); }
    catch { setError('تعذّر البحث عن الحساب.'); }
  }
  function review(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!action || pending) return;
    const form = new FormData(e.currentTarget);
    const amount = String(form.get('amount') ?? '');
    const reason = String(form.get('reason') ?? '').trim();
    if (!/^[1-9][0-9]{0,15}$/.test(amount) || BigInt(amount)>9007199254740991n || reason.length<5) {
      setError('أدخل مبلغاً صحيحاً وسبباً من 5 أحرف على الأقل.'); return;
    }
    const pool = page as Pool;
    const draft: Draft = { kind:action, source:pool, destination:'treasury', amount, reason };
    if (action==='issue') draft.source='issuance';
    if (action==='fund') { draft.source='treasury'; draft.destination=pool; }
    if (action==='transfer') draft.destination=String(form.get('destination')) as Pool;
    if (action==='charge') {
      if (!target) return;
      draft.destination=pool==='accounts'?'user':'agent';
      draft.target=target.id; draft.recipient=target.name+' · '+target.public_id;
    }
    if (action==='reverse') {
      if (!reverse) return;
      draft.source=reverse.destination; draft.destination=reverse.source; draft.amount=reverse.amount;
      draft.target=reverse.target ?? undefined; draft.recipient=reverse.target_identity?.name; draft.reverse=reverse.id;
    }
    setError('');
    setPending({...draft,request:crypto.randomUUID()});
  }
  async function submit() {
    if (!pending || lock.current) return;
    lock.current=true; setBusy(true); setError('');
    try {
      localStorage.setItem(storageKey,JSON.stringify(pending));
      const reference=await rpc<string>('totichat_finance_post',{
        p_request:pending.request,p_kind:pending.kind,p_source:pending.source,p_destination:pending.destination,
        p_amount:pending.amount,p_reason:pending.reason,p_target:pending.target??null,p_reverse:pending.reverse??null,
      });
      localStorage.removeItem(storageKey);
      setPending(undefined); setAction(undefined); setResult(reference); setRevision(value=>value+1);
      window.dispatchEvent(new Event('totichat:wallet-changed'));
    } catch (failure) {
      const code=(failure as {message?:string;code?:string}).message;
      const known: Record<string,string> = {
        FINANCE_BALANCE_UNAVAILABLE:'الرصيد المتاح لا يكفي، أو حساب الاستلام غير متاح.',
        FINANCE_LIMIT:'تجاوزت سقف العملية المفوضة.',
        FINANCE_FORBIDDEN:'صلاحياتك لا تسمح بهذه العملية.',
        FINANCE_AGENT_NOT_APPROVED:'الوكيل غير معتمد حالياً.',
        FINANCE_ALREADY_REVERSED:'تم عكس هذه العملية سابقاً.',
      };
      if (code && Object.hasOwn(known,code)) { localStorage.removeItem(storageKey); setPending(undefined); }
      setError((code && known[code]) || 'تعذّر تأكيد حالة العملية. أعد المحاولة بنفس المرجع.');
    } finally { lock.current=false; setBusy(false); }
  }
  async function delegate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data=new FormData(e.currentTarget);
    setError('');
    try {
      await rpc('totichat_finance_delegate',{p_staff:Number(data.get('staff')),p_scopes:data.getAll('scope'),p_limit:String(data.get('limit')??'')||null});
      setResult('تم تحديث الصلاحيات');
    } catch { setError('تعذّر تحديث صلاحيات المسؤول.'); }
  }
  if (overview && !overview.owner && overview.scopes.length===0) return null;
  return <section dir="rtl" className="royal-admin-finance space-y-3">
    <div className="royal-admin-treasury">
      <h2 className="flex items-center gap-2 font-black"><Landmark size={20}/> الإدارة المالية</h2>
      <Coins className="royal-treasury-coins" size={47} aria-hidden="true" />
      {overview?.treasury!=null && <p>خزينة التطبيق <bdi>{money(overview.treasury)} Coins</bdi></p>}
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-red-800">{error}</p>}
    {result && <p role="status" className="break-all text-emerald-900">تمت العملية · <bdi>{result}</bdi></p>}
    {!overview && <button type="button" className={button} onClick={()=>setRevision(value=>value+1)}>تحديث البيانات</button>}
    {page===null ? <>
      <div className="grid grid-cols-3 gap-1.5">
        {allowedPools.map(pool=>{ const { name,Icon }=pools[pool]; return <button key={pool} type="button" className="royal-admin-wallet" onClick={()=>navigate(pool)}>
          <Icon className="mx-auto mb-1" size={24}/><strong className="block">{name}</strong><bdi>{money(overview?.balances[pool])} Coins</bdi>
        </button>; })}
      </div>
      <div className="flex flex-wrap gap-2">
        {overview?.owner && <button className={button} onClick={()=>setAction('issue')}>{labels.issue}</button>}
        {can('ledger') && <button className={button} onClick={()=>navigate('ledger')}>السجل المالي المركزي</button>}
      </div>
      {overview?.stats && <details><summary>الإحصائيات المالية</summary>
        <p>المصدرة <bdi>{money(overview.stats.issued)}</bdi> · المتداولة لدى المستخدمين والوكلاء <bdi>{money(overview.stats.circulating)}</bdi> · المستخدمون <bdi>{money(overview.stats.users)}</bdi> · الوكلاء <bdi>{money(overview.stats.agentBalances)}</bdi> · الوكلاء المعتمدون <bdi>{overview.stats.approvedAgents}</bdi></p>
        <p>صافي الألعاب <bdi>{money(overview.stats.gameNet)}</bdi> · المبيعات المسجّلة للوكلاء <bdi>{money(overview.stats.agentSales)}</bdi></p>
        {reconciliation && <p>آخر مطابقة <bdi>{date.format(new Date(reconciliation.at))}</bdi> · {
          Object.values(reconciliation.report).some(Boolean)?'توجد فروقات تحتاج مراجعة':'الأرصدة مطابقة للسجل'
        }</p>}
        {Object.entries(overview.stats.periods).map(([period,stats])=><p key={period}>
          {({day:'اليوم',week:'الأسبوع',month:'الشهر'})[period as 'day'|'week'|'month']} · {Object.entries(stats).map(([key,value])=><span key={key}> {labels[key as Action]} <bdi>{money(value)}</bdi> </span>)}
        </p>)}
      </details>}
      {overview?.owner && <details><summary>منح وسحب الصلاحيات المالية</summary>
        <form onSubmit={event=>void delegate(event)} className="grid gap-2">
          <input className={control} name="staff" inputMode="numeric" pattern="[0-9]{6}" placeholder="ID الأدمن" required />
          <input className={control} name="limit" inputMode="numeric" pattern="[0-9]{1,16}" placeholder="سقف العملية المفوضة" />
          {Object.entries(scopeLabels).map(([scope,label])=><label key={scope}><input type="checkbox" name="scope" value={scope}/> {label}</label>)}
          <button className={button}>حفظ الصلاحيات</button>
          <small>احفظ القائمة فارغة لسحب التفويض.</small>
        </form>
      </details>}
    </> : <>
      <button className={button} onClick={()=>navigate(null)}>رجوع للمحافظ</button>
      <h3 className="font-bold">{page==='ledger'?'السجل المالي المركزي':pools[page].name}</h3>
      {page!=='ledger' && <>
        <p>الرصيد <bdi>{money(overview?.balances[page])} Coins</bdi></p>
        {overview?.poolTotals[page] && <p>
          التمويل <bdi>{money(overview.poolTotals[page].funded)}</bdi> · السحب <bdi>{money(overview.poolTotals[page].withdrawn)}</bdi>
          {' · '}المسترجع <bdi>{money(overview.poolTotals[page].recovered)}</bdi>
          {page!=='games' && <> · الشحن <bdi>{money(overview.poolTotals[page].charged)}</bdi> · الحسابات المشحونة <bdi>{overview.poolTotals[page].recipients}</bdi></>}
        </p>}
        {page==='games' && overview?.games && <div className="space-y-1">
          <p>المحجوز <bdi>{money(overview.games.reserved)}</bdi> · المتاح <bdi>{money(overview.games.available)}</bdi></p>
          {overview.games.byGame.map(row=><p key={row.game}>{row.game} · الرهانات <bdi>{money(row.stakes)}</bdi> · الجوائز <bdi>{money(row.prizes)}</bdi> · الصافي <bdi>{money(row.net)}</bdi></p>)}
        </div>}
        <div className="flex flex-wrap gap-2">
          {can(page+'.fund') && <button className={button} onClick={()=>setAction('fund')}>{labels.fund}</button>}
          {can('withdraw') && <button className={button} onClick={()=>setAction('withdraw')}>{labels.withdraw}</button>}
          {can('transfer') && allowedPools.length>1 && <button className={button} onClick={()=>setAction('transfer')}>{labels.transfer}</button>}
          {page!=='games' && can(page+'.charge') && <button className={button} onClick={()=>setAction('charge')}>{page==='accounts'?'شحن حساب مستخدم':'شحن حساب وكيل'}</button>}
        </div>
      </>}
    </>}
    {action==='charge' && <form onSubmit={event=>void search(event)} className="space-y-2">
      <input className={control} value={query} onChange={event=>setQuery(event.target.value)} placeholder="الاسم أو ID" minLength={2} maxLength={64} required/>
      <button className={button}>بحث</button>
      {recipients.map(person=><button type="button" key={person.id} aria-pressed={target?.id===person.id}
        className="flex w-full items-center gap-2 rounded-lg border border-amber-300 p-2 aria-pressed:bg-amber-100"
        disabled={page==='agents'&&!person.approved} onClick={()=>setTarget(person)}>
        {person.avatar_url && <img className="size-8 rounded-full object-cover" src={imageUrl(person.avatar_url)} alt=""/>}
        {person.name} · <bdi>{person.public_id}</bdi>{person.special_id && <> · مميز <bdi>{person.special_id}</bdi></>} · <bdi>{money(person.balance)}</bdi>{page==='agents'&& (person.approved?' · معتمد':' · غير معتمد')}
      </button>)}
    </form>}
    {action && !pending && <form key={action} onSubmit={review} className="grid gap-2 rounded-lg border border-amber-300 p-2">
      <h4 className="font-bold">{labels[action]}</h4>
      {action==='transfer' && <select className={control} name="destination" required>{allowedPools.filter(pool=>pool!==page).map(pool=><option key={pool} value={pool}>{pools[pool].name}</option>)}</select>}
      <input className={control} name="amount" aria-label="المبلغ" placeholder="المبلغ" inputMode="numeric" pattern="[1-9][0-9]{0,15}"
        defaultValue={action==='reverse'?reverse?.amount:undefined} readOnly={action==='reverse'} required/>
      <textarea className={control} name="reason" aria-label="سبب العملية" placeholder="سبب العملية" minLength={5} maxLength={460} required/>
      <button className={button} disabled={action==='charge'&&!target}>مراجعة العملية</button>
    </form>}
    {pending && <div role="group" aria-label="مراجعة العملية المالية" className="space-y-2 rounded-lg border border-amber-400 bg-amber-50 p-3">
      <p>{labels[pending.kind]} · {accountName(pending.source)} ← {accountName(pending.destination)}</p>
      <p>{pending.recipient} · <bdi>{money(pending.amount)} Coins</bdi></p><p>{pending.reason}</p>
      <button className={button} onClick={()=>void submit()} disabled={busy}>{busy?'جارٍ التأكيد…':'تأكيد العملية أو إعادة المحاولة'}</button>
      <button className="ms-2 underline" onClick={()=>setPending(undefined)} disabled={busy||localStorage.getItem(storageKey)!==null}>رجوع للمراجعة</button>
    </div>}
    {ledgerAllowed && page!==null && <details open>
      <summary>سجل العمليات</summary>
      <form className="grid grid-cols-2 gap-2 py-2" onSubmit={event=>{
        event.preventDefault(); const data=new FormData(event.currentTarget);
        setFilters(Object.fromEntries([...data.entries()].filter(([,value])=>value!=='')));
      }}>
        <label>من <input className={control} name="p_since" type="date"/></label>
        <label>إلى <input className={control} name="p_until" type="date"/></label>
        <input className={control} name="p_actor" inputMode="numeric" pattern="[0-9]{1,9}" placeholder="ID المسؤول"/>
        <input className={control} name="p_amount" inputMode="numeric" pattern="[0-9]{1,16}" placeholder="المبلغ"/>
        <select className={control} name="p_kind"><option value="">كل الأنواع</option>{Object.entries(labels).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select>
        <button className={button}>تصفية</button>
      </form>
      {ledger?.length===0 && <p>لا توجد عمليات مطابقة.</p>}
      {ledger?.map(row=><article key={row.id} className="space-y-1 border-b border-amber-200 py-2 text-sm">
        <p className="font-bold">{labels[row.kind]} · <bdi>{money(row.amount)} Coins</bdi> · مكتملة</p>
        <p>{accountName(row.source)} ← {accountName(row.destination)} · {row.target_identity?.name}</p>
        <p>{row.actor_identity.name} · <bdi>{row.actor_identity.id}</bdi> · <bdi>{date.format(new Date(row.created_at))}</bdi></p>
        <p className="break-all"><bdi>{row.id}</bdi></p><p>{row.reason}</p>
        {row.entries.map(entry=><p key={entry.account}>{accountName(entry.account)} · قبل <bdi>{money(entry.before)}</bdi> · بعد <bdi>{money(entry.after)}</bdi></p>)}
        {row.reversed_operation && <p className="break-all">عكس العملية <bdi>{row.reversed_operation}</bdi></p>}
        {overview?.owner && row.kind!=='issue' && row.kind!=='reverse' && <button className="underline" onClick={()=>{ setReverse(row); setAction('reverse'); }}>عكس العملية</button>}
      </article>)}
      {ledger?.length===50 && <button className={button} onClick={()=>{const last=ledger.at(-1)!;setFilters({...filters,p_before:last.created_at,p_before_id:last.id});}}>العمليات الأقدم</button>}
    </details>}
  </section>;
}
