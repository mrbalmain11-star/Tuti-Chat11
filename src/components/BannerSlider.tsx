import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { stagingBackend } from '../services/stagingBackend';

const supportedTargets = new Set(['home', 'me', 'vip', 'wallet', 'agency']);

type Banner = { id: string; title: string; image_url: string; link_kind: string; link_target: string | null; sort_order: number; starts_at: string | null; ends_at: string | null };

export const BannerSlider: React.FC = () => {
  const [items, setItems] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const app = useApp();
  useEffect(() => {
    if (!stagingBackend) return;
    let alive = true;
    const refresh = async () => {
      const now = new Date().toISOString();
      const { data, error } = await stagingBackend!.from('home_banners')
        .select('id,title,image_url,link_kind,link_target,sort_order,starts_at,ends_at')
        .eq('status', 'published')
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order('sort_order', { ascending: true })
        .limit(10);
      if (error) { console.error('Banner loading failed:', error); return; }
      if (alive) setItems(data ?? []);
    };
    void refresh();
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const refreshTimer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 60000);
    return () => { alive = false; window.clearInterval(refreshTimer); document.removeEventListener('visibilitychange', refreshWhenVisible); };
  }, []);
  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % items.length), 5000);
    return () => window.clearInterval(timer);
  }, [items.length]);
  useEffect(() => { if (index >= items.length) setIndex(0); }, [index,items.length]);
  const banner = items[index];
  const open = () => {
    if (!banner || banner.link_kind !== 'screen') return;
    switch (banner.link_target) {
      case 'home': app.setActiveTab('home'); break;
      case 'me': app.setActiveTab('profile'); break;
      case 'vip': app.setOpenVipModal(true); break;
      case 'wallet': app.setOpenRechargeModal(true); break;
      case 'agency': app.setOpenAgencyModal(true); break;
      default: console.warn('Banner route not available in current UI:',banner.link_target);
    }
  };
  return <div className="px-4 pt-2 pb-2" dir="rtl">
    <div className="relative overflow-hidden rounded-2xl aspect-[2/1] border border-amber-400/50 shadow-lg bg-gradient-to-br from-emerald-900 to-slate-900"
      onTouchStart={e => { startX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={e => {
        if (startX.current === null || items.length < 2) return;
        const diff = e.changedTouches[0].clientX - startX.current;
        startX.current = null;
        if (Math.abs(diff) > 35) setIndex(i => (i + (diff > 0 ? -1 : 1) + items.length) % items.length);
      }}>
      {banner ? <>
        <button type="button" onClick={open} disabled={banner.link_kind !== 'screen' || !banner.link_target || !supportedTargets.has(banner.link_target)} className="absolute inset-0 w-full h-full disabled:cursor-default" aria-label={banner.title}>
          <img key={banner.id} src={banner.image_url} alt={banner.title} className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display='none'; }} />
        </button>
        {items.length > 1 && <div className="absolute bottom-2 left-3 z-10 flex gap-1 rounded-full bg-black/40 px-2 py-1">
          {items.map((item,i) => <button key={item.id} type="button" onClick={() => setIndex(i)}
            aria-label={`البنر ${i+1}`} className={`h-2 rounded-full ${i===index?'w-5 bg-white':'w-2 bg-white/50'}`} />)}
        </div>}
      </> : <div className="h-full flex items-center justify-center text-white/70 text-sm">لا توجد بنرات نشطة حالياً</div>}
    </div>
  </div>;
};
