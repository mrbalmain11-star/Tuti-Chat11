import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, Clock3, Coins } from 'lucide-react';
import { imageUrl } from '../services/imageUrl';

type Host = { id: string; public_id: number | null; name: string | null; avatar: string | null; coins: string };
type Agency = { id: string; name: string; hosts: Host[] };
type Report = { agencies: Agency[] };
type ReportState = { key: string; report?: Report; error?: string };

const monthFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit' });
const formatCoins = new Intl.NumberFormat('ar-IQ-u-nu-latn');
const card = 'rounded-2xl border border-emerald-100 bg-white p-4';

function Activity() {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-3">
      <Metric label="الأيام الفعّالة" icon={<CalendarDays size={15} />} />
      <Metric label="إجمالي الوقت" icon={<Clock3 size={15} />} />
    </div>
  );
}

function Metric({ label, value = 'غير متاح', icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-xs text-slate-600">{icon}{label}</div>
      <div className="mt-1 font-bold text-emerald-800">{value}</div>
    </div>
  );
}

function Earnings({ coins }: { coins: bigint }) {
  return (
    <>
      <section className={card}>
        <div className="flex items-center gap-2 text-sm font-bold"><Coins size={18} className="text-amber-600" /> الكوينز المستلمة</div>
        <div className="mt-2 text-2xl font-black tabular-nums text-emerald-800">{formatCoins.format(coins)}</div>
        <p className="mt-2 text-xs text-slate-600">هدف الكوينز الشهري غير متاح</p>
      </section>
      <section className={card + ' grid grid-cols-2 gap-4'}>
        <Metric label="راتب الكوينز" />
        <Metric label="راتب الماس" />
        <Metric label="مستوى راتب الماس" />
      </section>
    </>
  );
}

export function AgencyDataCenter({ view, onBack }: { view: 'agent' | 'host'; onBack: () => void }) {
  const parts = monthFormat.formatToParts(new Date());
  const currentMonth = parts.find(part => part.type === 'year')?.value + '-' + parts.find(part => part.type === 'month')?.value;
  const [month, setMonth] = useState(currentMonth);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ReportState>();
  const key = month + '/' + attempt;
  const visible = state?.key === key ? state : undefined;

  useEffect(() => {
    let active = true;
    void (async () => {
      const { stagingBackend } = await import('../services/stagingBackend');
      if (!stagingBackend) throw new Error('لم يتم إعداد الاتصال بخادم الوكالة');
      const { data, error } = await stagingBackend.rpc('staging_agency_monthly_data', { p_month: month + '-01', p_view: view });
      if (error) {
        console.warn('Agency monthly report failed:', error.code, error.message);
        throw new Error(error.code === '42501' ? 'أعد تسجيل الدخول وتحقّق من رمز البريد لعرض البيانات' : 'تعذّر تحميل بيانات الشهر');
      }
      if (active) setState({ key, report: data as Report });
    })().catch((error: unknown) => {
      if (active) setState({ key, error: error instanceof Error ? error.message : 'تعذّر تحميل بيانات الشهر' });
    });
    return () => { active = false; };
  }, [key, month, view]);

  return (
    <div dir="rtl" className="relative z-30 flex h-full min-h-0 w-full flex-col bg-[#f2f8f5] text-slate-900">
      <header className="flex shrink-0 items-center gap-2 border-b border-emerald-100 bg-white px-3 py-3">
        <button type="button" onClick={onBack} aria-label="العودة إلى مركز الوكالة" className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><ChevronRight size={23} /></button>
        <h2 className="font-black">{view === 'agent' ? 'مركز بيانات الوكالة' : 'مركز بيانات المضيف'}</h2>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <label className={card + ' flex items-center justify-between gap-2 text-sm font-bold'}>
          شهر التقرير
          <input type="month" min="2000-01" max={currentMonth} value={month} dir="ltr"
            onChange={event => { const value = event.currentTarget.value; if (/^\d{4}-\d{2}$/.test(value) && value >= '2000-01' && value <= currentMonth) setMonth(value); }}
            className="min-w-0 rounded-lg bg-emerald-50 px-2 py-1.5 text-emerald-900" />
        </label>
        {!visible && <p role="status" className={card}>جارٍ تحميل بيانات الشهر…</p>}
        {visible?.error && <p role="alert" className={card}>{visible.error} <button type="button" onClick={() => setAttempt(attempt + 1)} className="font-bold text-emerald-800 underline">إعادة المحاولة</button></p>}
        {visible?.report?.agencies.length === 0 && <p className={card}>ماكو وكالة مضيفين نشطة مرتبطة بحسابك.</p>}
        {visible?.report?.agencies.map(agency => (
          <div key={agency.id} className="space-y-3">
            <section className={card + ' space-y-3'}>
              <h3 className="font-black">{agency.name}</h3>
              <Activity />
              {view === 'agent' && <div className="grid grid-cols-2 gap-3">
                <Metric label="رواتب المضيفين" />
                <Metric label="راتب الوكيل" />
                <Metric label="إجمالي رواتب الوكالة" />
                <Metric label="عمولة الوكيل" />
              </div>}
            </section>
            <Earnings coins={agency.hosts.reduce((total, host) => total + BigInt(host.coins), 0n)} />
            {view === 'agent' && <section className={card}>
              <h3 className="mb-2 font-black">تفاصيل المضيفين</h3>
              {agency.hosts.length === 0 && <p className="text-sm text-slate-600">ماكو مضيفين مرتبطين بالوكالة.</p>}
              {agency.hosts.map((host, index) => (
                <details key={host.id} className="border-t border-emerald-100 py-2">
                  <summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-sm">
                    <span className="text-xs text-slate-600">{index + 1}</span>
                    {host.avatar && <img src={imageUrl(host.avatar)} alt="" loading="lazy" className="size-8 rounded-full object-cover" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{host.name || 'مضيف'}</span>
                      {host.public_id && <span className="block text-xs text-slate-600" dir="ltr">ID: {host.public_id}</span>}
                    </span>
                    <span className="font-bold text-emerald-800">{formatCoins.format(BigInt(host.coins))}</span>
                    <ChevronDown size={15} aria-hidden="true" />
                  </summary>
                  <div className="space-y-2 pt-2"><Activity /><Earnings coins={BigInt(host.coins)} /></div>
                </details>
              ))}
            </section>}
          </div>
        ))}
      </div>
    </div>
  );
}
