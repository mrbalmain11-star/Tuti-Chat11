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
    let latestRequest = 0;
    const load = async () => {
      const requestId = ++latestRequest;
      if (!stagingBackend || !userId) { if (active && requestId === latestRequest) { setError(true); setLoading(false); } return; }
      try {
        const { data, error: fetchError } = await stagingBackend.rpc('totichat_profile_cp', { p_user_id: userId });
        if (fetchError) throw fetchError;
        if (active && requestId === latestRequest) { const next: CpLink[] = Array.isArray(data) ? data.filter((link: CpLink) => link.accepted === true) : []; setLinks(next); onLinksChange?.(next); setError(false); }
      } catch (e) { if (active && requestId === latestRequest) { setLinks([]); onLinksChange?.([]); setError(true); } console.error('CP profile load failed', e); }
      finally { if (active && requestId === latestRequest) setLoading(false); }
    };
    setLoading(true); setLinks([]); onLinksChange?.([]); void load();
    const refresh = () => { if (!document.hidden) void load(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
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
      if (reloadError) {
        setLinks([]);
        onLinksChange?.([]);
        setError(true);
        throw reloadError;
      }
      const next: CpLink[] = Array.isArray(data) ? data.filter((item: CpLink) => item.accepted === true) : [];
      setLinks(next);
      onLinksChange?.(next);
      setError(false);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر فك علاقة CP');
    } finally { setEndingPartner(null); }
  };
  // Do not render a placeholder CP rectangle for profiles without a confirmed link.
  if (links.length === 0) return null;
  return <section className={compact ? 'relative isolate mx-2 mt-3 min-h-[180px] overflow-hidden rounded-[26px] border border-amber-400/70 bg-gradient-to-b from-[#4b173c] via-[#7d2c54] to-[#301327] p-4 shadow-[0_12px_36px_rgba(0,0,0,.35)]' : 'relative isolate mx-3 my-3.5 min-h-[180px] overflow-hidden rounded-[26px] border border-amber-500/70 bg-gradient-to-b from-[#4b173c] via-[#7d2c54] to-[#301327] p-4 shadow-[0_12px_36px_rgba(0,0,0,.35)]'} dir="rtl">
    <img src="/assets/royal-cp-ornament.svg" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill opacity-90" />
    <div className="relative z-10">
    <div className="flex items-center gap-2 text-amber-100"><span className="text-sm font-black">علاقات CP</span></div>
    {loading ? <p className="mt-2 text-xs text-slate-500">جارٍ تحميل العلاقات...</p> :
      error ? <p className="mt-2 text-xs text-rose-500">تعذر تحميل علاقات CP</p> :
      links.length === 0 ? null :
      <div className="mt-2 space-y-2">{links.map(link => <div key={link.typeId + link.partnerId} className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-[#2c142b]/85 p-2 text-amber-50 backdrop-blur-sm">
        <div className="relative h-14 w-14 shrink-0 rounded-full border-[3px] border-amber-300 bg-gradient-to-br from-[#fff3bd] via-[#a86a28] to-[#fff0aa] p-0.5 shadow-[0_3px_12px_rgba(244,183,74,.45)]" aria-label="صورة شريك CP">
          {link.partnerAvatar ? <img src={link.partnerAvatar} alt={link.partnerName || 'الشريك'} className="h-full w-full rounded-full object-cover" /> : <CircleUserRound className="h-full w-full rounded-full text-amber-950" />}
        </div>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{link.partnerName || 'مستخدم'}</p><p className="text-[11px] text-amber-100/75">{link.typeLabel} · {Number.isFinite(Number(link.level)) && Number(link.level) > 0 ? `Lv.${link.level} · ` : ''}ID {link.partnerPublicId ?? '—'}</p></div>
        {Number.isFinite(Number(link.level)) && Number(link.level) > 0 && (
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-[#6d3b15] via-[#e9ba64] to-[#67310e] text-[#fff7d6] shadow-[inset_0_1px_5px_rgba(255,255,255,.6),0_3px_10px_rgba(0,0,0,.4)]" aria-label={`مستوى العلاقة ${link.level}`}>
            <span className="text-[9px] font-bold leading-none">CP</span>
            <span className="text-base font-black leading-tight">{link.level}</span>
          </div>
        )}
        {userId === currentUser.id && <button type="button" disabled={endingPartner !== null} onClick={() => void endRelationship(link)} className="rounded-lg border border-amber-300/70 px-2 py-1 text-[11px] font-bold text-amber-100 disabled:opacity-50">{endingPartner === link.partnerId ? 'جارٍ الفك...' : 'فك العلاقة'}</button>}
        {link.typeLabel?.includes('حب') || /love/i.test(link.typeLabel || '') ? <Heart className="h-4 w-4 text-rose-300" aria-label="علاقة حب" /> : null}
      </div>)}</div>}
    </div>
  </section>;
};
