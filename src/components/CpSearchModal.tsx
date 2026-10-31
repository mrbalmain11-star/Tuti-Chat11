import React,{useEffect,useState} from 'react';
import { Heart,Search,X } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';
type Candidate={id:string;public_id:number;display_name:string;avatar_url:string|null};
const kinds=[['love','رفيق الروح']];
export const CpSearchModal:React.FC<{onClose:()=>void}>=({onClose})=>{
 const [query,setQuery]=useState('');const [results,setResults]=useState<Candidate[]>([]);
 const [chosen,setChosen]=useState<Candidate|null>(null);const [kind,setKind]=useState('love');
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 useEffect(()=>{let alive=true;if(query.trim().length<2){setResults([]);return;}const timer=setTimeout(async()=>{if(!stagingBackend)return;const {data,error}=await stagingBackend.rpc('search_cp_profiles',{p_query:query.trim()});if(alive){if(error)setMessage(error.message);else{setMessage('');setResults((data??[]) as Candidate[]);}}},300);return()=>{alive=false;clearTimeout(timer);};},[query]);
 const request=async()=>{if(!chosen||!stagingBackend||busy)return;setBusy(true);setMessage('');try{const {error}=await stagingBackend.rpc('phase4_cp_action',{p_partner_id:chosen.id,p_type_id:kind,p_action:'request',p_request_id:crypto.randomUUID()});if(error)throw error;setMessage('تم إرسال طلب CP');}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 return <div className="fixed inset-0 z-[120] bg-black/75 flex items-center justify-center p-4 font-['Cairo',sans-serif]" dir="rtl" role="dialog" aria-modal="true" aria-label="البحث عن CP">
 <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-3xl bg-[#fffaf3] shadow-2xl border border-amber-300 p-4 space-y-4">
 <div className="flex justify-between items-center"><h2 className="font-black text-lg flex items-center gap-2 text-rose-700"><Heart/> البحث عن CP</h2><button onClick={onClose} aria-label="إغلاق"><X/></button></div>
 <label className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-white p-3"><Search className="text-amber-600" size={20}/><input value={query} onChange={e=>{setQuery(e.target.value);setChosen(null);}} placeholder="اسم المستخدم أو ID" className="flex-1 outline-none min-w-0 text-sm"/></label>
 <div className="space-y-2">{results.map(u=><button key={u.id} onClick={()=>setChosen(u)} className={`w-full text-right rounded-xl border p-2 flex gap-3 items-center ${chosen?.id===u.id?'border-rose-500 bg-rose-50':'border-slate-200 bg-white'}`}>
 {u.avatar_url?<img src={u.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover"/>:<div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center font-bold">{u.display_name?.slice(0,1)}</div>}
 <span><strong className="block">{u.display_name}</strong><small className="text-slate-500" dir="ltr">ID: {u.public_id}</small></span></button>)}</div>
 {query.trim().length>=2&&results.length===0&&!message&&<p className="text-sm text-slate-500 text-center">لا توجد نتائج مطابقة</p>}
 {chosen&&<div className="space-y-2"><label className="block text-sm font-bold">نوع العلاقة<select value={kind} onChange={e=>setKind(e.target.value)} className="w-full p-3 border rounded-xl bg-white mt-1">{kinds.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><button disabled={busy} onClick={()=>void request()} className="w-full p-3 rounded-xl bg-gradient-to-l from-rose-600 to-amber-500 text-white font-black disabled:opacity-50">إرسال طلب CP</button></div>}
 {message&&<p role="status" className="text-sm text-rose-700">{message}</p>}
 </div></div>;
};