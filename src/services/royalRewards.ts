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

export async function fetchOwnedRoomRoyalEntitlements(roomId: string): Promise<RoyalEntitlement[]> {
  if (!stagingBackend) throw new Error('Staging backend not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Authentication required');
  const { data: room, error: roomError } = await stagingBackend.from('rooms')
    .select('id').eq('id', roomId).eq('owner_id', auth.user.id).maybeSingle();
  if (roomError) throw roomError;
  if (!room) throw new Error('Room is not owned by current user');
  const { data, error } = await stagingBackend.from('royal_reward_entitlements')
    .select('track,level,badge_key,frame_key,earned_at')
    .eq('track', 'room').eq('subject_id', roomId)
    .order('level', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RoyalEntitlement[];
}
