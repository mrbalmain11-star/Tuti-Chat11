import { FormEvent, useEffect, useRef, useState } from 'react';
import { getStorageAsset, getStorageCategory, storageCategories, type StorageCategory } from '../data/storageItems';
import { StorageItemVisual } from '../components/StorageItemVisual';
import { stagingBackend } from '../services/stagingBackend';

const extensions: Record<string, string> = {
  'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'image/jpeg': 'jpg', 'video/mp4': 'mp4', 'video/webm': 'webm',
};
type CatalogRow = { id: string; name: string; category: string; preview_url: string | null; is_active: boolean };
type CpType = { id: string; label: string };

export function AdminDecorationsPanel() {
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [cpTypes, setCpTypes] = useState<CpType[]>([]);
  const [category, setCategory] = useState<StorageCategory>('frames');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const upload = useRef<{ file: File; path: string } | null>(null);
  const imageOnly = category === 'bubbles' || category === 'room_backgrounds' || category === 'cards';

  const refresh = async () => {
    if (!stagingBackend) return;
    const { data, error } = await stagingBackend.rpc('manage_decoration_catalog', { p_action: 'list' });
    if (error) { setStatus('تعذر تحميل الزينة'); return; }
    setCatalog(data ?? []);
  };

  useEffect(() => {
    void refresh();
    if (!stagingBackend) return;
    void Promise.resolve(stagingBackend.rpc('manage_decoration_catalog', { p_action: 'types' }))
      .then(({ data }) => setCpTypes(data ?? []));
  }, []);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stagingBackend || busy || !file) return;
    const extension = extensions[file.type];
    if (!extension || file.size > 20 * 1024 * 1024 || (imageOnly && !file.type.startsWith('image/'))) {
      setStatus('اختار ملف مدعوم بحجم ٢٠ ميغابايت أو أقل');
      return;
    }
    const form = event.currentTarget;
    const fields = new FormData(form);
    const publish = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'publish';
    const duration = String(fields.get('duration') ?? '').trim();
    setBusy(true);
    setStatus('');
    try {
      let path = upload.current?.file === file ? upload.current.path : null;
      if (!path) {
        path = crypto.randomUUID() + '.' + extension;
        const { error } = await stagingBackend.storage.from('totichat-decorations').upload(path, file);
        if (error) throw error;
        upload.current = { file, path };
      }
      const { error } = await stagingBackend.rpc('manage_decoration_catalog', {
        p_action: 'create', p_category: category === 'mounts' ? 'cars' : category,
        p_name: fields.get('name'), p_price: Number(fields.get('price')),
        p_duration_days: duration ? Number(duration) : null, p_path: path,
        p_cp_type: category === 'cards' ? fields.get('cpType') : null, p_publish: publish,
      });
      if (error) throw error;
      setFile(null);
      upload.current = null;
      form.reset();
      setStatus(publish ? 'تم نشر العنصر بالمتجر' : 'تم حفظ المسودة');
      await refresh();
    } catch (error) {
      console.error('Decoration save failed', error);
      setStatus('تعذر حفظ العنصر. تحقق من الحقول وحاول مرة ثانية');
    } finally { setBusy(false); }
  };

  const toggle = async (item: CatalogRow) => {
    if (!stagingBackend || busy) return;
    setBusy(true);
    try {
      const { error } = await stagingBackend.rpc('manage_decoration_catalog', {
        p_action: 'visibility', p_id: item.id, p_publish: !item.is_active,
      });
      if (error) { setStatus('تعذر تغيير حالة العنصر'); return; }
      setStatus(item.is_active ? 'تم إيقاف البيع' : 'تم نشر العنصر بالمتجر');
      await refresh();
    } finally { setBusy(false); }
  };

  const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm';
  const button = 'rounded-xl bg-emerald-800 px-3 py-2 text-sm font-bold text-white disabled:opacity-50';
  return <section dir="rtl" className="space-y-4">
    <form onSubmit={create} className="space-y-3 rounded-xl border bg-white p-4">
      <fieldset disabled={busy} className="space-y-3">
        <legend className="font-black">إضافة عنصر</legend>
        <label className="block text-sm font-bold">القسم
          <select value={category} className={field} onChange={event => setCategory(event.target.value as StorageCategory)}>
            {storageCategories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-bold">اسم العنصر<input className={field} name="name" maxLength={80} required /></label>
        <label className="block text-sm font-bold">السعر بالعملات<input className={field} name="price" type="number" min="1" required /></label>
        <label className="block text-sm font-bold">المدة بالأيام<input className={field} name="duration" type="number" min="1" max="365" placeholder="اتركها فارغة للمدة الدائمة" /></label>
        {category === 'cards' && <label className="block text-sm font-bold">نوع علاقة CP
          <select name="cpType" className={field} required><option value="">اختر النوع</option>
            {cpTypes.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
          </select>
        </label>}
        <label className="block text-sm font-bold">ملف التصميم
          <input type="file" required className={field}
            accept={Object.keys(extensions).filter(type => !imageOnly || type.startsWith('image/')).join(',')}
            onChange={event => setFile(event.target.files?.[0] ?? null)} />
        </label>
        {preview && <div className="mx-auto h-40 w-full">
          {file?.type.startsWith('video/')
            ? <video src={preview} className="h-full w-full object-contain" controls muted playsInline />
            : <img src={preview} alt="معاينة التصميم" className="h-full w-full object-contain" />}
        </div>}
        <div className="flex flex-wrap gap-2">
          <button className={button} type="submit" value="draft">حفظ كمسودة</button>
          <button className={button} type="submit" value="publish">نشر بالمتجر</button>
        </div>
      </fieldset>
    </form>
    {status && <p role="status" className="text-sm font-bold">{status}</p>}
    {catalog.map(item => {
      const url = getStorageAsset(item.id, item.preview_url);
      const label = storageCategories.find(value => value.id === getStorageCategory(item.category))?.label;
      return <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-white p-3">
        {url && <div className="h-12 w-12 shrink-0"><StorageItemVisual key={url} url={url} name={item.name} /></div>}
        <div className="min-w-0 flex-1"><p className="font-bold">{item.name}</p><p className="text-xs">{label} · {item.is_active ? 'منشور' : 'غير منشور'}</p></div>
        <button type="button" className={button} disabled={busy} onClick={() => void toggle(item)}>{item.is_active ? 'إيقاف البيع' : 'نشر'}</button>
      </div>;
    })}
  </section>;
}
