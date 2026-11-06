import React,{useEffect,useRef,useState} from 'react';
import { X,Save,RefreshCw } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';
type Section='rules'|'auto_message'|'announcement'|'history';
type State={rules:string;autoMessage:string;announcement:string};
type Audit={action:string;actorId:number|null;createdAt:string};
const validState=(value:unknown):value is State=>{if(!value||typeof value!=='object'||Array.isArray(value))return false;const v=value as Record<string,unknown>;return ['rules','autoMessage','announcement'].every(k=>typeof v[k]==='string'&&v[k].length<=1000);};
const validAudit=(value:unknown):value is Audit[]=>Array.isArray(value)&&value.every(item=>item&&typeof item==='object'&&typeof item.action==='string'&&typeof item.createdAt==='string'&&(item.actorId===null||typeof item.actorId==='number'));
const labels:Record<Section,string>={rules:'قواعد الغرفة',auto_message:'الرسائل التلقائية',announcement:'إعلانات الغرفة',history:'سجل الإدارة'};
const fieldKey:Record<Exclude<Section,'history'>,keyof State>={rules:'rules',auto_message:'autoMessage',announcement:'announcement'};
export const RoomManagementPanel:React.FC<{roomId:string;section:Section;canManage:boolean;onClose:()=>void}>=({roomId,section,canManage,onClose})=>{
 const [state,setState]=useState<State>({rules:'',autoMessage:'',announcement:''});
 const [audit,setAudit]=useState<Audit[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [loaded,setLoaded]=useState(false);
 const requestVersion=useRef(0);
 const savingRef=useRef(false);
 const load=async()=>{
  if(savingRef.current)return;
  const version=++requestVersion.current;
  if(!stagingBackend){setError('الخادم غير متاح حالياً');return;}
  setBusy(true);setError('');setNotice('');setLoaded(false);
  try{
   if(section==='history'){
    const {data,error}=await stagingBackend.rpc('totichat_room_management_history',{p_room_id:roomId});
    if(error)throw error;
    if(!validAudit(data))throw new Error('استجابة سجل الإدارة غير صالحة');
    if(version!==requestVersion.current)return;
    setAudit(data);setLoaded(true);
   }else{
    const {data,error}=await stagingBackend.rpc('totichat_room_management_state',{p_room_id:roomId});
    if(error)throw error;
    if(!validState(data))throw new Error('تعذر قراءة إعدادات الغرفة');
    if(version!==requestVersion.current)return;
    setState({rules:data.rules||'',autoMessage:data.autoMessage||'',announcement:data.announcement||''});setLoaded(true);
   }
  }catch(e){if(version===requestVersion.current)setError(e instanceof Error?e.message:'تعذر تحميل البيانات');}
  finally{if(version===requestVersion.current)setBusy(false);}
 };
 useEffect(()=>{void load();return()=>{requestVersion.current++;};},[roomId,section]);
 const save=async()=>{
  if(section==='history'||!canManage||busy||!loaded||savingRef.current)return;
  if(!stagingBackend){setError('الخادم غير متاح حالياً');return;}
  savingRef.current=true;
  const version=++requestVersion.current;
  setBusy(true);setError('');setNotice('');
  try{
   const {data,error}=await stagingBackend.rpc('totichat_room_management_state',{p_room_id:roomId,p_field:section,p_value:state[fieldKey[section]]});
   if(error)throw error;
   if(!validState(data))throw new Error('لم يؤكد الخادم حفظ إعدادات الغرفة');
   if(version!==requestVersion.current)return;
   setState({rules:data.rules||'',autoMessage:data.autoMessage||'',announcement:data.announcement||''});
   if(data[fieldKey[section]]!==state[fieldKey[section]])throw new Error('الخادم لم يرجع النص المحفوظ؛ يرجى إعادة التحميل');
   setNotice('تم الحفظ على الخادم');
  }catch(e){if(version===requestVersion.current)setError(e instanceof Error?e.message:'تعذر الحفظ');}
  finally{savingRef.current=false;if(version===requestVersion.current)setBusy(false);}
 };
 const actions:Record<string,string>={updated_rules:'تعديل قواعد الغرفة',updated_auto_message:'تعديل الرسائل التلقائية',updated_announcement:'تعديل إعلان الغرفة',ban_user:'حظر مستخدم',unban_user:'رفع الحظر عن مستخدم',add_moderator:'تعيين مشرف',remove_moderator:'إزالة مشرف'};
 return <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/80 p-3" dir="rtl" onClick={onClose}>
  <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-amber-400 bg-[#fffefa] p-5 text-slate-900 shadow-2xl" onClick={e=>e.stopPropagation()}>
   <header className="flex items-center justify-between gap-3"><h3 className="text-lg font-black text-emerald-900">{labels[section]}</h3><div className="flex gap-2"><button type="button" onClick={()=>void load()} disabled={busy} aria-label="تحديث"><RefreshCw size={18}/></button><button type="button" onClick={onClose} aria-label="إغلاق"><X size={20}/></button></div></header>
   {error&&<p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
   {notice&&<p role="status" className="mt-3 text-xs text-emerald-700">{notice}</p>}
   {section==='history'?
    <div className="mt-4 space-y-2">{loaded&&audit.length===0&&<p className="text-sm text-slate-500">لا توجد إجراءات مسجلة حتى الآن.</p>}{loaded&&audit.map((a,i)=><div key={i} className="rounded-xl border border-amber-200 bg-white p-3"><p className="text-sm font-bold">{actions[a.action]||a.action}</p><p className="mt-1 text-xs text-slate-500">ID: {a.actorId??'—'} · {new Date(a.createdAt).toLocaleString('ar-IQ')}</p></div>)}</div>
   :<div className="mt-4 space-y-3">
     <p className="text-xs text-slate-500">{section==='auto_message'?'نص الرسالة المحفوظة. لا يتم إرسالها دورياً حتى تفعيل نظام الإرسال التلقائي.':section==='announcement'?'إعلان خاص بالغرفة محفوظ على الخادم.':'القواعد التي يضعها مالك الغرفة.'}</p>
     <textarea rows={7} maxLength={1000} disabled={!canManage||busy||!loaded} value={state[fieldKey[section]]} onChange={e=>setState(p=>({...p,[fieldKey[section]]:e.target.value}))} className="w-full resize-none rounded-2xl border border-amber-200 bg-white p-3 text-sm disabled:opacity-75" placeholder="اكتب النص هنا..."/>
     <p className="text-left text-xs text-slate-500">{state[fieldKey[section]].length}/1000</p>
     {canManage&&<button type="button" disabled={busy||!loaded} onClick={()=>void save()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 p-3 text-sm font-black text-white disabled:opacity-50"><Save size={17}/> حفظ التعديلات</button>}
   </div>}
  </div>
 </div>;
};
