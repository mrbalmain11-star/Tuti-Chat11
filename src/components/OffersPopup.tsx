import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Gift, Coins, RefreshCw, X } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';


type Offer = { id:string; title:string; image_url:string|null; link_kind:string; link_target:string|null; starts_at:string|null; ends_at:string|null; price_iqd?:number; coins?:number; bonus_coins?:number; description?:string };
const hiddenKey = 'totichat:offers:hidden';
export const OffersPopup: React.FC = () => {
  const [items,setItems] = useState<Offer[]>([]);
  const [offersError,setOffersError] = useState(false);
  const [offersRetry,setOffersRetry] = useState(0);
  const [offersLoading,setOffersLoading] = useState(false);
  const [offersLoaded,setOffersLoaded] = useState(false);
  const [open,setOpen] = useState(false);
  const [index,setIndex] = useState(0);
  const [disabled,setDisabled] = useState(() => localStorage.getItem(hiddenKey)==='yes');
  const [tab,setTab]=useState<'daily'|'offers'>('daily');
  const [daily,setDaily]=useState<{day:number;claimed:boolean;coins:number;schedule:number[]}|null>(null);
  const [claiming,setClaiming]=useState(false);
  const [claimOutcomeUnknown,setClaimOutcomeUnknown]=useState(false);
  const [dailyLoading,setDailyLoading]=useState(false);
  const [dailyLoaded,setDailyLoaded]=useState(false);
  const dailyRequestInFlight=useRef(false);
  const claimRequestInFlight=useRef(false);
  const [notice,setNotice]=useState('');
  const loadDaily=async()=>{
    if(dailyRequestInFlight.current)return null;
    if(!stagingBackend){setDaily(null);setDailyLoaded(true);setNotice('خدمة المكافآت غير متاحة حالياً. حاول لاحقاً.');return null;}
    dailyRequestInFlight.current=true;
    setDailyLoading(true);
    try{
      const {data,error}=await stagingBackend.rpc('daily_reward_status');
      if(error)throw error;
      if(!data || typeof data!=='object')throw new Error('Missing reward status');
      const status=data as {day?:number;claimed?:boolean;coins?:number;schedule?:number[]};
      if(!Number.isInteger(status.day) || (status.day ?? 0)<1 || (status.day ?? 0)>7 || typeof status.claimed!=='boolean' || typeof status.coins!=='number' || !Number.isFinite(status.coins) || (status.coins ?? -1)<0)throw new Error('Invalid reward status');
      if(!Array.isArray(status.schedule) || status.schedule.length!==7 || !status.schedule.every(coins=>Number.isSafeInteger(coins) && coins>=0) || status.schedule[status.day!-1]!==status.coins)throw new Error('Invalid reward schedule');
      const verified={day:status.day!,claimed:status.claimed,coins:status.coins,schedule:status.schedule};
      setDaily(verified);
      setClaimOutcomeUnknown(false);
      return verified;
    }catch(error){
      console.error('Daily reward status failed',error);
      setClaimOutcomeUnknown(true);
      setNotice('تعذر التحقق من حالة المكافأة. أعد التحديث قبل الاستلام.');
      return null;
    }finally{
      dailyRequestInFlight.current=false;
      setDailyLoaded(true);
      setDailyLoading(false);
    }
  };
  const claim=async()=>{
    if(!stagingBackend||claimRequestInFlight.current||claimOutcomeUnknown||claiming||dailyLoading||!daily||daily.claimed)return;
    claimRequestInFlight.current=true;
    const previousDaily = daily;
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
        setDaily({...refreshed,claimed:true});
        setNotice('نجح طلب الاستلام، لكن حالة الخادم تحتاج إعادة تحقق.');
      }else{
        setDaily(previous=>({...previousDaily,...previous,claimed:true}));
        setNotice('نجح استلام المكافأة، وتعذر تحديث الحالة حالياً.');
      }

    }catch(error){
      console.error('Daily reward claim failed',error);
      const verified=await loadDaily();
      if(!verified)setClaimOutcomeUnknown(true);
      setNotice(verified?.claimed
        ? 'المكافأة مسجلة كمستلمة اليوم في الخادم. لا حاجة لإعادة الطلب.'
        : verified ? 'لم يتم تأكيد الاستلام. راجع حالة المكافأة قبل إعادة المحاولة.'
        : 'تعذر التحقق من نتيجة الاستلام. لا تعاود الطلب حتى تتأكد من حالة المكافأة.');
    }finally{
      claimRequestInFlight.current=false;
      setClaiming(false);
    }
  };
  useEffect(()=>{void loadDaily();},[]);
  // Recheck the Baghdad-calendar reward state after the app resumes or a new day begins.
  // The server remains authoritative for eligibility and the claimed flag.
  useEffect(()=>{
    const onResume=()=>{if(document.visibilityState==='visible')void loadDaily();};
    document.addEventListener('visibilitychange',onResume);
    return ()=>document.removeEventListener('visibilitychange',onResume);
  },[]);
  useEffect(()=>{
    const onOpenRewards=()=>{sessionStorage.setItem('totichat:offers:seen','yes');setNotice('');setTab('daily');setOpen(true);void loadDaily();};
    window.addEventListener('totichat:open-rewards',onOpenRewards);
    return ()=>window.removeEventListener('totichat:open-rewards',onOpenRewards);
  },[]);
  // Resolve automatic popup priority only after both server-backed states are known.
  useEffect(()=>{
    if(!dailyLoaded || !offersLoaded || disabled || sessionStorage.getItem('totichat:offers:seen'))return;
    if(daily && !daily.claimed){setTab('daily');setOpen(true);}
    else if(!offersError && items.length>0){setTab('offers');setOpen(true);}
    else return;
    sessionStorage.setItem('totichat:offers:seen','yes');
  },[daily,dailyLoaded,offersLoaded,offersError,items,disabled]);
  useEffect(()=>{
    if(!stagingBackend){setOffersError(true);setOffersLoading(false);setOffersLoaded(true);setItems([]);return;}
    let alive=true;
    const refresh=async()=>{
      setOffersLoading(true);
      setOffersError(false);
      setItems([]);
      setOffersLoaded(false);
      const nowIso=new Date().toISOString();
      const offers=await stagingBackend.from('recharge_offers').select('id,title,description,image_url,price_iqd,coins,bonus_coins,starts_at,ends_at').eq('status','published').or(`starts_at.is.null,starts_at.lte.${nowIso}`).or(`ends_at.is.null,ends_at.gt.${nowIso}`).order('created_at',{ascending:false}).limit(100);
      if(offers.error){if(alive){setOffersError(true);setOffersLoading(false);setOffersLoaded(true);setItems([]);}console.error('Recharge offers load failed',offers.error);return;}
      const now=Date.now();
      const merged:Offer[]=(offers.data??[]).map(o=>({...o,link_kind:'offer',link_target:null}));
      const active=merged.filter(b=>(!b.starts_at||(Number.isFinite(Date.parse(b.starts_at))&&Date.parse(b.starts_at)<=now))&&(!b.ends_at||(Number.isFinite(Date.parse(b.ends_at))&&Date.parse(b.ends_at)>now)) && typeof b.title==='string' && b.title.trim().length>0 && b.price_iqd!=null && Number.isSafeInteger(Number(b.price_iqd)) && Number(b.price_iqd)>0 && b.coins!=null && Number.isSafeInteger(Number(b.coins)) && Number(b.coins)>0 && (b.bonus_coins==null || (Number.isSafeInteger(Number(b.bonus_coins)) && Number(b.bonus_coins)>=0)) && Number.isSafeInteger(Number(b.coins)+Number(b.bonus_coins??0)));
      if(alive){setOffersError(false);setOffersLoading(false);setOffersLoaded(true);setItems(active.slice(0,10));setIndex(0);}
    };
    void refresh().catch(error => {
      if (alive) {setOffersError(true);setOffersLoading(false);setOffersLoaded(true);setItems([]);console.error('Recharge offers refresh failed', error);}
    });
    return ()=>{alive=false;};
  },[disabled,offersRetry]);
  // Refresh published offers when the user returns to the app while viewing offers.
  // This keeps admin edits, publishing and stopping offers visible without reopening the popup.
  useEffect(()=>{
    if(!open || tab!=='offers')return;
    const refreshOnReturn=()=>{
      if(document.visibilityState==='visible')setOffersRetry(previous=>previous+1);
    };
    window.addEventListener('focus',refreshOnReturn);
    document.addEventListener('visibilitychange',refreshOnReturn);
    return ()=>{
      window.removeEventListener('focus',refreshOnReturn);
      document.removeEventListener('visibilitychange',refreshOnReturn);
    };
  },[open,tab]);
  // Keep expiry accurate even if the offers dialog remains open across the end time.
  const [offerClock,setOfferClock]=useState(()=>Date.now());
  useEffect(()=>{
    if(!open || tab!=='offers')return;
    setOfferClock(Date.now());
    const timer=window.setInterval(()=>setOfferClock(Date.now()),15000);
    return ()=>window.clearInterval(timer);
  },[open,tab]);
  const visibleOffers=items.filter(offer=>!offer.ends_at || (Number.isFinite(Date.parse(offer.ends_at)) && Date.parse(offer.ends_at)>offerClock));
  const visibleIndex=Math.min(index,Math.max(0,visibleOffers.length-1));
  const selected=visibleOffers[visibleIndex];
  return <>
    {open&&<div className="fixed inset-0 z-[110] bg-black/75 flex items-center justify-center p-3" dir="rtl" role="dialog" aria-modal="true" aria-label="المكافآت والعروض">
      <div className="w-full max-w-sm max-h-[88dvh] overflow-y-auto rounded-[28px] bg-[#e6fff3] border-[3px] border-[#a4e8c9] shadow-[0_0_30px_rgba(246,210,86,.25)]">
        <div className="relative overflow-hidden bg-gradient-to-b from-[#004c3c] via-[#087e60] to-[#2ab48b] px-4 pt-6 pb-5 text-center text-white"><div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" /><div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full border border-amber-200/20" /><div aria-hidden="true" className="pointer-events-none absolute -left-10 -bottom-16 h-36 w-36 rounded-full border border-amber-200/20" />
          <button onClick={()=>setOpen(false)} aria-label="إغلاق" className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/25 flex items-center justify-center"><X size={22}/></button>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-100/25 to-emerald-950/20 shadow-[0_4px_18px_rgba(255,215,110,.25)]"><Gift size={34} strokeWidth={1.8} className="text-amber-100" aria-hidden="true" /></div>
          <h2 className="text-2xl font-black text-[#fff0a8] drop-shadow">{tab === 'daily' ? 'المكافأة اليومية' : 'العروض الملكية'}</h2>
          <p className="text-xs text-emerald-50">{tab === 'daily' ? 'استلم مكافأتك كل يوم واكتشف عروض الشحن الخاصة' : 'اكتشف عروض الشحن المنشورة من الإدارة'}</p>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button type="button" onClick={()=>setTab('daily')} className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-black text-sm ${tab==='daily'?'bg-[#0a9d72] text-white':'bg-white text-[#137b60]'}`}><Gift size={17} aria-hidden="true" /> المكافآت اليومية</button>
            <button type="button" onClick={()=>{setTab('offers');setOffersRetry(previous=>previous+1);}} className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-black text-sm ${tab==='offers'?'bg-[#0a9d72] text-white':'bg-white text-[#137b60]'}`}><Coins size={17} aria-hidden="true" /> عروض الشحن</button>
          </div>
          {tab==='offers'&&<button type="button" disabled={offersLoading} onClick={()=>setOffersRetry(n=>n+1)} className="mb-3 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-900 disabled:opacity-50"><RefreshCw size={16} className={offersLoading?'animate-spin inline ml-2':'inline ml-2'} aria-hidden="true" />{offersLoading?'جارٍ تحديث العروض...':'تحديث عروض الشحن'}</button>}
          {tab==='daily'?<>
            <div className="grid grid-cols-3 gap-2" aria-label="جدول المكافآت للأيام السبعة">
              {Array.from({length:6},(_,i)=>i).map(i=><div key={i} aria-label={`اليوم ${i+1}: ${daily && daily.day===i+1 ? (daily.claimed?'تم الاستلام':'متاح للاستلام') : daily && i+1<daily.day ? 'يوم سابق' : 'غير متاح حالياً'}`} className={`relative rounded-xl border-2 p-2 text-center min-h-[98px] flex flex-col items-center justify-between ${daily?.day===i+1?'bg-gradient-to-b from-[#fff5a3] to-[#f5bd42] border-[#d6a230]':'bg-gradient-to-b from-white to-[#9ee8d0] border-[#71cbb0]'}`}>
                <strong className="text-[#0b735a] text-sm">اليوم {i+1}</strong>{daily?.day===i+1 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${daily.claimed ? 'bg-emerald-700 text-white' : 'bg-amber-100 text-amber-900'}`}>{daily.claimed ? 'تم الاستلام' : 'متاح اليوم'}</span>}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/70 bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 shadow-[0_3px_9px_rgba(130,88,10,.18)]"><Coins className="text-amber-900" size={24} strokeWidth={1.8} aria-hidden="true"/></div>
                <span className="text-[#075b45] font-black text-sm">{daily ? daily.schedule[i].toLocaleString('ar-IQ') + ' عملة' : 'حسب الخادم'}</span>
              </div>)}
            </div>
            <div aria-label={`اليوم السابع: ${daily?.day===7 ? (daily.claimed ? 'تم الاستلام' : 'متاح للاستلام') : daily ? (daily.day>7 ? 'يوم سابق' : 'غير متاح حالياً') : 'الحالة غير معروفة'}`} className={`mt-2 rounded-xl border-2 border-[#71cbb0] bg-gradient-to-b from-[#e8fff5] to-[#73d8b4] p-3 text-center ${daily?.day===7?'ring-2 ring-amber-400':''}`}>
              <strong className="text-[#096d53]">اليوم السابع · المكافأة الملكية</strong>{daily?.day===7 && <span className={`mx-auto mt-2 block w-fit rounded-full px-3 py-1 text-xs font-black ${daily.claimed ? 'bg-emerald-700 text-white' : 'bg-amber-100 text-amber-900'}`}>{daily.claimed ? 'تم استلام مكافأة اليوم السابع' : 'مكافأة اليوم السابع متاحة'}</span>}
              <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-amber-500 shadow-lg"><Coins size={36} className="text-amber-900" aria-hidden="true" /></div>
              <span className="text-[#075b45] font-black">{daily ? daily.schedule[6].toLocaleString('ar-IQ') + ' عملة' : 'حسب الخادم'}</span>
            </div>
            <button type="button" disabled={claiming||dailyLoading} onClick={()=>{setNotice('');void loadDaily();}} className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white/80 px-3 py-2 text-sm font-bold text-emerald-900 disabled:opacity-50"><RefreshCw size={16} className={dailyLoading?'animate-spin':''}/> تحديث حالة المكافأة</button>
            <button type="button" disabled={!daily||daily.claimed||claimOutcomeUnknown||claiming||dailyLoading} onClick={()=>void claim()} className="w-full mt-3 rounded-2xl bg-gradient-to-b from-[#ffe57a] to-[#f6b500] text-[#6b4200] font-black text-lg py-3 border-2 border-[#f0b22a] disabled:opacity-60">{claiming?'جاري الاستلام...':dailyLoading?'جارٍ التحقق...':daily?.claimed?'تم الاستلام اليوم':claimOutcomeUnknown?'تحقق من الحالة أولاً':'استلام المكافأة'}</button>
          </>:<>
            {offersError?<div role="status" className="py-6 text-center"><p className="text-rose-800">تعذر تحميل عروض الشحن من الخادم. تحقق من الاتصال وحاول مجدداً.</p><button type="button" disabled={offersLoading} onClick={()=>setOffersRetry(n=>n+1)} className="mt-3 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-900 disabled:opacity-50"><RefreshCw size={16} className="ml-2 inline" aria-hidden="true"/>إعادة المحاولة</button></div>:(!offersLoaded || offersLoading) && visibleOffers.length===0?<p role="status" className="py-8 text-center text-emerald-900">جارٍ تحميل العروض...</p>:visibleOffers.length===0?<p className="text-center text-emerald-900 py-8">لا توجد عروض شحن خاصة حالياً</p>:selected&&<div className="rounded-xl bg-white border border-emerald-200 overflow-hidden">
              {selected.image_url?<img src={selected.image_url} alt={selected.title} className="w-full aspect-[2/1] object-contain"/>:<div className="h-32 bg-gradient-to-br from-emerald-800 to-amber-500 flex items-center justify-center text-white"><Gift size={54}/></div>}
              <div className="p-3 text-center"><strong className="text-[#075b45]">{selected.title}</strong><p className="text-sm font-bold text-amber-700 mt-1">{selected.price_iqd != null && Number.isFinite(Number(selected.price_iqd)) && Number(selected.price_iqd) >= 0 ? Number(selected.price_iqd).toLocaleString('ar-IQ') + ' د.ع' : 'السعر غير محدد'} مقابل {Number.isFinite(Number(selected.coins)) && Number(selected.coins) > 0 && (selected.bonus_coins == null || (Number.isFinite(Number(selected.bonus_coins)) && Number(selected.bonus_coins) >= 0)) && Number.isSafeInteger(Number(selected.coins) + Number(selected.bonus_coins ?? 0)) ? (Number(selected.coins) + Number(selected.bonus_coins ?? 0)).toLocaleString('ar-IQ') + ' عملة' : 'رصيد غير محدد'}</p>{selected.bonus_coins != null && Number(selected.bonus_coins)>0 && <p className="mt-1 text-xs font-bold text-emerald-800">العملات الأساسية: {Number(selected.coins).toLocaleString('ar-IQ')} · المكافأة الإضافية: {Number(selected.bonus_coins).toLocaleString('ar-IQ')}</p>}{selected.description&&<p className="text-xs mt-1 text-slate-600">{selected.description}</p>}{selected.ends_at && !Number.isNaN(Date.parse(selected.ends_at)) && <p className="mt-2 text-xs font-bold text-emerald-800">ينتهي العرض: {new Date(selected.ends_at).toLocaleString('ar-IQ')}</p>}</div>
              {visibleOffers.length>1&&<div className="flex justify-between items-center px-3 pb-2"><button onClick={()=>setIndex(i=>(i-1+visibleOffers.length)%visibleOffers.length)} aria-label="السابق"><ChevronRight/></button><span>{visibleIndex+1} / {visibleOffers.length}</span><button onClick={()=>setIndex(i=>(i+1)%visibleOffers.length)} aria-label="التالي"><ChevronLeft/></button></div>}
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
