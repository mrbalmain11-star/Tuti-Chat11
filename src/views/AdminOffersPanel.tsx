import React, { useEffect, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';
type Offer={id:string;title:string;description:string;price_iqd:number;coins:number;bonus_coins:number;image_url:string|null;status:string;starts_at:string|null;ends_at:string|null};
const empty={title:'',description:'',price_iqd:'',coins:'',bonus_coins:'0',image_url:'',status:'draft',starts_at:'',ends_at:''};
const offerDisplayStatus=(o:Offer)=>{if(o.status==='draft')return 'مسودة';if(o.status==='paused')return 'متوقف';if(o.status!=='published')return 'حالة غير معروفة';const now=Date.now();const start=o.starts_at?Date.parse(o.starts_at):null;const end=o.ends_at?Date.parse(o.ends_at):null;if((start!==null&&!Number.isFinite(start))||(end!==null&&!Number.isFinite(end)))return 'موعد غير صالح';if(start!==null&&start>now)return 'منشور · لم يبدأ بعد';if(end!==null&&end<=now)return 'منشور · منتهي';return 'منشور · فعّال';};
const toLocalDateTime=(value:string|null)=>{if(!value)return '';const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,16);};
export const AdminOffersPanel:React.FC=()=>{
 const [items,setItems]=useState<Offer[]>([]);
 const [form,setForm]=useState({...empty});
 const [editId,setEditId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState(false);
 const [message,setMessage]=useState('');
 const load=async()=>{if(!stagingBackend)throw new Error('خدمة العروض غير متاحة حالياً');const {data,error}=await stagingBackend.from('recharge_offers').select('*').order('created_at',{ascending:false});if(error)throw error;setItems((data??[]) as Offer[]);setLoadError(false);};
 useEffect(()=>{let active=true;setLoading(true);void load().catch(e=>{if(active){setLoadError(true);setMessage(e instanceof Error?e.message:String(e));}}).finally(()=>{if(active)setLoading(false);});return ()=>{active=false;};},[]);
 const edit=(o:Offer)=>{setEditId(o.id);setForm({title:o.title,description:o.description,price_iqd:String(o.price_iqd),coins:String(o.coins),bonus_coins:String(o.bonus_coins??0),image_url:o.image_url??'',status:o.status,starts_at:toLocalDateTime(o.starts_at),ends_at:toLocalDateTime(o.ends_at)});};
 const save=async()=>{if(!stagingBackend||busy)return;
 if(!['draft','published','paused'].includes(form.status)){setMessage('حالة العرض غير صالحة.');return;}
 if(form.title.trim().length<3 || form.title.trim().length>100){setMessage('عنوان العرض يجب أن يحتوي من 3 إلى 100 حرف.');return;}
 const price=Number(form.price_iqd),coins=Number(form.coins),bonus=Number(form.bonus_coins);
 if(!form.title.trim() || !Number.isSafeInteger(price) || price<=0 || !Number.isSafeInteger(coins) || coins<=0 || !Number.isSafeInteger(bonus) || bonus<0 || !Number.isSafeInteger(coins+bonus)) {setMessage('تحقق من العنوان والسعر والعملات: يجب إدخال أعداد صحيحة وموجبة، والمكافأة الإضافية لا تقل عن صفر.');return;}
 if((form.starts_at && !Number.isFinite(Date.parse(form.starts_at))) || (form.ends_at && !Number.isFinite(Date.parse(form.ends_at))) || (form.starts_at && form.ends_at && Date.parse(form.ends_at)<=Date.parse(form.starts_at))) {setMessage('تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية.');return;}
 setBusy(true);setMessage('');try{
 const {error}=await stagingBackend.rpc('manage_recharge_offer',{p_id:editId,p_title:form.title.trim(),p_description:form.description,p_price_iqd:price,p_coins:coins,p_bonus_coins:bonus,p_image_url:form.image_url.trim(),p_status:form.status,p_starts_at:form.starts_at?new Date(form.starts_at).toISOString():null,p_ends_at:form.ends_at?new Date(form.ends_at).toISOString():null});
 if(error)throw error;
 setEditId(null);setForm({...empty});
 try{await load();setMessage('تم حفظ العرض');}
 catch(refreshError){console.error('Offer saved but list refresh failed',refreshError);setLoadError(true);setMessage('تم حفظ العرض في الخادم، لكن تعذر تحديث القائمة. اضغط «تحديث القائمة» للتحقق من البيانات.');}
 }catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const pause=async(o:Offer)=>{
 if(!stagingBackend||busy||o.status==='paused')return;
 if(!window.confirm('إيقاف العرض «'+o.title+'»؟ سيختفي من قائمة عروض المستخدمين.'))return;
 setBusy(true);setMessage('');
 try{
  const {error}=await stagingBackend.rpc('manage_recharge_offer',{p_id:o.id,p_title:o.title,p_description:o.description??'',p_price_iqd:o.price_iqd,p_coins:o.coins,p_bonus_coins:o.bonus_coins??0,p_image_url:o.image_url??'',p_status:'paused',p_starts_at:o.starts_at,p_ends_at:o.ends_at});
  if(error)throw error;
  try{await load();setMessage('تم إيقاف العرض وتحديث القائمة.');}
  catch(refreshError){console.error('Offer paused but list refresh failed',refreshError);setLoadError(true);setMessage('تم إيقاف العرض، لكن تعذر تحديث القائمة. اضغط «تحديث القائمة» للتحقق.');}
 }catch(e){setMessage(e instanceof Error?e.message:String(e));}
 finally{setBusy(false);}
 };
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
 <button disabled={busy||!form.title.trim()||!Number.isSafeInteger(Number(form.price_iqd))||Number(form.price_iqd)<=0||!Number.isSafeInteger(Number(form.coins))||Number(form.coins)<=0||!Number.isSafeInteger(Number(form.bonus_coins))||Number(form.bonus_coins)<0||!Number.isSafeInteger(Number(form.coins)+Number(form.bonus_coins))} onClick={()=>void save()} className="w-full rounded-xl bg-emerald-700 text-white p-3 font-bold disabled:opacity-40">{editId?'تحديث العرض':'إنشاء العرض'}</button>
 {editId&&<button onClick={()=>{setEditId(null);setForm({...empty});}} className="w-full p-2 text-slate-600">إلغاء التعديل</button>}
 </div>
 {message&&<p role="status" className="text-sm text-slate-700">{message}</p>}
 <div className="flex items-center justify-between gap-3"><h4 className="font-black">العروض المسجلة ({items.length})</h4><button type="button" disabled={loading||busy} onClick={()=>{setLoading(true);setMessage('');void load().catch(e=>{setLoadError(true);setMessage(e instanceof Error?e.message:String(e));}).finally(()=>setLoading(false));}} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-800 disabled:opacity-50">تحديث القائمة</button></div>
 {loading&&<p role="status" className="text-sm text-slate-600">جارِ تحميل العروض...</p>}
 {!loading&&!loadError&&items.length===0&&<p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">لا توجد عروض محمّلة حالياً. إذا ظهر خطأ أعلاه، تحقق من الاتصال قبل إنشاء عرض جديد.</p>}
 {items.map(o=><div key={o.id} className="rounded-xl bg-white border border-slate-200 p-3 flex justify-between items-center gap-3"><div><strong>{o.title}</strong><div className="text-xs text-slate-600">{Number(o.price_iqd).toLocaleString('ar-IQ')} د.ع — {(Number(o.coins)+Number(o.bonus_coins??0)).toLocaleString('ar-IQ')} عملة</div><div className="text-xs text-emerald-700">{offerDisplayStatus(o)}</div></div><div className="flex shrink-0 gap-2"><button type="button" disabled={busy} onClick={()=>edit(o)} className="rounded-lg bg-emerald-50 text-emerald-800 px-3 py-2 disabled:opacity-50">تعديل</button>{o.status!=='paused'&&<button type="button" disabled={busy} onClick={()=>void pause(o)} className="rounded-lg bg-rose-50 text-rose-800 px-3 py-2 disabled:opacity-50">إيقاف</button>}</div></div>)}
 </section>;
};