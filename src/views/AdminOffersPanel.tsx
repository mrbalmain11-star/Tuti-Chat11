import React, { useEffect, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';
type Offer={id:string;title:string;description:string;price_iqd:number;coins:number;bonus_coins:number;image_url:string|null;status:string;starts_at:string|null;ends_at:string|null};
const empty={title:'',description:'',price_iqd:'',coins:'',bonus_coins:'0',image_url:'',status:'draft',starts_at:'',ends_at:''};
export const AdminOffersPanel:React.FC=()=>{
 const [items,setItems]=useState<Offer[]>([]);
 const [form,setForm]=useState({...empty});
 const [editId,setEditId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const load=async()=>{if(!stagingBackend)return;const {data,error}=await stagingBackend.from('recharge_offers').select('*').order('created_at',{ascending:false});if(error)throw error;setItems((data??[]) as Offer[]);};
 useEffect(()=>{void load().catch(e=>setMessage(String(e)));},[]);
 const edit=(o:Offer)=>{setEditId(o.id);setForm({title:o.title,description:o.description,price_iqd:String(o.price_iqd),coins:String(o.coins),bonus_coins:String(o.bonus_coins),image_url:o.image_url??'',status:o.status,starts_at:o.starts_at?.slice(0,16)??'',ends_at:o.ends_at?.slice(0,16)??''});};
 const save=async()=>{if(!stagingBackend||busy)return;setBusy(true);setMessage('');try{
 const {error}=await stagingBackend.rpc('manage_recharge_offer',{p_id:editId,p_title:form.title,p_description:form.description,p_price_iqd:Number(form.price_iqd),p_coins:Number(form.coins),p_bonus_coins:Number(form.bonus_coins),p_image_url:form.image_url,p_status:form.status,p_starts_at:form.starts_at?new Date(form.starts_at).toISOString():null,p_ends_at:form.ends_at?new Date(form.ends_at).toISOString():null});
 if(error)throw error;await load();setEditId(null);setForm({...empty});setMessage('تم حفظ العرض');}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const field=(key:keyof typeof empty,label:string,type='text')=><label className="block text-sm font-bold text-slate-700">{label}<input type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} className="block mt-1 w-full p-3 border border-slate-200 rounded-xl bg-white" dir={type==='number'?'ltr':undefined}/></label>;
 return <section className="space-y-4" dir="rtl">
 <div className="rounded-2xl bg-gradient-to-l from-emerald-900 to-emerald-700 text-white p-4"><h3 className="text-lg font-black">إدارة عروض الشحن</h3><p className="text-sm mt-1">إنشاء عروض حقيقية تظهر في نافذة العروض. نشر العرض لا يفعّل الدفع أو يمنح العملات تلقائياً.</p></div>
 <div className="rounded-2xl bg-white border border-emerald-200 p-4 space-y-3">
 {field('title','عنوان العرض')}
 {field('description','تفاصيل العرض')}
 {field('price_iqd','مبلغ الشحن بالدينار العراقي','number')}
 {field('coins','العملات الأساسية','number')}
 {field('bonus_coins','العملات الإضافية','number')}
 {field('image_url','رابط صورة العرض (اختياري)')}
 {field('starts_at','بداية العرض (اختياري)','datetime-local')}
 {field('ends_at','نهاية العرض (اختياري)','datetime-local')}
 <label className="block font-bold text-sm">الحالة<select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="block mt-1 w-full p-3 rounded-xl border"><option value="draft">مسودة</option><option value="published">منشور</option><option value="paused">متوقف</option></select></label>
 <button disabled={busy||!form.title.trim()||Number(form.price_iqd)<=0||Number(form.coins)<=0} onClick={()=>void save()} className="w-full rounded-xl bg-emerald-700 text-white p-3 font-bold disabled:opacity-40">{editId?'تحديث العرض':'إنشاء العرض'}</button>
 {editId&&<button onClick={()=>{setEditId(null);setForm({...empty});}} className="w-full p-2 text-slate-600">إلغاء التعديل</button>}
 </div>
 {message&&<p role="status" className="text-sm text-slate-700">{message}</p>}
 <h4 className="font-black">العروض المسجلة ({items.length})</h4>
 {items.map(o=><div key={o.id} className="rounded-xl bg-white border border-slate-200 p-3 flex justify-between items-center gap-3"><div><strong>{o.title}</strong><div className="text-xs text-slate-600">{Number(o.price_iqd).toLocaleString('ar-IQ')} د.ع — {Number(o.coins+o.bonus_coins).toLocaleString('ar-IQ')} عملة</div><div className="text-xs text-emerald-700">{o.status==='published'?'منشور':o.status==='draft'?'مسودة':'متوقف'}</div></div><button onClick={()=>edit(o)} className="rounded-lg bg-emerald-50 text-emerald-800 px-3 py-2">تعديل</button></div>)}
 </section>;
};