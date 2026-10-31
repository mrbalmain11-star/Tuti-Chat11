import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';
import { useApp } from '../context/AppContext';

type Offer = { id:string; title:string; image_url:string|null; link_kind:string; link_target:string|null; starts_at:string|null; ends_at:string|null; price_iqd?:number; coins?:number; bonus_coins?:number; description?:string };
const hiddenKey = 'totichat:offers:hidden';
export const OffersPopup: React.FC = () => {
  const [items,setItems] = useState<Offer[]>([]);
  const [open,setOpen] = useState(false);
  const [index,setIndex] = useState(0);
  const [disabled,setDisabled] = useState(() => localStorage.getItem(hiddenKey)==='yes');
  const app=useApp();
  useEffect(()=>{
    if(!stagingBackend)return;
    let alive=true;
    const refresh=async()=>{
      const [banners,offers]=await Promise.all([stagingBackend!.from('home_banners').select('id,title,image_url,link_kind,link_target,starts_at,ends_at').eq('status','published').order('sort_order',{ascending:true}).limit(10),stagingBackend!.from('recharge_offers').select('id,title,description,image_url,price_iqd,coins,bonus_coins,starts_at,ends_at').eq('status','published').order('created_at',{ascending:false}).limit(10)]);
      const {data,error}=banners;
      if(offers.error) console.error('Recharge offers load failed',offers.error);
      if(error){console.error('Offers load failed',error);return;}
      const now=Date.now();
      const merged:Offer[]=[...(offers.data??[]).map(o=>({...o,link_kind:'offer',link_target:null})),...(data??[])];
      const active=merged.filter(b=>(!b.starts_at||Date.parse(b.starts_at)<=now)&&(!b.ends_at||Date.parse(b.ends_at)>now));
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
  const selected=items[Math.min(index,Math.max(0,items.length-1))];
  return <>
    {open&&selected&&<div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-4" dir="rtl" role="dialog" aria-modal="true" aria-label="العروض والإعلانات">
      <div className="bg-[#fffdf7] w-full max-w-sm rounded-[26px] overflow-hidden shadow-2xl border border-[#e6c778]">
        <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-l from-[#075d46] to-[#064534] text-white">
          <strong className="text-base">العروض والإعلانات</strong>
          <button type="button" onClick={()=>setOpen(false)} aria-label="إغلاق العروض" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15"><X size={21}/></button>
        </div>
        <div className="p-3">
          <div className="rounded-2xl overflow-hidden border border-[#e6d9b0] bg-[#f7f2e5]">
            {selected.image_url?<img src={selected.image_url} alt={selected.title} className="w-full aspect-[2/1] object-contain"/>:<div className="aspect-[2/1] flex items-center justify-center bg-gradient-to-br from-[#075d46] to-[#bd913a] text-white text-center font-black p-4">{selected.title}</div>}
          </div>
          <div className="pt-3 px-1 text-center">
            <h3 className="text-base font-black text-[#172c26]">{selected.title}</h3>
            {selected.link_kind==='offer'&&<p className="text-sm font-bold text-emerald-800 mt-1">{Number(selected.price_iqd).toLocaleString('ar-IQ')} د.ع مقابل {(Number(selected.coins??0)+Number(selected.bonus_coins??0)).toLocaleString('ar-IQ')} عملة</p>}
            {selected.description&&<p className="text-xs text-slate-600 mt-1 line-clamp-2">{selected.description}</p>}
          </div>
          {items.length>1&&<div className="flex items-center justify-between mt-3">
            <button onClick={()=>setIndex(i=>(i-1+items.length)%items.length)} aria-label="العرض السابق" className="p-2 rounded-full bg-emerald-50 text-emerald-900"><ChevronRight size={20}/></button>
            <span className="text-xs text-slate-500" dir="ltr">{index+1} / {items.length}</span>
            <button onClick={()=>setIndex(i=>(i+1)%items.length)} aria-label="العرض التالي" className="p-2 rounded-full bg-emerald-50 text-emerald-900"><ChevronLeft size={20}/></button>
          </div>}
        </div>
        <div className="flex items-center justify-between gap-3 px-4 pb-4">
          <label className="text-xs text-slate-600 flex items-center gap-2"><input type="checkbox" checked={disabled} onChange={e=>{setDisabled(e.target.checked);localStorage.setItem(hiddenKey,e.target.checked?'yes':'no');}}/> لا تعرض تلقائياً</label>
          <button onClick={()=>selected.link_kind==='screen'?navigate(selected):setOpen(false)} className="px-5 py-2.5 rounded-xl bg-[#087653] text-white font-bold">{selected.link_kind==='screen'?'انتقل الآن':'إغلاق'}</button>
        </div>
      </div>
    </div>}
  </>;
};
