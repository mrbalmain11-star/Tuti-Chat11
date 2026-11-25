import { useEffect, useState, type FormEvent } from 'react';
import { freeGameNames } from '../features/games/freeGame';
import { stagingBackend } from '../services/stagingBackend';

type Game = { code: string; enabled: boolean; maintenance: boolean; version: string; plays: number; players: number };
type Report = { games: Game[]; audit: { at: string; actor: string; code: string; current: Game }[] };

export function AdminEmbeddedGamesPanel() {
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revision, refresh] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      const response = await stagingBackend?.rpc('totichat_embedded_admin');
      if (!active) return;
      setError(!response || Boolean(response.error));
      if (response?.data) setReport(response.data as Report);
    }
    void load();
    return () => { active = false; };
  }, [revision]);
  async function save(event: FormEvent<HTMLFormElement>, code: string) {
    event.preventDefault();
    if (!stagingBackend || saving) return;
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await stagingBackend.rpc('totichat_embedded_admin', {
        p_code: code, p_enabled: fields.has('enabled'), p_maintenance: fields.has('maintenance'), p_version: fields.get('version'),
      });
      if (response.error) throw response.error;
      setReport(response.data as Report);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }
  return <section dir="rtl" className="space-y-3 rounded-xl border border-amber-300 p-3">
    <h3 className="font-bold">إدارة الألعاب المدمجة</h3>
    {error && <p role="alert">تعذر تحديث بيانات الألعاب. <button type="button" className="underline" onClick={() => refresh(revision + 1)}>إعادة المحاولة</button></p>}
    {report?.games.map(game => <form key={game.code + game.version + game.enabled + game.maintenance} onSubmit={event => void save(event, game.code)}
      className="grid gap-2 rounded-xl border p-3">
      <h4 className="font-bold">{freeGameNames[game.code] ?? game.code}</h4>
      <p><bdi>{game.plays}</bdi> محاولة · <bdi>{game.players}</bdi> لاعب</p>
      <label><input name="enabled" type="checkbox" defaultChecked={game.enabled} /> مفعّلة</label>
      <label><input name="maintenance" type="checkbox" defaultChecked={game.maintenance} /> وضع الصيانة</label>
      <label> الإصدار <input dir="ltr" name="version" className="rounded border px-2" defaultValue={game.version}
        pattern="[0-9]+[.][0-9]+[.][0-9]+" maxLength={30} required /></label>
      <button type="submit" disabled={saving} className="rounded bg-emerald-900 p-2 text-white">حفظ</button>
    </form>)}
    {report && <details>
      <summary>سجل إدارة الألعاب</summary>
      {report.audit.length === 0 && <p>لا توجد عمليات مسجّلة.</p>}
      {report.audit.map(item => <p key={item.code + item.at} className="border-b py-2 text-sm">
        {freeGameNames[item.code]} · <bdi>{item.current.version}</bdi> · {item.current.maintenance ? 'صيانة' : item.current.enabled ? 'مفعّلة' : 'معطّلة'}
        {' · '}<bdi>{new Date(item.at).toLocaleString('ar-IQ-u-nu-latn', { timeZone: 'Asia/Baghdad' })}</bdi>
      </p>)}
    </details>}
  </section>;
}
