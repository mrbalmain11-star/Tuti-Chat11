import React, { useEffect, useState } from 'react';
import { createAdminBanner, listAdminBanners, changeAdminBannerStatus, type AdminBanner } from '../services/adminBanners';

export const AdminBannersPanel: React.FC = () => {
  const [items, setItems] = useState<AdminBanner[]>([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = async () => { setItems(await listAdminBanners()); };
  useEffect(() => { void refresh().catch(e => setError(String(e))); }, []);
  const create = async () => {
    if (!file) { setError('اختر صورة البنر أولاً'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      await createAdminBanner(file, title);
      setTitle(''); setFile(null); setNotice('تم رفع البنر كمسودة. يمكنك نشره الآن.');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const update = async (item: AdminBanner, status: 'published' | 'archived') => {
    setBusy(true); setError(''); setNotice('');
    try { await changeAdminBannerStatus(item, status); await refresh(); setNotice('تم تحديث حالة البنر'); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-amber-200 bg-white p-4 mb-5">
    <h2 className="font-black text-lg mb-3">إدارة بنرات الصفحة الرئيسية</h2>
    <label className="block text-sm mb-2">عنوان البنر</label>
    <input className="w-full border rounded-xl p-3 mb-3" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان البنر" />
    <label className="block text-sm mb-2">صورة البنر</label>
    <input className="w-full border rounded-xl p-3 mb-3" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
    <p className="text-xs text-slate-500 mb-3">تُحوّل الصورة إلى WebP، وتُرفع كمسودة. النشر يتطلب ضغطة منفصلة.</p>
    <button type="button" disabled={busy || !file || !title.trim()} onClick={() => void create()} className="bg-amber-700 text-white rounded-xl px-4 py-3 disabled:opacity-40">رفع البنر</button>
    {error && <p role="alert" className="text-red-700 mt-3">{error}</p>}
    {notice && <p role="status" className="text-green-700 mt-3">{notice}</p>}
    <h3 className="font-bold mt-6 mb-3">البنرات المحفوظة</h3>
    {items.length === 0 && <p className="text-slate-500 text-sm">لا توجد بنرات محفوظة.</p>}
    <div className="space-y-3">{items.map(item => <div key={item.id} className="border rounded-xl p-3">
      <img src={item.image_url} alt={item.title} className="w-full h-28 object-cover rounded-lg mb-2" />
      <div className="flex justify-between gap-2 items-center"><strong>{item.title}</strong><span className="text-xs">{item.status === 'published' ? 'منشور' : item.status === 'draft' ? 'مسودة' : 'مؤرشف'}</span></div>
      <button type="button" disabled={busy} onClick={() => void update(item, item.status === 'published' ? 'archived' : 'published')} className="mt-3 border border-amber-500 rounded-lg px-3 py-2 text-sm disabled:opacity-40">{item.status === 'published' ? 'إيقاف النشر' : 'نشر البنر'}</button>
    </div>)}</div>
  </section>;
};
