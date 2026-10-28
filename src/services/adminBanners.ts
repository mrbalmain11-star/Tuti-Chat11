import { stagingBackend } from './stagingBackend';

export type AdminBanner = { id: string; title: string; image_url: string; link_kind: string; link_target: string | null; status: string; sort_order: number; starts_at?: string | null; ends_at?: string | null };
function client() { if (!stagingBackend) throw new Error('Supabase Staging غير متصل'); return stagingBackend; }
export async function listAdminBanners(): Promise<AdminBanner[]> {
  const { data, error } = await client().rpc('phase6_admin_banner_list', { p_offset: 0, p_limit: 60 });
  if (error) throw error;
  if (!data || !Array.isArray(data.rows)) throw new Error('تعذر قراءة البنرات');
  return data.rows as AdminBanner[];
}
async function toWebp(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('اختر صورة فقط');
  if (file.size > 12 * 1024 * 1024) throw new Error('حجم الصورة يجب ألا يتجاوز 12MB');
  const image = await createImageBitmap(file);
  try {
    if (image.width !== 1200 || image.height !== 600) throw new Error('قياس البنر غير صحيح. المطلوب 1200 × 600 بكسل بالضبط.');
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر معالجة الصورة');
    context.fillStyle = '#102b27';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.82));
    if (!blob || blob.type !== 'image/webp') throw new Error('الجهاز لا يدعم تحويل الصورة إلى WebP');
    return blob;
  } finally { image.close(); }
}
export async function createAdminBanner(file: File, title: string, options: { link_kind: 'none' | 'screen'; link_target: string | null; starts_at: string | null; ends_at: string | null }): Promise<void> {
  const api = client();
  const { data: { user }, error: authError } = await api.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('يجب تسجيل الدخول');
  const cleanTitle = title.trim();
  if (!cleanTitle || cleanTitle.length > 120) throw new Error('أدخل عنواناً للبنر');
  const existing = await listAdminBanners();
  if (existing.filter(item => item.status === 'published').length >= 10) throw new Error('الحد الأقصى 10 بنرات منشورة. أوقف أحدها أولاً.');
  const image = await toWebp(file);
  const path = `${user.id}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await api.storage.from('totichat-admin-banners').upload(path, image, { contentType: 'image/webp', upsert: false });
  if (uploadError) throw uploadError;
  const { error } = await api.rpc('phase6_admin_banner_action', {
    p_action: 'create', p_id: null, p_request_id: crypto.randomUUID(),
    p_data: { title: cleanTitle, image_path: path, link_kind: options.link_kind, link_target: options.link_target, starts_at: options.starts_at, ends_at: options.ends_at, status: 'draft', sort_order: 0 }
  });
  if (error) {
    await api.storage.from('totichat-admin-banners').remove([path]).catch(() => {});
    throw error;
  }
}
export async function changeAdminBannerStatus(banner: AdminBanner, status: 'published' | 'archived'): Promise<void> {
  if (status === 'published' && banner.status !== 'published') {
    const existing = await listAdminBanners();
    if (existing.filter(item => item.status === 'published').length >= 10) throw new Error('الحد الأقصى 10 بنرات منشورة.');
  }
  const url = new URL(banner.image_url);
  const prefix = '/storage/v1/object/public/totichat-admin-banners/';
  if (url.origin !== 'https://rziaedugbdwefbefcxjt.supabase.co' || !url.pathname.startsWith(prefix)) throw new Error('مسار صورة غير صالح');
  const imagePath = decodeURIComponent(url.pathname.slice(prefix.length));
  const { error } = await client().rpc('phase6_admin_banner_action', {
    p_action: 'update', p_id: banner.id, p_request_id: crypto.randomUUID(),
    p_data: { title: banner.title, image_path: imagePath, link_kind: banner.link_kind, link_target: banner.link_target, status, sort_order: banner.sort_order, starts_at: banner.starts_at ?? null, ends_at: banner.ends_at ?? null }
  });
  if (error) throw error;
}
