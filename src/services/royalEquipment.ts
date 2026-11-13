import { stagingBackend } from './stagingBackend';
import type { RoyalTrack } from '../utils/royalLevels';

export type EquippedRoyalFrame = {
  scope: 'personal' | 'room';
  subject_id: string;
  track: RoyalTrack;
  level: number;
};
async function currentId(): Promise<string> {
  if (!stagingBackend) throw new Error('Staging backend not configured');
  const { data, error } = await stagingBackend.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Authentication required');
  return data.user.id;
}
export async function fetchEquippedRoyalFrame(scope: 'personal' | 'room', subjectId: string): Promise<EquippedRoyalFrame | null> {
  await currentId();
  const { data, error } = await stagingBackend!.from('royal_equipped_frames')
    .select('scope,subject_id,track,level').eq('scope',scope).eq('subject_id',subjectId).maybeSingle();
  if (error) throw error;
  return data as EquippedRoyalFrame | null;
}
export async function equipEarnedRoyalFrame(track: RoyalTrack, level: number, roomId?: string): Promise<EquippedRoyalFrame> {
  const userId = await currentId();
  if (!Number.isInteger(level) || level < 1 || level > 200) throw new Error('Invalid royal level');
  if (track === 'room' && !roomId) throw new Error('Room UUID required');
  if (track !== 'room' && roomId) throw new Error('Personal frame must not use room UUID');
  const scope = track === 'room' ? 'room' : 'personal';
  const subject_id = roomId ?? userId;
  const { data, error } = await stagingBackend!.from('royal_equipped_frames')
    .upsert({ scope, subject_id, track, level, updated_at: new Date().toISOString() }, { onConflict: 'scope,subject_id' })
    .select('scope,subject_id,track,level').single();
  if (error) throw error;
  return data as EquippedRoyalFrame;
}
