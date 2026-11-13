import { stagingBackend } from './stagingBackend';

/** Read-only staging RPC. Values are strings to preserve bigint precision. */
export type VerifiedRoyalXp = {
  wealth_lifetime_xp: string;
  charm_lifetime_xp: string;
  source: 'verified_completed_gift_events';
  historical_coverage: string;
};
export async function fetchMyVerifiedRoyalXp(): Promise<VerifiedRoyalXp> {
  if (!stagingBackend) throw new Error('Staging backend not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Authentication required');
  const { data, error } = await stagingBackend.rpc('staging_my_royal_xp');
  if (error) throw error;
  if (!data || !/^\d+$/.test(String(data.wealth_lifetime_xp)) || !/^\d+$/.test(String(data.charm_lifetime_xp))) {
    throw new Error('Invalid verified XP response');
  }
  return {
    wealth_lifetime_xp: String(data.wealth_lifetime_xp),
    charm_lifetime_xp: String(data.charm_lifetime_xp),
    source: 'verified_completed_gift_events',
    historical_coverage: String(data.historical_coverage ?? 'staging_only'),
  };
}
export async function fetchVerifiedRoomRoyalXp(roomId: string): Promise<string> {
  if (!stagingBackend) throw new Error('Staging backend not configured');
  const { data, error } = await stagingBackend.rpc('staging_room_royal_xp', { p_room_id: roomId });
  if (error) throw error;
  if (!data || !/^\d+$/.test(String(data.room_lifetime_xp))) throw new Error('Invalid room XP response');
  return String(data.room_lifetime_xp);
}
