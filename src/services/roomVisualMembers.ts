import { stagingBackend } from './stagingBackend';

export interface RoomVisualMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  seat_no: number | null;
  is_muted: boolean;
  vip_level: number;
}

export async function fetchRoomVisualMembers(roomId: string): Promise<RoomVisualMember[]> {
  if (!stagingBackend) throw new Error('Staging not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await stagingBackend.rpc('phase2_room_members_visual', {
    p_room_id: roomId,
  });
  if (error) throw error;
  return (data ?? []) as RoomVisualMember[];
}
