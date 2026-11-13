import { stagingBackend } from './stagingBackend';
import type { RoyalTrack } from '../utils/royalLevels';
export type RoyalEntitlement = {
  track: RoyalTrack;
  level: number;
  badge_key: string;
  frame_key: string;
  earned_at: string;
};
export async function fetchMyRoyalEntitlements(track: RoyalTrack): Promise<RoyalEntitlement[]> {
  if (!stagingBackend) throw new Error('Staging backend not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Authentication required');
  const { data, error } = await stagingBackend.from('royal_reward_entitlements')
    .select('track,level,badge_key,frame_key,earned_at')
    .eq('track',track)
    .eq('subject_id',auth.user.id)
    .order('level',{ ascending: false });
  if (error) throw error;
  return (data ?? []) as RoyalEntitlement[];
}
