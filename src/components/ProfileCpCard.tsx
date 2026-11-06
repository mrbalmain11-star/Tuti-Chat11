import React, { useEffect, useRef, useState } from 'react';
import { CircleUserRound } from 'lucide-react';
import { RoyalCpAvatarFrame, RoyalCpHeart, RoyalCpOrnament } from './RoyalCpArtwork';
import { stagingBackend } from '../services/stagingBackend';
import { useApp } from '../context/AppContext';

type CpLink = { typeId: string; typeLabel: string; level: number; partnerId: string; partnerName: string; partnerAvatar?: string | null; partnerPublicId?: number; accepted: boolean };

const isConfirmedCpLink = (value: unknown): value is CpLink => {
  if (!value || typeof value !== 'object') return false;
  const link = value as Partial<CpLink>;
  return link.accepted === true && typeof link.typeId === 'string' && link.typeId.length > 0
    && typeof link.partnerId === 'string' && link.partnerId.length > 0
    && typeof link.partnerName === 'string' && typeof link.typeLabel === 'string'
    && typeof link.level === 'number' && Number.isFinite(link.level) && link.level >= 0
    && (link.partnerAvatar == null || typeof link.partnerAvatar === 'string');
};

export const ProfileCpCard: React.FC<{ userId: string; userName?: string; userAvatar?: string | null; compact?: boolean; refreshKey?: number; onLinksChange?: (links: CpLink[]) => void; onPartnerClick?: (partnerId: string) => void }> = ({ userId, userName, userAvatar, compact = false, refreshKey = 0, onLinksChange, onPartnerClick }) => {
  const { currentUser } = useApp();
  const [endingPartner, setEndingPartner] = useState<string | null>(null);
  const [links, setLinks] = useState<CpLink[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);
  const previousUserId = useRef(userId);
  const requestVersion = useRef(0);
  const endingRef = useRef(false);
  const activeProfileIdRef = useRef(userId);
  activeProfileIdRef.current = userId;
  // Keep asynchronous refreshes connected to the latest parent callback.
  const onLinksChangeRef = useRef(onLinksChange);
  onLinksChangeRef.current = onLinksChange;
  useEffect(() => {
    let active = true;

    const load = async () => {
      const requestId = ++requestVersion.current;
      if (!stagingBackend || !userId) { if (active && requestId === requestVersion.current) { setError(true); setLoading(false); } return; }
      try {
        const { data, error: fetchError } = await stagingBackend.rpc('totichat_profile_cp', { p_user_id: userId });
        if (fetchError) throw fetchError;
        if (!Array.isArray(data) || data.some((item: unknown) => !item || typeof item !== 'object' || ((item as Partial<CpLink>).accepted === true && !isConfirmedCpLink(item)))) throw new Error('Invalid CP relationship response');
        if (active && requestId === requestVersion.current) { const next: CpLink[] = data.filter(isConfirmedCpLink); setLinks(next); onLinksChangeRef.current?.(next); setError(false); }
      } catch (e) { if (active && requestId === requestVersion.current) { setError(true); } console.error('CP profile load failed', e); }
      finally { if (active && requestId === requestVersion.current) setLoading(false); }
    };
    setLoading(true);
    // A retry must not discard the last confirmed relationship during a network outage.
    if (previousUserId.current !== userId) {
      previousUserId.current = userId;
      setLinks([]);
      setError(false);
      onLinksChangeRef.current?.([]);
    }
    void load();
    const refresh = () => { if (!document.hidden && !endingRef.current) void load(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      ++requestVersion.current;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [userId, refreshKey, retryNonce]);
  const endRelationship = async (link: CpLink) => {
    if (!stagingBackend || userId !== currentUser.id || endingRef.current) return;
    if (!window.confirm('هل تريد فك علاقة CP مع هذا المستخدم؟')) return;
    endingRef.current = true;
    ++requestVersion.current;
    // A pending initial CP load was invalidated; its finally block cannot clear loading.
    setLoading(false);
    setEndingPartner(link.partnerId);
    try {
      const { error: actionError } = await stagingBackend.rpc('phase4_cp_action', {
        p_partner_id: link.partnerId, p_type_id: link.typeId,
        p_action: 'end', p_request_id: crypto.randomUUID(),
      });
      if (actionError) throw actionError;
      if (activeProfileIdRef.current !== userId) return;
      // The server confirmed unlinking. Never keep showing this relationship if the reload fails.
      const remaining = links.filter(item => !(item.partnerId === link.partnerId && item.typeId === link.typeId));
      setLinks(remaining);
      onLinksChangeRef.current?.(remaining);
      // Refresh events are blocked during unlink; older responses were invalidated before the mutation.
      const { data, error: reloadError } = await stagingBackend.rpc('totichat_profile_cp', { p_user_id: userId });
      if (activeProfileIdRef.current !== userId) return;
      if (reloadError || !Array.isArray(data) || data.some((item: unknown) => !item || typeof item !== 'object' || ((item as Partial<CpLink>).accepted === true && !isConfirmedCpLink(item)))) {
        setError(true);
        window.alert('تم فك العلاقة، لكن تعذر تحديث القائمة. أعد المحاولة عند توفر الاتصال.');
        return;
      }
      const next: CpLink[] = data.filter(isConfirmedCpLink);
      setLinks(next);
      onLinksChangeRef.current?.(next);
      setError(false);
    } catch (err) {
      if (activeProfileIdRef.current === userId) {
        window.alert(err instanceof Error ? err.message : 'تعذر فك علاقة CP');
      }
    } finally {
      endingRef.current = false;
      if (activeProfileIdRef.current === userId) {
        setEndingPartner(null);
        setLoading(false);
      }
    }
  };
  // Do not render a placeholder CP rectangle for profiles without a confirmed link.
  // Hide only a confirmed empty state. On fetch errors the retry control must remain reachable.
  if (links.length === 0 && !error) return null;
  return <section className={compact ? 'relative isolate mx-2 mt-3 min-h-[180px] overflow-hidden rounded-[26px] border border-amber-400/70 bg-gradient-to-b from-[#4b173c] via-[#7d2c54] to-[#301327] p-4 shadow-[0_12px_36px_rgba(0,0,0,.35)]' : 'relative isolate mx-3 my-3.5 min-h-[180px] overflow-hidden rounded-[26px] border border-amber-500/70 bg-gradient-to-b from-[#4b173c] via-[#7d2c54] to-[#301327] p-4 shadow-[0_12px_36px_rgba(0,0,0,.35)]'} dir="rtl">
    <RoyalCpOrnament />
    <div className="relative z-10">
    <div className="flex items-center justify-center gap-2 rounded-xl border border-pink-200/40 bg-gradient-to-l from-[#6b1f4d]/90 via-[#b33d78]/85 to-[#6b1f4d]/90 px-3 py-1.5 text-amber-100"><span className="text-pink-200" aria-hidden="true">♥</span><span className="text-sm font-black">علاقات CP</span><span className="text-pink-200" aria-hidden="true">♥</span></div>
    {error && <div role="status" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-200"><span>{links.length > 0 ? 'تعذر تحديث العلاقات، تُعرض آخر بيانات مؤكدة.' : 'تعذر تحميل العلاقات. تحقق من الاتصال وحاول مجدداً.'}</span><button type="button" disabled={loading || endingPartner !== null} onClick={() => setRetryNonce(n => n + 1)} className="rounded-lg border border-amber-300/70 px-3 py-1 font-bold text-amber-100 disabled:opacity-50">إعادة المحاولة</button></div>}
    {loading && <p role="status" className="mt-2 text-xs text-amber-100/70">جارٍ تحديث العلاقات...</p>}
    {links.length > 0 && <div className="mt-3 space-y-3">{links.map(link => (
        <div key={link.typeId + link.partnerId} className="rounded-2xl border border-amber-300/50 bg-[#2c142b]/75 p-2.5 text-amber-50 backdrop-blur-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(56px,76px)_minmax(0,1fr)] items-center gap-1">
            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
              <div className="relative h-[clamp(56px,18vw,76px)] w-[clamp(56px,18vw,76px)] shrink-0">
                <div className="absolute inset-[12px] overflow-hidden rounded-full bg-[#5c3048]">
                {userAvatar ? <img src={userAvatar} alt={userName || 'صاحب الملف'} className="h-full w-full rounded-full object-cover" /> : <CircleUserRound className="h-full w-full text-amber-200" />}
                </div>
                <RoyalCpAvatarFrame />
              </div>
              <span className="w-full truncate text-[11px] font-bold">{userName || 'صاحب الملف'}</span>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
              {Number.isFinite(Number(link.level)) && Number(link.level) > 0 ? (
                <div className="relative flex h-[clamp(56px,18vw,76px)] w-[clamp(56px,18vw,76px)] items-center justify-center" aria-label={`مستوى العلاقة ${link.level}`}>
                  {link.typeId === 'love' ? <RoyalCpHeart /> : <span className="absolute inset-2 rounded-full border-2 border-amber-200 bg-gradient-to-br from-[#6d3b15] via-[#e9ba64] to-[#67310e]" />}
                  <span className="relative z-10 mt-1 rounded-md bg-[#54132d]/60 px-1 text-sm font-black text-white drop-shadow-[0_1px_2px_#33051b]">{link.level}</span>
                </div>
              ) : <span className="text-[11px] font-bold text-amber-200">CP</span>}
              <span className="max-w-[90px] break-words text-[10px] font-bold text-amber-100">{link.typeLabel}</span>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
              <button type="button" disabled={!onPartnerClick} onClick={() => onPartnerClick?.(link.partnerId)} aria-label={`فتح ملف ${link.partnerName || 'الشريك'}`} className="relative h-[clamp(56px,18vw,76px)] w-[clamp(56px,18vw,76px)] shrink-0 disabled:cursor-default enabled:active:scale-95">
                <div className="absolute inset-[12px] overflow-hidden rounded-full bg-[#5c3048]">
                {link.partnerAvatar ? <img src={link.partnerAvatar} alt={link.partnerName || 'الشريك'} className="h-full w-full rounded-full object-cover" /> : <CircleUserRound className="h-full w-full text-amber-200" />}
                </div>
                <RoyalCpAvatarFrame />
              </button>
              <span className="w-full truncate text-[11px] font-bold">{link.partnerName || 'الشريك'}</span>
            </div>
          </div>
          {link.partnerPublicId != null && <p className="mt-1 text-center text-[10px] text-amber-100/75">ID {link.partnerPublicId}</p>}
          {/* CP progress is intentionally hidden until the authenticated RPC exposes gift_gold and the next level threshold. */}
          {userId === currentUser.id && (
            <button type="button" disabled={endingPartner !== null} onClick={() => void endRelationship(link)} className="mx-auto mt-2 block rounded-lg border border-amber-300/70 bg-[#39172e]/90 px-3 py-1 text-[11px] font-bold text-amber-100 disabled:opacity-50">
              {endingPartner === link.partnerId ? 'جارٍ الفك...' : 'فك العلاقة'}
            </button>
          )}
        </div>
      ))}</div>}
    </div>
  </section>;
};
