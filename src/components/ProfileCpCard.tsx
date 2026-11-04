import React, { useEffect, useState } from 'react';
import { Heart, CircleUserRound } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';
import { useApp } from '../context/AppContext';

type CpLink = { typeId: string; typeLabel: string; level: number; partnerId: string; partnerName: string; partnerAvatar?: string | null; partnerPublicId?: number; accepted: boolean };

export const ProfileCpCard: React.FC<{ userId: string; compact?: boolean; refreshKey?: number; onLinksChange?: (links: CpLink[]) => void }> = ({ userId, compact = false, refreshKey = 0, onLinksChange }) => {
  const { currentUser } = useApp();
  const [endingPartner, setEndingPartner] = useState<string | null>(null);
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
      } catch (e) { if (active) { setLinks([]); onLinksChange?.([]); setError(true); } console.error('CP profile load failed', e); }
      finally { if (active) setLoading(false); }
    };
    setLoading(true); setLinks([]); onLinksChange?.([]); void load();
    const refresh = () => { void load(); };
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [userId, refreshKey]);
  const endRelationship = async (link: CpLink) => {
    if (!stagingBackend || userId !== currentUser.id || endingPartner) return;
    if (!window.confirm('هل تريد فك علاقة CP مع هذا المستخدم؟')) return;
    setEndingPartner(link.partnerId);
    try {
      const { error: actionError } = await stagingBackend.rpc('phase4_cp_action', {
        p_partner_id: link.partnerId, p_type_id: link.typeId,
        p_action: 'end', p_request_id: crypto.randomUUID(),
      });
      if (actionError) throw actionError;
      const { data, error: reloadError } = await stagingBackend.rpc('totichat_profile_cp', { p_user_id: userId });
      if (reloadError) { setLinks([]); onLinksChange?.([]); throw reloadError; }
      const next: CpLink[] = Array.isArray(data) ? data.filter((item: CpLink) => item.accepted === true) : [];
      setLinks(next);
      onLinksChange?.(next);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر فك علاقة CP');
    } finally { setEndingPartner(null); }
  };
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
        {userId === currentUser.id && <button type="button" disabled={endingPartner !== null} onClick={() => void endRelationship(link)} className="rounded-lg border border-rose-300 px-2 py-1 text-[11px] font-bold text-rose-700 disabled:opacity-50">{endingPartner === link.partnerId ? 'جارٍ الفك...' : 'فك العلاقة'}</button>}
        <Heart className="h-4 w-4 text-rose-500" />
      </div>)}</div>}
  </section>;
};
