import { useEffect, useState } from 'react';
import { getStorageAsset } from '../data/storageItems';
import { stagingBackend } from './stagingBackend';

type Arrival = { roomId: string; userId: string; mountUrl: string | null; entranceUrl: string | null };

export function useRoomDecorations(roomId: string | undefined, userId: string) {
  const [background, setBackground] = useState<{ roomId: string; url: string } | null>(null);
  const [arrival, setArrival] = useState<Arrival | null>(null);
  useEffect(() => {
    setBackground(null);
    setArrival(null);
    if (!roomId || !stagingBackend) return;
    const client = stagingBackend;
    let active = true;
    let backgroundRequest = 0;
    let backgroundExpiry: number | undefined;
    let arrivalTimeout: number | undefined;
    const start = Date.now();
    const seen = new Set<string>();
    const refreshBackground = async () => {
      const request = ++backgroundRequest;
      const { data, error } = await client.from('store_room_backgrounds')
        .select('asset_url,expires_at').eq('room_id', roomId).maybeSingle();
      if (!active || error || request !== backgroundRequest) return;
      const url = getStorageAsset('', data?.asset_url ?? null);
      setBackground(url ? { roomId, url } : null);
      window.clearTimeout(backgroundExpiry);
      if (data?.expires_at) {
        const remaining = new Date(data.expires_at).getTime() - Date.now();
        if (remaining <= 0) setBackground(null);
        else if (remaining <= 2147483647) backgroundExpiry = window.setTimeout(refreshBackground, remaining + 100);
      }
    };
    const showArrival = (row: Record<string, unknown>, bootstrap = false) => {
      const joinedAt = Date.parse(String(row.joined_at));
      if (typeof row.user_id !== 'string' || !Number.isFinite(joinedAt)
        || joinedAt < start - (bootstrap ? 15000 : 5000)) return;
      const key = row.user_id + ':' + row.joined_at;
      if (seen.has(key)) return;
      seen.add(key);
      const mountUrl = getStorageAsset('', typeof row.decoration_mount_url === 'string' ? row.decoration_mount_url : null);
      const entranceUrl = getStorageAsset('', typeof row.decoration_entrance_url === 'string' ? row.decoration_entrance_url : null);
      if (!mountUrl && !entranceUrl) return;
      setArrival({ roomId, userId: row.user_id, mountUrl, entranceUrl });
      window.clearTimeout(arrivalTimeout);
      arrivalTimeout = window.setTimeout(() => setArrival(null), 6500);
    };
    const fetchOwnArrival = async () => {
      const { data } = await client.from('room_members').select('user_id,joined_at,decoration_mount_url,decoration_entrance_url')
        .eq('room_id', roomId).eq('user_id', userId).maybeSingle();
      if (active && data) showArrival(data, true);
    };
    void refreshBackground();
    const channel = client.channel('store-room-decorations-' + roomId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: 'room_id=eq.' + roomId },
        event => { if (event.eventType !== 'DELETE') showArrival(event.new); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_room_backgrounds', filter: 'room_id=eq.' + roomId },
        () => { void refreshBackground(); })
      .subscribe(status => { if (status === 'SUBSCRIBED') { void fetchOwnArrival(); void refreshBackground(); } });
    void fetchOwnArrival();
    const poll = window.setInterval(refreshBackground, 30000);
    window.addEventListener('totichat:room-decoration-changed', refreshBackground);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearTimeout(backgroundExpiry);
      window.clearTimeout(arrivalTimeout);
      window.removeEventListener('totichat:room-decoration-changed', refreshBackground);
      void client.removeChannel(channel);
    };
  }, [roomId, userId]);
  return {
    backgroundUrl: background?.roomId === roomId ? background?.url : null,
    arrival: arrival?.roomId === roomId ? arrival : null,
  };
}
