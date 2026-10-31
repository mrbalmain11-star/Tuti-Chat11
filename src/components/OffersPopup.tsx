import React, { useEffect, useState } from 'react';
import { Gift, X } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';
import { useApp } from '../context/AppContext';

type Offer = { id:string; title:string; image_url:string; link_kind:string; link_target:string|null; starts_at:string|null; ends_at:string|null };
const hiddenKey = 'totichat:offers:hidden';
export const OffersPopup: React.FC = () => {
  const [items,setItems] = useState<Offer[]>([]);
  const [open,setOpen] = useState(false);
  const [disabled,setDisabled] = useState(() => localStorage.getItem(hiddenKey)==='yes');
  const app=useApp();
  useEffect(()=>{
    if(!stagingBackend)return;
    let alive=true;
    const refresh=async()=>{
      const {data,error}=await stagingBackend!.from('home_banners').select('id,title,image_url,link_kind,link_target,starts_at,ends_at').eq('status','published').order('sort_order',{ascending:true}).limit(10);
      if(error){console.error('Offers load failed',error);return;}
      const now=Date.now();
      const active=(data??[]).filter(b=>(!b.starts_at||Date.parse(b.starts_at)<=now)&&(!b.ends_at||Date.parse(b.ends_at)>now));
      if(alive){setItems(active);if(active.length&&!disabled&&!sessionStorage.getItem('totichat:offers:seen')){setOpen(true);sessionStorage.setItem('totichat:offers:seen','yes');}}
    };
    void refresh();
    return ()=>{alive=false;};
  },[disabled]);
  const navigate=(offer:Offer)=>{
    setOpen(false);
    if(offer.link_kind!=='screen')return;
    switch(offer.link_target){
      case 'vip':app.setOpenVipModal(true);break;
      case 'wallet':app.setOpenRechargeModal(true);break;
      case 'agency':app.setOpenAgencyModal(true);break;
      case 'me':app.setActiveTab('profile');break;
      case 'home':app.setActiveTab('home');break;
      default:break;
    }
  };
  return <>
    {items.length>0&&<button type="button" onClick={()=>setOpen(true)} className="fixed bottom-24 right-4 z-40 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg border border-amber-200 p-3" aria-label="العروض والإعلانات"><Gift size={23}/></button>}
    {open&&items.length>0&&<div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" dir="rtl" role="dialog" aria-modal="true" aria-label="العروض">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-amber-300">
        <div className="flex justify-between items-center p-4 bg-gradient-to-l from-emerald-900 to-emerald-700 text-white">
          <strong className="flex items-center gap-2"><Gift size={20}/> العروض والإعلانات</strong>
          <button type="button" onClick={()=>setOpen(false)} aria-label="إغلاق العروض" className="p-2 rounded-full bg-white/15"><X size={20}/></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-3 space-y-3">
          {items.map(item=><button key={item.id} type="button" onClick={()=>navigate(item)} className="w-full overflow-hidden rounded-2xl border border-amber-200 text-right bg-[#faf7ef]">
            <img src={item.image_url} alt={item.title} className="w-full aspect-[2/1] object-contain bg-emerald-950"/>
            <div className="p-3 font-bold text-slate-800">{item.title}</div>
          </button>)}
        </div>
        <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-100">
          <label className="text-sm text-slate-600 flex items-center gap-2"><input type="checkbox" checked={disabled} onChange={e=>{setDisabled(e.target.checked);localStorage.setItem(hiddenKey,e.target.checked?'yes':'no');}}/> لا تعرض تلقائياً</label>
          <button onClick={()=>setOpen(false)} className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold">إغلاق</button>
        </div>
      </div>
    </div>}
  </>;
};
