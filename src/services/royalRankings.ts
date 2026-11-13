import { stagingBackend } from './stagingBackend';
import type { RoyalTrack } from '../utils/royalLevels';
export type RoyalRankingEntry = {
  public_id: number;
  display_name: string;
  lifetime_xp: string;
};
export async function fetchRoyalRankings(track: RoyalTrack): Promise<RoyalRankingEntry[]> {
  if (!stagingBackend) throw new Error('Staging backend not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Authentication required');
  const { data, error } = await stagingBackend.rpc('staging_royal_rankings', {
    p_track: track, p_limit: 20,
  });
  if (error) throw error;
  if (!data || !Array.isArray(data.entries) || data.track !== track) throw new Error('Invalid ranking response');
  return data.entries.map((row: Record<string, unknown>) => {
    if (!/^\d+$/.test(String(row.lifetime_xp)) || !Number.isInteger(Number(row.public_id))) {
      throw new Error('Invalid ranking row');
    }
    return {
      public_id: Number(row.public_id),
      display_name: String(row.display_name ?? 'مستخدم'),
      lifetime_xp: String(row.lifetime_xp),
    };
  });
}
