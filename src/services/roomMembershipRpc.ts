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
