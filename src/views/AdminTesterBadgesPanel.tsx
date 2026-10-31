import React, { useEffect, useState } from 'react';
import { Award, RefreshCw } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';

type Tester = { public_id: number; display_name: string; granted_at: string };

export const AdminTesterBadgesPanel: React.FC = () => {
  const [id, setId] = useState('');
  const [items, setItems] = useState<Tester[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const reload = async () => {
    if (!stagingBackend) throw new Error('الخادم غير متصل');
    const { data, error } = await stagingBackend.rpc('owner_list_tester_badges');
    if (error) throw error;
    setItems((data ?? []) as Tester[]);
  };
  useEffect(() => { void reload().catch(e => setError(e instanceof Error ? e.message : String(e))); }, []);
  const change = async (publicId: number, grant: boolean) => {
    if (!stagingBackend || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error } = await stagingBackend.rpc('owner_manage_tester_badge', { p_public_id: publicId, p_grant: grant });
      if (error) throw error;
      await reload();
      setNotice(grant ? 'تم منح شارة المختبر' : 'تم سحب شارة المختبر');
      setId('');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const numericId = /^\\d{6}$/.test(id) ? Number(id) : null;
  return <section className="space-y-4" dir="rtl">
    <div className="rounded-2xl bg-gradient-to-br from-[#21103f] via-[#4b2380] to-[#130c2c] text-amber-200 p-5 border border-amber-400 shadow-lg">
      <Award size={36} className="text-amber-300 mb-2"/>
      <h3 className="text-xl font-black">شارة TotiChat TESTER</h3>
      <p className="text-sm mt-2 text-purple-100">تكريم خاص للمساهمين في اختبار التطبيق. المنح والسحب متاحان للمالك فقط.</p>
    </div>
    <div className="bg-white rounded-2xl p-4 border border-amber-200 space-y-3">
      <label htmlFor="tester-public-id" className="font-bold block">ID المستخدم (6 أرقام)</label>
      <input id="tester-public-id" inputMode="numeric" maxLength={6} value={id} onChange={e=>setId(e.target.value.replace(/\\D/g,''))} placeholder="123456" className="w-full rounded-xl border border-slate-300 p-3" dir="ltr"/>
      <button disabled={busy || numericId === null} onClick={()=>numericId!==null && void change(numericId,true)} className="w-full rounded-xl bg-amber-600 text-white p-3 font-black disabled:opacity-40">منح الشارة</button>
    </div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {notice && <p role="status" className="text-green-700">{notice}</p>}
    <div className="flex justify-between items-center"><h3 className="font-black">الحاصلون على الشارة ({items.length})</h3><button disabled={busy} aria-label="تحديث القائمة" onClick={()=>void reload().catch(e=>setError(String(e)))}><RefreshCw size={20}/></button></div>
    {items.map(item=><div key={item.public_id} className="bg-white rounded-xl border border-amber-200 p-3 flex items-center justify-between gap-2">
      <div><div className="font-bold">{item.display_name || 'مستخدم'}</div><div className="text-sm text-slate-500" dir="ltr">{item.public_id}</div><div className="text-xs text-slate-400">{new Date(item.granted_at).toLocaleDateString('ar-IQ')}</div></div>
      <button disabled={busy} onClick={()=>void change(item.public_id,false)} className="rounded-lg border border-red-200 text-red-700 px-3 py-2 disabled:opacity-40">سحب</button>
    </div>)}
  </section>;
};
