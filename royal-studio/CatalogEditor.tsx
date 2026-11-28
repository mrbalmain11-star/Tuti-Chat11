import React,{useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {catalogs,readCatalog,prepareDraft,type Catalog,type Draft} from './catalog';
const labels:Record<Catalog,string>={gift_catalog:'الهدايا',store_catalog:'المتجر',home_banners:'البنرات',gift_categories:'تصنيفات الهدايا',cp_types:'علاقات CP'};
export default function CatalogEditor({client}:{client:SupabaseClient}){
 const [table,setTable]=useState<Catalog>('gift_catalog');
 const [rows,setRows]=useState<Record<string,unknown>[]>([]);
 const [selected,setSelected]=useState<Record<string,unknown>|null>(null);
 const [patch,setPatch]=useState<Record<string,unknown>>({});
 const [draft,setDraft]=useState<Draft|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 const [search,setSearch]=useState('');
 useEffect(()=>{let active=true;setRows([]);setSelected(null);setDraft(null);setError('');setLoading(true);readCatalog(client,table).then(data=>{if(active)setRows(data)}).catch(e=>{if(active)setError(String(e.message??e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[client,table]);
 return <main dir="rtl" style={{background:'#073d30',color:'#f1d28b',minHeight:'100vh',padding:20,fontFamily:'sans-serif'}}>
 <h1>Royal Control Studio</h1><p>إدارة المحتوى — معاينة المسودات فقط</p>
 <nav style={{display:'flex',flexWrap:'wrap',gap:8}}>{(Object.keys(labels) as Catalog[]).map(t=><button key={t} onClick={()=>setTable(t)} disabled={table===t}>{labels[t]}</button>)}</nav>
 <p><input aria-label="بحث" placeholder="بحث بالاسم أو المعرف" value={search} onChange={e=>setSearch(e.target.value)}/></p>
 {loading&&<p>جاري التحميل</p>}{error&&<p role="alert">{error}</p>}
 <section style={{display:'grid',gap:8}}>{rows.filter(r=>String(r.name??r.title??r.label??r.id).includes(search)||String(r.id).includes(search)).map(r=><button key={String(r.id)} onClick={()=>{setSelected(r);setPatch({});setDraft(null);setError('')}}>{String(r.name??r.title??r.label??r.id)} {r.price!=null?' — '+String(r.price):''}</button>)}</section>
 {selected&&<section><h2>تعديل {String(selected.name??selected.title??selected.label??selected.id)}</h2>{catalogs[table].map(k=>{const v=Object.prototype.hasOwnProperty.call(patch,k)?patch[k]:selected[k];return <label key={k} style={{display:'block',margin:'12px 0'}}>{k} {typeof selected[k]==='boolean'?<input type="checkbox" checked={Boolean(v)} onChange={e=>{setPatch(p=>({...p,[k]:e.target.checked}));setDraft(null)}}/>:<input value={String(v??'')} onChange={e=>{const raw=e.target.value;setPatch(p=>({...p,[k]:['price','sort_order','duration_days'].includes(k)?(raw===''?null:Number(raw)):raw}));setDraft(null)}}/>}</label>})}
 <button onClick={()=>{try{setDraft(prepareDraft(table,selected,patch));setError('')}catch(e){setError(String(e))}}}>معاينة التعديل</button></section>}
 {draft&&<section><h2>مسودة غير منشورة</h2><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(draft,null,2)}</pre><p>النشر غير متاح حتى اكتمال التحقق من صلاحيات الخادم.</p></section>}
 </main>
}
