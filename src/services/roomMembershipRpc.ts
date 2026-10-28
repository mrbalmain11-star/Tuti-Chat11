import { stagingBackend } from './stagingBackend';

export async function reserveSeat(roomId: string, seatNumber: number): Promise<number> {
  if (!stagingBackend) throw new Error('Staging not configured');
  if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > 15) {
    throw new Error('Invalid seat number');
  }
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await stagingBackend.rpc('phase2_room_take_seat', {
    p_room_id: roomId,
    p_seat: seatNumber,
  });
  if (error) throw error;
  if (data !== seatNumber) throw new Error('Reservation not confirmed');
  return data;
}

export async function joinRoomMembership(roomId: string): Promise<void> {
  if (!stagingBackend) throw new Error('Staging not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await stagingBackend.rpc('phase2_room_join', {
    p_room_id: roomId,
  });
  if (error) throw error;
  if (data !== true) throw new Error('Room join not confirmed');
}

export async function leaveRoomMembership(roomId: string): Promise<void> {
  if (!stagingBackend) throw new Error('Staging not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await stagingBackend.rpc('phase2_room_leave', {
    p_room_id: roomId,
  });
  if (error) throw error;
  if (data !== true) throw new Error('Room leave not confirmed');
}

export async function sendRealRoomMessage(roomId: string, body: string): Promise<number> {
  if (!stagingBackend) throw new Error('Staging not configured');
  const text = body.trim();
  if (!text || text.length > 1000) throw new Error('Invalid message length');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await stagingBackend.rpc('phase2_room_send_message', {
    p_room_id: roomId,
    p_body: text,
  });
  if (error) throw error;
  if (!Number.isSafeInteger(data) || data <= 0) throw new Error('Message not confirmed');
  return data;
}

export async function setMyRoomMute(roomId: string, muted: boolean): Promise<boolean> {
  if (!stagingBackend) throw new Error('Staging not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await stagingBackend.rpc('phase2_room_set_muted', {
    p_room_id: roomId,
    p_muted: muted,
  });
  if (error) throw error;
  if (data !== muted) throw new Error('Mute update not confirmed');
  return data;
}

/** Release only the authenticated user's own seat; server verifies membership. */
export async function releaseMySeat(roomId: string): Promise<void> {
  if (!stagingBackend) throw new Error('Staging not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await stagingBackend.rpc('phase2_room_take_seat', {
    p_room_id: roomId,
    p_seat: null,
  });
  if (error) throw error;
  if (data !== null) throw new Error('Seat release not confirmed');
}
