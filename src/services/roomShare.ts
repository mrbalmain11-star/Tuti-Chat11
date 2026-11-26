import { imageUrl } from './imageUrl';
import { stagingBackend, type BackendRoom } from './stagingBackend';

const marker = 'TotiChat · مشاركة غرفة · ';
const roomScheme = 'com.numyar.totichat.staging:';
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export type SharedRoom = BackendRoom & { members: number };
export type SharePeer = { id: string; display_name: string; avatar_url: string | null; public_id: number | null; special_id: string | null };

export function sharedRoomMessageId(text: string): string | null {
  if (!text.startsWith(marker)) return null;
  const id = text.slice(marker.length);
  return uuid.test(id) ? id : null;
}

export function nativeRoomLinkId(raw: string): string | null {
  try {
    const url = new URL(raw);
    const id = url.pathname.slice(1);
    return url.protocol === roomScheme && url.host === 'room' && !url.search && !url.hash && uuid.test(id) ? id : null;
  } catch { return null; }
}

export function makeRoomShareLink(id: string): string {
  if (!uuid.test(id)) throw new Error('Invalid room ID');
  return roomScheme + '//room/' + id;
}

export async function fetchSharedRoom(id: string): Promise<SharedRoom | null> {
  if (!stagingBackend || !uuid.test(id)) throw new Error('Room unavailable');
  const { data, error } = await stagingBackend.rpc('shared_room_info', { p_room: id });
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    owner_avatar: imageUrl(data.owner_avatar),
    cover_url: imageUrl(data.cover_path, 'totichat-room-images'),
    background_url: imageUrl(data.background_path, 'totichat-room-images'),
  };
}

export async function fetchRoomSharePeers(): Promise<SharePeer[]> {
  if (!stagingBackend) throw new Error('Chat unavailable');
  const { data, error } = await stagingBackend.rpc('room_share_targets');
  if (error || !Array.isArray(data)) throw error ?? new Error('Chat unavailable');
  return data;
}

export async function sendRoomShare(roomId: string, peerId: string, nonce: string): Promise<string> {
  if (!stagingBackend) throw new Error('Chat unavailable');
  const { data, error } = await stagingBackend.rpc('room_share_send', { p_room: roomId, p_to: peerId, p_nonce: nonce });
  if (error || data == null) throw error ?? new Error('Message not confirmed');
  if (import.meta.env.VITE_ENABLE_DM_PUSH === 'true') {
    void stagingBackend.functions.invoke('send-direct-message-push', { body: { messageId: String(data) } }).catch(console.warn);
  }
  return String(data);
}
