import { useEffect, useState } from 'react';
import { stagingBackend } from '../services/stagingBackend';

const KEY = 'totichat:cp-frame-preference:';
export type CpFramePreference = 'auto' | 'off';
export function getCpFramePreference(userId: string): CpFramePreference {
  try { return localStorage.getItem(KEY + userId) === 'off' ? 'off' : 'auto'; } catch { return 'auto'; }
}
export function setCpFramePreference(userId: string, value: CpFramePreference): void {
  try { localStorage.setItem(KEY + userId, value); } catch { /* storage may be disabled */ }
  window.dispatchEvent(new CustomEvent('totichat:cp-frame-preference', { detail: { userId } }));
}
/** Only confirmed server CP relationships qualify; no synthetic relationships. */
export function useConfirmedCpFrame(userId?: string | null, refreshKey = 0): boolean {
  const [eligible, setEligible] = useState(false);
  const [preference, setPreference] = useState<CpFramePreference>('auto');
  useEffect(() => {
    if (!userId) { setEligible(false); return; }
    let active = true;
    const sync = () => setPreference(getCpFramePreference(userId));
    sync();
    const load = async () => {
      if (!stagingBackend) { if (active) setEligible(false); return; }
      const { data, error } = await stagingBackend.rpc('totichat_profile_cp', { p_user_id: userId });
      if (active) setEligible(!error && Array.isArray(data) && data.some(link =>
        link && link.accepted === true && typeof link.partnerId === 'string' && link.partnerId.length > 0));
    };
    void load().catch(() => { if (active) setEligible(false); });
    const changed = (event: Event) => { if ((event as CustomEvent).detail?.userId === userId) sync(); };
    const refresh = () => { if (!document.hidden) void load().catch(() => { if (active) setEligible(false); }); };
    window.addEventListener('totichat:cp-frame-preference', changed);
    window.addEventListener('focus', refresh);
    // Keep both partners' frames synchronized without opening the other profile.
    const interval = window.setInterval(refresh, 15000);
    return () => { active = false; window.removeEventListener('totichat:cp-frame-preference', changed); window.removeEventListener('focus', refresh); window.clearInterval(interval); };
  }, [userId, refreshKey]);
  return eligible && preference !== 'off';
}
