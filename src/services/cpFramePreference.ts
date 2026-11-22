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
  const [relationship, setRelationship] = useState<{ userId: string; eligible: boolean } | null>(null);
  const [preference, setPreference] = useState<{ userId: string; value: CpFramePreference } | null>(null);
  useEffect(() => {
    if (!userId) {
      setRelationship(null);
      return;
    }
    let active = true;
    let latestRequest = 0;
    const sync = () => setPreference({ userId, value: getCpFramePreference(userId) });
    sync();

    const load = async () => {
      const request = ++latestRequest;
      let eligible = false;
      try {
        const result = await stagingBackend?.rpc('totichat_profile_cp', { p_user_id: userId });
        eligible = !!result && !result.error && Array.isArray(result.data) && result.data.some(link =>
          link && link.accepted === true && typeof link.partnerId === 'string' && link.partnerId.length > 0);
      } catch {
        // Failed lookups confer no entitlement.
      }
      if (active && request === latestRequest) setRelationship({ userId, eligible });
    };

    void load();
    const changed = (event: Event) => { if ((event as CustomEvent).detail?.userId === userId) sync(); };
    const refresh = () => { if (!document.hidden) void load(); };
    window.addEventListener('totichat:cp-frame-preference', changed);
    window.addEventListener('focus', refresh);
    // Keep both partners' frames synchronized without opening the other profile.
    const interval = window.setInterval(refresh, 15000);
    return () => { active = false; window.removeEventListener('totichat:cp-frame-preference', changed); window.removeEventListener('focus', refresh); window.clearInterval(interval); };
  }, [userId, refreshKey]);
  return !!userId && relationship?.userId === userId && relationship.eligible &&
    preference?.userId === userId && preference.value !== 'off';
}
