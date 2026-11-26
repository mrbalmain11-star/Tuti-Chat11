import { AdminEmbeddedGamesPanel } from './AdminEmbeddedGamesPanel';
import { useEffect, useState } from 'react';
import { gameName } from '../features/games/api';
import { stagingBackend } from '../services/stagingBackend';

const labels = {
  staked: 'إجمالي كونز المشاركات',
  player_losses: 'خسائر اللاعبين',
  player_profits: 'أرباح اللاعبين',
  net: 'صافي أرباح الألعاب',
  net_today: 'صافي اليوم',
  net_week: 'صافي الأسبوع',
  net_month: 'صافي الشهر',
  entries: 'عدد المشاركات',
  rounds: 'عدد الجولات',
  players: 'عدد اللاعبين',
} as const;
const operations = {
  seed: 'التمويل التأسيسي',
  stake: 'مشاركة',
  payout: 'دفع جائزة',
  refund: 'رد مشاركة',
  distribution: 'تحويل أرباح إلى الخزينة',
} as const;
type Report = {
  treasury: { principal: number; coins: number; reserved: number } | null;
  totals: Record<keyof typeof labels, number>;
  distributed: number;
  games: { code: string; entries: number; rounds: number; players: number; staked: number; net: number }[];
  ledger: { id: number; operation_id: string; kind: keyof typeof operations; delta: number; balance_after: number; created_at: string }[];
  monthly: { month: string; net: number; loss_carry: number; distributable: number; transferred: number }[];
};
const number = new Intl.NumberFormat('en-US');
const date = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'Asia/Baghdad', dateStyle: 'short', timeStyle: 'short' });

export function AdminGamesTreasuryPanel() {
  const [report, setReport] = useState<Report>();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    setReport(undefined);
    void (async () => {
      if (!stagingBackend) throw new Error('Games service unavailable');
      const { data, error: loadError } = await stagingBackend.rpc('games_treasury_report');
      if (loadError || !data) throw loadError ?? new Error('Games report unavailable');
      if (active) setReport(data as Report);
    })().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);

  if (error) return <p role="alert">تعذر تحميل محفظة الألعاب. <button type="button" className="underline"
    onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button></p>;
  if (!report) return <p role="status">جارٍ تحميل محفظة الألعاب…</p>;
  const { treasury, totals, distributed, games, ledger, monthly } = report;
  const metrics: [string, number][] = [
    ...(treasury ? [['رأس المال التأسيسي', treasury.principal], ['الرصيد الحالي', treasury.coins], ['المحجوز للجوائز', treasury.reserved]] as [string, number][] : []),
    ...Object.entries(labels).map(([key, label]): [string, number] => [label, totals[key as keyof typeof labels]]),
    ['التحويلات إلى خزينة التطبيق', distributed],
  ];
  return <section dir="rtl" className="space-y-4">
    <AdminEmbeddedGamesPanel />
    <button type="button" className="rounded-xl border bg-white px-3 py-2 font-bold" onClick={() => setAttempt(value => value + 1)}>تحديث</button>
    {!treasury && <p role="status" className="rounded-xl bg-amber-50 p-3">التمويل التأسيسي بعده ما تفعّل.</p>}
    <dl className="grid grid-cols-2 gap-2">
      {metrics.map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-3">
        <dt className="text-xs text-slate-600">{label}</dt><dd className="font-bold"><bdi>{number.format(value)}</bdi></dd>
      </div>)}
    </dl>
    <details className="rounded-xl border bg-white p-3">
      <summary className="font-bold">إحصائيات الألعاب</summary>
      {games.map(game => <p key={game.code} className="border-b py-2 text-sm">
        <strong>{gameName(game.code)}</strong><br />
        <bdi>{number.format(game.entries)}</bdi> مشاركة · <bdi>{number.format(game.rounds)}</bdi> جولة · <bdi>{number.format(game.players)}</bdi> لاعب<br />
        المشاركات <bdi>{number.format(game.staked)}</bdi> · الصافي <bdi>{number.format(game.net)}</bdi>
      </p>)}
    </details>
    <details className="rounded-xl border bg-white p-3">
      <summary className="font-bold">سجل العمليات · آخر 100</summary>
      {!ledger.length && <p>لا توجد عمليات مسجلة.</p>}
      {ledger.map(row => <p key={row.id} className="break-all border-b py-2 text-sm">
        {operations[row.kind]} · <bdi>{number.format(row.delta)}</bdi> · الرصيد <bdi>{number.format(row.balance_after)}</bdi><br />
        {date.format(new Date(row.created_at))} · <bdi>{row.operation_id}</bdi>
      </p>)}
    </details>
    <details className="rounded-xl border bg-white p-3">
      <summary className="font-bold">التسويات الشهرية</summary>
      {!monthly.length && <p>لا توجد تسويات مسجلة.</p>}
      {monthly.map(row => <p key={row.month} className="border-b py-2 text-sm">
        <bdi>{row.month.slice(0, 7)}</bdi> · الصافي <bdi>{number.format(row.net)}</bdi> · المحول <bdi>{number.format(row.transferred)}</bdi><br />
        القابل للتوزيع <bdi>{number.format(row.distributable)}</bdi> · الخسائر المرحّلة <bdi>{number.format(row.loss_carry)}</bdi>
      </p>)}
    </details>
  </section>;
}
