import React,{useEffect,useState} from 'react';
import { stagingBackend } from '../services/stagingBackend';
type UserReport={id:string;reporterId:number;targetId:number;targetName:string;category:string;details:string;evidencePaths:string[];status:string;createdAt:string};
export const AdminUserReportsPanel:React.FC=()=>{
 const [reports,setReports]=useState<UserReport[]>([]);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [evidence,setEvidence]=useState<Record<string,string>>({});
 const load=async()=>{
  if(!stagingBackend)return;
  setBusy(true);setError('');
  try{const {data,error}=await stagingBackend.rpc('totichat_admin_reports');if(error)throw error;setReports(Array.isArray(data)?data:[]);}
  catch(e){setError(e instanceof Error?e.message:'تعذر تحميل البلاغات');}
  finally{setBusy(false);}
 };
 useEffect(()=>{void load();},[]);
 const changeStatus=async(id:string,status:string)=>{
  if(!stagingBackend)return;
  setBusy(true);setError('');
  try{const {data,error}=await stagingBackend.rpc('totichat_admin_report_status',{p_id:id,p_status:status});if(error||!data)throw error||new Error('لم يتغير البلاغ');await load();}
  catch(e){setError(e instanceof Error?e.message:'تعذر تحديث البلاغ');}
  finally{setBusy(false);}
 };
 const showEvidence=async(path:string)=>{
  if(!stagingBackend)return;
  const {data,error}=await stagingBackend.storage.from('totichat-report-evidence').createSignedUrl(path,120);
  if(error){setError(error.message);return;}
  if(data?.signedUrl)setEvidence(prev=>({...prev,[path]:data.signedUrl}));
 };
 return <section className="space-y-3" dir="rtl">
  <div className="flex items-center justify-between"><h2 className="font-black text-lg">بلاغات المستخدمين</h2><button onClick={()=>void load()} disabled={busy} className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white">تحديث</button></div>
  {error&&<p role="alert" className="text-rose-600 text-xs">{error}</p>}
  {!busy&&reports.length===0&&<p className="rounded-xl bg-white p-4 text-slate-500">لا توجد بلاغات مسجلة</p>}
  {reports.map(report=><article key={report.id} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
   <p className="text-sm font-black">{report.targetName} · ID {report.targetId}</p>
   <p className="text-xs text-slate-500">المُبلّغ ID {report.reporterId} · {new Date(report.createdAt).toLocaleString('ar-IQ')}</p>
   <p className="mt-2 text-sm font-bold">{report.category} · {report.status}</p>
   <p className="mt-2 whitespace-pre-wrap text-sm">{report.details}</p>
   {report.evidencePaths.length>0&&<div className="mt-3 grid grid-cols-3 gap-2">{report.evidencePaths.map(path=><div key={path}>{evidence[path]?<a href={evidence[path]} target="_blank" rel="noreferrer"><img src={evidence[path]} alt="دليل البلاغ" className="h-24 w-full rounded-lg object-cover"/></a>:<button type="button" onClick={()=>void showEvidence(path)} className="rounded-lg border p-2 text-xs">عرض الدليل</button>}</div>)}</div>}
   <div className="mt-3 flex flex-wrap gap-2">{([['reviewing','قيد المراجعة'],['resolved','تمت المعالجة'],['dismissed','رفض البلاغ']] as const).map(([v,label])=><button key={v} type="button" disabled={busy||report.status===v} onClick={()=>void changeStatus(report.id,v)} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold disabled:opacity-40">{label}</button>)}</div>
  </article>)}
 </section>;
};
