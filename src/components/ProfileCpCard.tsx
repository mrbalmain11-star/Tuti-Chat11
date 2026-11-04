import React, { useEffect, useState } from 'react';
import { Heart, CircleUserRound } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';

type CpLink = { typeId: string; typeLabel: string; level: number; partnerId: string; partnerName: string; partnerAvatar?: string | null; partnerPublicId?: number; accepted: boolean };

export const ProfileCpCard: React.FC<{ userId: string; compact?: boolean; refreshKey?: number; onLinksChange?: (links: CpLink[]) => void }> = ({ userId, compact = false, refreshKey = 0, onLinksChange }) => {
  const [links, setLinks] = useState<CpLink[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!stagingBackend || !userId) { if (active) { setError(true); setLoading(false); } return; }
      try {
        const { data, error: fetchError } = await stagingBackend.rpc('totichat_profile_cp', { p_user_id: userId });
        if (fetchError) throw fetchError;
        if (active) { const next: CpLink[] = Array.isArray(data) ? data.filter((link: CpLink) => link.accepted === true) : []; setLinks(next); onLinksChange?.(next); setError(false); }
      } catch (e) { if (active) setError(true); console.error('CP profile load failed', e); }
      finally { if (active) setLoading(false); }
    };
    setLoading(true); setLinks([]); void load();
    const refresh = () => { void load(); };
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [userId, refreshKey]);
  // Do not render a placeholder CP rectangle for profiles without a confirmed link.
  if (links.length === 0) return null;
  return <section className={compact ? 'mx-4 mt-3 min-h-[86px] rounded-[26px] border border-rose-400/25 bg-rose-500/10 p-3' : 'mx-4 my-3.5 min-h-[86px] rounded-[26px] border border-amber-200 bg-gradient-to-l from-rose-50 to-amber-50 p-3.5 shadow-sm'} dir="rtl">
    <div className="flex items-center gap-2 text-rose-600"><Heart className="h-4 w-4 fill-current" /><span className="text-sm font-black">علاقات CP</span></div>
    {loading ? <p className="mt-2 text-xs text-slate-500">جارٍ تحميل العلاقات...</p> :
      error ? <p className="mt-2 text-xs text-rose-500">تعذر تحميل علاقات CP</p> :
      links.length === 0 ? null :
      <div className="mt-2 space-y-2">{links.map(link => <div key={link.typeId + link.partnerId} className="flex items-center gap-2 rounded-xl bg-white/85 p-2 text-slate-800">
        {link.partnerAvatar ? <img src={link.partnerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <CircleUserRound className="h-10 w-10 text-rose-400" />}
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{link.partnerName || 'مستخدم'}</p><p className="text-[11px] text-slate-500">{link.typeLabel} · Lv.{link.level} · ID {link.partnerPublicId ?? '—'}</p></div>
        <Heart className="h-4 w-4 text-rose-500" />
      </div>)}</div>}
  </section>;
};
