import React, { useState } from 'react';
import { X, ImagePlus, Send, Loader2 } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';

const reasons = [
 ['messages','إساءة في الرسائل الخاصة'],
 ['harassment','مضايقة أو تهديد'],
 ['fraud','احتيال أو نصب'],
 ['impersonation','انتحال شخصية'],
 ['inappropriate','محتوى غير لائق'],
 ['other','مخالفة أخرى'],
];
export const ProfileReportForm: React.FC<{ targetId: string; targetName: string; onClose: () => void }> = ({ targetId, targetName, onClose }) => {
 const [category,setCategory]=useState('messages');
 const [details,setDetails]=useState('');
 const [files,setFiles]=useState<File[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [sent,setSent]=useState(false);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();if(!stagingBackend||busy)return;
  setBusy(true);setError('');
  try{
   const {data:auth}=await stagingBackend.auth.getUser();
   if(!auth.user)throw new Error('سجّل الدخول أولاً');
   const paths:string[]=[];
   for(const file of files){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('كل صورة يجب أن تكون JPG أو PNG أو WebP وبحجم أقل من 5MB');
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=`${auth.user.id}/${crypto.randomUUID()}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await stagingBackend.storage.from('totichat-report-evidence').upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError)throw uploadError;
    paths.push(path);
   }
   const {error:submitError}=await stagingBackend.rpc('totichat_submit_user_report',{p_target:targetId,p_category:category,p_details:details.trim(),p_paths:paths});
   if(submitError)throw submitError;
   setSent(true);
  }catch(e){setError(e instanceof Error?e.message:'تعذر إرسال البلاغ');}
  finally{setBusy(false);}
 };
 return <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/75 p-4 font-['Cairo',sans-serif]" dir="rtl" role="dialog" aria-modal="true">
  <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-3xl bg-white p-5 text-slate-900 shadow-2xl">
   <div className="flex items-center justify-between"><h2 className="font-black text-lg">الإبلاغ عن {targetName}</h2><button type="button" onClick={onClose} aria-label="إغلاق"><X/></button></div>
   {sent?<div className="py-8 text-center"><p className="font-black text-emerald-700">تم إرسال البلاغ للإدارة</p><button className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-white" onClick={onClose}>إغلاق</button></div>:
   <form onSubmit={e=>void submit(e)} className="mt-4 space-y-3">
    <label className="block text-sm font-bold">سبب الإبلاغ<select value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full rounded-xl border p-3 bg-white">{reasons.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <label className="block text-sm font-bold">تفاصيل المخالفة<textarea required minLength={15} maxLength={2000} rows={4} value={details} onChange={e=>setDetails(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="اشرح المخالفة بالتفصيل..." /></label>
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-rose-300 p-3 text-sm font-bold"><ImagePlus className="text-rose-600"/> إضافة صور أدلة (حتى 5)
     <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={e=>{const next=Array.from(e.target.files||[]);setFiles(next.slice(0,5));setError(next.length>5?'الحد الأقصى 5 صور':'');}}/>
    </label>
    {files.length>0&&<div className="space-y-1">{files.map((f,i)=><p className="truncate text-xs text-slate-600" key={i}>{i+1}. {f.name}</p>)}<button type="button" className="text-xs text-rose-600" onClick={()=>setFiles([])}>إزالة الصور</button></div>}
    <p className="text-xs text-slate-500">صور الأدلة خاصة ولا تظهر للمستخدم المبلّغ عنه.</p>
    {error&&<p role="alert" className="text-xs text-rose-600">{error}</p>}
    <button type="submit" disabled={busy||details.trim().length<15} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 p-3 font-black text-white disabled:opacity-50">{busy?<Loader2 className="animate-spin"/>:<Send/>} إرسال البلاغ للإدارة</button>
   </form>}
  </div>
 </div>;
};
