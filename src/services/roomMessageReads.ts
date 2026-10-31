import { stagingBackend } from './stagingBackend';
import type { ChatMessage } from '../types';

type MessageRow = {
  id: number | string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function fetchRealRoomMessages(roomId: string, since?: string): Promise<ChatMessage[]> {
  if (!stagingBackend) throw new Error('Staging not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  let query = stagingBackend.from('room_messages')
    .select('id,sender_id,body,created_at')
    .eq('room_id', roomId);
  if (since) query = query.gte('created_at', since);
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = (data ?? []) as MessageRow[];
  const senderIds = [...new Set(rows.map(row => row.sender_id))];
  const { data: profiles, error: profileError } = senderIds.length
    ? await stagingBackend.from('profiles').select('id,display_name,avatar_url').in('id', senderIds)
    : { data: [], error: null };
  if (profileError) throw profileError;
  const names = new Map((profiles ?? []).map(p => [p.id, p]));
  return rows.reverse().map(row => ({
    id: String(row.id),
    senderId: row.sender_id,
    senderName: names.get(row.sender_id)?.display_name ?? '',
    senderAvatar: names.get(row.sender_id)?.avatar_url ?? '',
    text: row.body,
    timestamp: row.created_at,
  }));
}
