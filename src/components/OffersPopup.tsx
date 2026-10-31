import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Gift, Coins, Gem, X } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';


type Offer = { id:string; title:string; image_url:string|null; link_kind:string; link_target:string|null; starts_at:string|null; ends_at:string|null; price_iqd?:number; coins?:number; bonus_coins?:number; description?:string };
const hiddenKey = 'totichat:offers:hidden';
export const OffersPopup: React.FC = () => {
  const [items,setItems] = useState<Offer[]>([]);
  const [open,setOpen] = useState(false);
  const [index,setIndex] = useState(0);
  const [disabled,setDisabled] = useState(() => localStorage.getItem(hiddenKey)==='yes');
  const [tab,setTab]=useState<'daily'|'offers'>('daily');
  const [daily,setDaily]=useState<{day:number;claimed:boolean;coins:number}|null>(null);
  const [claiming,setClaiming]=useState(false);
  const [notice,setNotice]=useState('');
  const loadDaily=async()=>{if(!stagingBackend)return;const {data,error}=await stagingBackend.rpc('daily_reward_status');if(!error&&data)setDaily(data as {day:number;claimed:boolean;coins:number});};
  const claim=async()=>{if(!stagingBackend||claiming||daily?.claimed)return;setClaiming(true);setNotice('');const {data,error}=await stagingBackend.rpc('claim_daily_reward');if(error)setNotice(error.message);else{setNotice(`تم استلام ${Number((data as {coins:number}).coins).toLocaleString('ar-IQ')} عملة بنجاح`);await loadDaily();}setClaiming(false);};
  useEffect(()=>{void loadDaily();},[]);
  useEffect(()=>{
    if(!stagingBackend)return;
    let alive=true;
    const refresh=async()=>{
      const offers=await stagingBackend!.from('recharge_offers').select('id,title,description,image_url,price_iqd,coins,bonus_coins,starts_at,ends_at').eq('status','published').order('created_at',{ascending:false}).limit(10);
      if(offers.error){console.error('Recharge offers load failed',offers.error);return;}
      const now=Date.now();
      const merged:Offer[]=(offers.data??[]).map(o=>({...o,link_kind:'offer',link_target:null}));
      const active=merged.filter(b=>(!b.starts_at||Date.parse(b.starts_at)<=now)&&(!b.ends_at||Date.parse(b.ends_at)>now));
      if(alive){setItems(active);if(!disabled&&!sessionStorage.getItem('totichat:offers:seen')){setOpen(true);sessionStorage.setItem('totichat:offers:seen','yes');}}
    };
    void refresh();
    return ()=>{alive=false;};
  },[disabled]);
  const selected=items[Math.min(index,Math.max(0,items.length-1))];
  const amounts=[500,800,5,1000,1500,2000,3000];
  return <>
    {open&&<div className="fixed inset-0 z-[110] bg-black/75 flex items-center justify-center p-3" dir="rtl" role="dialog" aria-modal="true" aria-label="المكافآت والعروض">
      <div className="w-full max-w-sm max-h-[88dvh] overflow-y-auto rounded-[28px] bg-[#e6fff3] border-[3px] border-[#a4e8c9] shadow-[0_0_30px_rgba(246,210,86,.25)]">
        <div className="relative bg-gradient-to-b from-[#006b51] via-[#0cb47f] to-[#61dfb2] px-4 pt-6 pb-5 text-center text-white">
          <button onClick={()=>setOpen(false)} aria-label="إغلاق" className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/25 flex items-center justify-center"><X size={22}/></button>
          <div className="text-3xl mb-1">🌙 ✨</div>
          <h2 className="text-2xl font-black text-[#fff0a8] drop-shadow">المكافأة اليومية</h2>
          <p className="text-xs text-emerald-50">استلم مكافأتك كل يوم واكتشف عروض الشحن الخاصة</p>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={()=>setTab('daily')} className={`rounded-xl py-2.5 font-black text-sm ${tab==='daily'?'bg-[#0a9d72] text-white':'bg-white text-[#137b60]'}`}>🎁 المكافآت اليومية</button>
            <button onClick={()=>setTab('offers')} className={`rounded-xl py-2.5 font-black text-sm ${tab==='offers'?'bg-[#0a9d72] text-white':'bg-white text-[#137b60]'}`}>🪙 عروض الشحن</button>
          </div>
          {tab==='daily'?<>
            <div className="grid grid-cols-3 gap-2">
              {amounts.slice(0,6).map((amount,i)=><div key={i} className={`relative rounded-xl border-2 p-2 text-center min-h-[98px] flex flex-col items-center justify-between ${daily?.day===i+1?'bg-gradient-to-b from-[#fff5a3] to-[#f5bd42] border-[#d6a230]':'bg-gradient-to-b from-white to-[#9ee8d0] border-[#71cbb0]'}`}>
                <strong className="text-[#0b735a] text-sm">اليوم {i+1}</strong>
                {i===2?<Gem className="text-sky-500" size={26}/>:<Coins className="text-[#e8a51d]" size={26}/>}
                <span className="text-[#075b45] font-black text-sm">{amount} {i===2?'💎':'🪙'}</span>
              </div>)}
            </div>
            <div className={`mt-2 rounded-xl border-2 border-[#71cbb0] bg-gradient-to-b from-[#e8fff5] to-[#73d8b4] p-3 text-center ${daily?.day===7?'ring-2 ring-amber-400':''}`}>
              <strong className="text-[#096d53]">اليوم السابع · صندوق الكنز</strong>
              <div className="text-5xl my-1">🎁</div>
              <span className="text-[#075b45] font-black">3,000 🪙</span>
            </div>
            {daily?.day===3&&<p className="text-xs text-amber-800 text-center mt-2">مكافأة اليوم الثالث: 5 ألماسات</p>}
            <button disabled={!daily||daily.claimed||claiming} onClick={()=>void claim()} className="w-full mt-3 rounded-2xl bg-gradient-to-b from-[#ffe57a] to-[#f6b500] text-[#6b4200] font-black text-lg py-3 border-2 border-[#f0b22a] disabled:opacity-60">{daily?.claimed?'تم الاستلام اليوم':claiming?'جاري الاستلام...':'استلام المكافأة'}</button>
          </>:<>
            {items.length===0?<p className="text-center text-emerald-900 py-8">لا توجد عروض شحن خاصة حالياً</p>:selected&&<div className="rounded-xl bg-white border border-emerald-200 overflow-hidden">
              {selected.image_url?<img src={selected.image_url} alt={selected.title} className="w-full aspect-[2/1] object-contain"/>:<div className="h-32 bg-gradient-to-br from-emerald-800 to-amber-500 flex items-center justify-center text-white"><Gift size={54}/></div>}
              <div className="p-3 text-center"><strong className="text-[#075b45]">{selected.title}</strong><p className="text-sm font-bold text-amber-700 mt-1">{Number(selected.price_iqd).toLocaleString('ar-IQ')} د.ع مقابل {(Number(selected.coins??0)+Number(selected.bonus_coins??0)).toLocaleString('ar-IQ')} عملة</p>{selected.description&&<p className="text-xs mt-1 text-slate-600">{selected.description}</p>}</div>
              {items.length>1&&<div className="flex justify-between items-center px-3 pb-2"><button onClick={()=>setIndex(i=>(i-1+items.length)%items.length)} aria-label="السابق"><ChevronRight/></button><span>{index+1} / {items.length}</span><button onClick={()=>setIndex(i=>(i+1)%items.length)} aria-label="التالي"><ChevronLeft/></button></div>}
            </div>}
          </>}
          {notice&&<p role="status" className="text-sm text-center text-emerald-900 mt-2">{notice}</p>}
          <div className="flex items-center justify-between mt-3 gap-2">
            <label className="text-xs text-emerald-900 flex gap-1 items-center"><input type="checkbox" checked={disabled} onChange={e=>{setDisabled(e.target.checked);localStorage.setItem(hiddenKey,e.target.checked?'yes':'no');}}/> لا تعرض تلقائياً</label>
            <button onClick={()=>setOpen(false)} className="rounded-xl px-5 py-2 bg-[#087653] text-white font-bold">إغلاق</button>
          </div>
        </div>
      </div>
    </div>}
  </>;
};
