import type { SupabaseClient } from '@supabase/supabase-js';
export const catalogs = {
 gift_catalog: ['name','price','is_active','icon','description','preview_url','global_announcement_enabled'],
 store_catalog: ['name','price','is_active','icon','description','preview_url','duration_days'],
 home_banners: ['title','image_url','sort_order','starts_at','ends_at'],
 gift_categories: ['label','sort_order','enabled'],
 cp_types: ['label','enabled']
} as const;
export type Catalog = keyof typeof catalogs;
export type Draft = {table: Catalog; id: string; before: Record<string,unknown>; patch: Record<string,unknown>};
export async function readCatalog(client: SupabaseClient, table: Catalog) {
 const {data,error}=await client.from(table).select('*').order('id').limit(500);
 if(error) throw error;
 return data ?? [];
}
export function prepareDraft(table: Catalog, row: Record<string,unknown>, patch: Record<string,unknown>): Draft {
 if(typeof row.id !== 'string' || !row.id) throw new Error('Invalid item ID');
 const allowed: readonly string[]=catalogs[table];
 for(const [key,value] of Object.entries(patch)){
  if(!allowed.includes(key)) throw new Error('Unsupported field: '+key);
  if(['price','sort_order','duration_days'].includes(key) && !(key==='duration_days' && value===null) && (typeof value!=='number'||!Number.isSafeInteger(value)||value<0)) throw new Error('Invalid number');
  if(['is_active','enabled','global_announcement_enabled'].includes(key)&&typeof value!=='boolean') throw new Error('Invalid boolean');
  if(['name','title','label'].includes(key)&&(typeof value!=='string'||!value.trim())) throw new Error('Required name');
  if(['preview_url','image_url'].includes(key)&&value!==null&&(typeof value!=='string'||!/^https:\/\//i.test(value))) throw new Error('HTTPS asset required');
 }
 return {table,id:row.id,before:Object.fromEntries(Object.keys(patch).map(k=>[k,row[k]])),patch:{...patch}};
}
// Drafts are not publications. A server-authorized, transactional publishing endpoint is required.
