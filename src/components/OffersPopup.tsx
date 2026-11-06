import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Gift, Coins, RefreshCw, X } from 'lucide-react';
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
  const [dailyLoading,setDailyLoading]=useState(false);
  const [notice,setNotice]=useState('');
  const loadDaily=async()=>{
    if(!stagingBackend)return;
    setDailyLoading(true);
    setDaily(null);
    try{
      const {data,error}=await stagingBackend.rpc('daily_reward_status');
      if(error)throw error;
      if(!data || typeof data!=='object')throw new Error('Missing reward status');
      const status=data as {day?:number;claimed?:boolean;coins?:number};
      if(!Number.isInteger(status.day) || (status.day ?? 0)<1 || (status.day ?? 0)>7 || typeof status.claimed!=='boolean' || typeof status.coins!=='number' || !Number.isFinite(status.coins) || (status.coins ?? -1)<0)throw new Error('Invalid reward status');
      const verified={day:status.day!,claimed:status.claimed,coins:status.coins};
      setDaily(verified);
      return verified;
    }catch(error){
      console.error('Daily reward status failed',error);
      setDaily(null);
      setNotice('تعذر تأكيد حالة المكافأة من الخادم. حاول لاحقاً.');
      return null;
    }finally{
      setDailyLoading(false);
    }
  };
  const claim=async()=>{
    if(!stagingBackend||claiming||dailyLoading||!daily||daily.claimed)return;
    setClaiming(true);
    setNotice('');
    try{
      const {data,error}=await stagingBackend.rpc('claim_daily_reward');
      if(error)throw error;
      // The claim RPC committed successfully; refresh balances even if status recheck fails.
      window.dispatchEvent(new Event('totichat:wallet-changed'));
      const rawCoins=(data as {coins?:number}|null)?.coins;
      const confirmedCoins=typeof rawCoins==='number' && Number.isFinite(rawCoins) && rawCoins>0 ? rawCoins : null;
      const refreshed=await loadDaily();
      if(refreshed?.claimed){
        setNotice(confirmedCoins!==null
          ? 'تم تأكيد استلام المكافأة اليومية بقيمة '+confirmedCoins.toLocaleString('ar-IQ')+' عملة.'
          : 'تم تأكيد استلام المكافأة اليومية من الخادم.');
      }else if(refreshed){
        setNotice('تم إرسال طلب الاستلام، لكن الخادم لم يؤكد المكافأة بعد. تحقق من الحالة قبل المحاولة مجدداً.');
      }

    }catch(error){
      console.error('Daily reward claim failed',error);
      await loadDaily();
      setNotice('تعذر تأكيد استلام المكافأة. تحقق من الحالة قبل المحاولة مجدداً.');
    }finally{
      setClaiming(false);
    }
  };
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
              {Array.from({length:6},(_,i)=>i).map(i=><div key={i} className={`relative rounded-xl border-2 p-2 text-center min-h-[98px] flex flex-col items-center justify-between ${daily?.day===i+1?'bg-gradient-to-b from-[#fff5a3] to-[#f5bd42] border-[#d6a230]':'bg-gradient-to-b from-white to-[#9ee8d0] border-[#71cbb0]'}`}>
                <strong className="text-[#0b735a] text-sm">اليوم {i+1}</strong>
                <Coins className="text-[#e8a51d]" size={26}/>
                <span className="text-[#075b45] font-black text-sm">{daily?.day===i+1 ? Number(daily.coins).toLocaleString('ar-IQ') + ' 🪙' : 'حسب الخادم'}</span>
              </div>)}
            </div>
            <div className={`mt-2 rounded-xl border-2 border-[#71cbb0] bg-gradient-to-b from-[#e8fff5] to-[#73d8b4] p-3 text-center ${daily?.day===7?'ring-2 ring-amber-400':''}`}>
              <strong className="text-[#096d53]">اليوم السابع · صندوق الكنز</strong>
              <div className="text-5xl my-1">🎁</div>
              <span className="text-[#075b45] font-black">{daily?.day===7 ? Number(daily.coins).toLocaleString('ar-IQ') + ' 🪙' : 'حسب الخادم'}</span>
            </div>
            <button disabled={claiming||dailyLoading} onClick={()=>{setNotice('');void loadDaily();}} className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white/80 px-3 py-2 text-sm font-bold text-emerald-900 disabled:opacity-50"><RefreshCw size={16} className={dailyLoading?'animate-spin':''}/> تحديث حالة المكافأة</button>
            <button disabled={!daily||daily.claimed||claiming||dailyLoading} onClick={()=>void claim()} className="w-full mt-3 rounded-2xl bg-gradient-to-b from-[#ffe57a] to-[#f6b500] text-[#6b4200] font-black text-lg py-3 border-2 border-[#f0b22a] disabled:opacity-60">{claiming?'جاري الاستلام...':dailyLoading?'جارٍ التحقق...':daily?.claimed?'تم الاستلام اليوم':'استلام المكافأة'}</button>
          </>:<>
            {items.length===0?<p className="text-center text-emerald-900 py-8">لا توجد عروض شحن خاصة حالياً</p>:selected&&<div className="rounded-xl bg-white border border-emerald-200 overflow-hidden">
              {selected.image_url?<img src={selected.image_url} alt={selected.title} className="w-full aspect-[2/1] object-contain"/>:<div className="h-32 bg-gradient-to-br from-emerald-800 to-amber-500 flex items-center justify-center text-white"><Gift size={54}/></div>}
              <div className="p-3 text-center"><strong className="text-[#075b45]">{selected.title}</strong><p className="text-sm font-bold text-amber-700 mt-1">{selected.price_iqd != null && Number.isFinite(Number(selected.price_iqd)) ? Number(selected.price_iqd).toLocaleString('ar-IQ') : 'غير محدد'} د.ع مقابل {(Number(selected.coins ?? 0)+Number(selected.bonus_coins ?? 0)).toLocaleString('ar-IQ')} عملة</p>{selected.description&&<p className="text-xs mt-1 text-slate-600">{selected.description}</p>}</div>
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
