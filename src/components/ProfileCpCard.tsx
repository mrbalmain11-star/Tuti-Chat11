import React, { useEffect, useState } from 'react';
import { CircleUserRound } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';
import { useApp } from '../context/AppContext';

type CpLink = { typeId: string; typeLabel: string; level: number; partnerId: string; partnerName: string; partnerAvatar?: string | null; partnerPublicId?: number; accepted: boolean };

export const ProfileCpCard: React.FC<{ userId: string; userName?: string; userAvatar?: string | null; compact?: boolean; refreshKey?: number; onLinksChange?: (links: CpLink[]) => void }> = ({ userId, userName, userAvatar, compact = false, refreshKey = 0, onLinksChange }) => {
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
      <div className="mt-3 space-y-3">{links.map(link => (
        <div key={link.typeId + link.partnerId} className="rounded-2xl border border-amber-300/50 bg-[#2c142b]/75 p-2.5 text-amber-50 backdrop-blur-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
              <div className="h-14 w-14 rounded-full border-[3px] border-amber-300 bg-[#5c3048] p-0.5 shadow-[0_3px_12px_rgba(244,183,74,.45)]">
                {userAvatar ? <img src={userAvatar} alt={userName || 'صاحب الملف'} className="h-full w-full rounded-full object-cover" /> : <CircleUserRound className="h-full w-full text-amber-200" />}
              </div>
              <span className="w-full truncate text-[11px] font-bold">{userName || 'صاحب الملف'}</span>
            </div>
            <div className="flex min-w-[58px] flex-col items-center gap-1 text-center">
              {Number.isFinite(Number(link.level)) && Number(link.level) > 0 ? (
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-[#6d3b15] via-[#e9ba64] to-[#67310e] text-[#fff7d6] shadow-[inset_0_1px_5px_rgba(255,255,255,.6),0_3px_10px_rgba(0,0,0,.4)]" aria-label={`مستوى العلاقة ${link.level}`}>
                  <span className="text-[9px] font-bold leading-none">CP</span>
                  <span className="text-base font-black leading-tight">{link.level}</span>
                </div>
              ) : <span className="text-[11px] font-bold text-amber-200">CP</span>}
              <span className="max-w-[90px] break-words text-[10px] font-bold text-amber-100">{link.typeLabel}</span>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
              <div className="h-14 w-14 rounded-full border-[3px] border-amber-300 bg-[#5c3048] p-0.5 shadow-[0_3px_12px_rgba(244,183,74,.45)]">
                {link.partnerAvatar ? <img src={link.partnerAvatar} alt={link.partnerName || 'الشريك'} className="h-full w-full rounded-full object-cover" /> : <CircleUserRound className="h-full w-full text-amber-200" />}
              </div>
              <span className="w-full truncate text-[11px] font-bold">{link.partnerName || 'الشريك'}</span>
            </div>
          </div>
          {link.partnerPublicId != null && <p className="mt-1 text-center text-[10px] text-amber-100/75">ID {link.partnerPublicId}</p>}
          {userId === currentUser.id && (
            <button type="button" disabled={endingPartner !== null} onClick={() => void endRelationship(link)} className="mx-auto mt-2 block rounded-lg border border-amber-300/70 bg-[#39172e]/90 px-3 py-1 text-[11px] font-bold text-amber-100 disabled:opacity-50">
              {endingPartner === link.partnerId ? 'جارٍ الفك...' : 'فك العلاقة'}
            </button>
          )}
        </div>
      ))}</div>
    </div>
  </section>;
};
