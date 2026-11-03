import { Room, RoomEvent } from 'livekit-client';
import { stagingBackend } from './stagingBackend';
import { RoomMusicPublisher } from './roomMusic';

// Music is a separate LiveKit participant. Never alter the voice participant.
let musicRoom: Room | null = null;
const publisher = new RoomMusicPublisher();
let generation = 0;
export async function playRoomMusic(roomId: string, file: File): Promise<void> {
  if (!stagingBackend) throw new Error('خدمة الموسيقى غير متاحة');
  const current = ++generation;
  await stopCurrentMusic();
  const { data, error } = await stagingBackend.functions.invoke('phase2-music-token', { body: { roomId } });
  if (error || !data?.token || !data?.url) throw new Error(String(data?.error || error?.message || 'تعذر الحصول على تصريح الموسيقى'));
  if (current !== generation) return;
  const room = new Room({ adaptiveStream: false, dynacast: false });
  try {
    await room.connect(data.url, data.token, { autoSubscribe: false });
    if (current !== generation) { await room.disconnect(); return; }
    musicRoom = room;
    room.on(RoomEvent.Disconnected, () => { if (musicRoom === room) void stopRoomMusic(); });
    await publisher.play(room, file);
    if (current !== generation) await stopCurrentMusic();
  } catch (cause) {
    if (musicRoom === room) await stopCurrentMusic();
    else await room.disconnect();
    throw cause;
  }
}
async function stopCurrentMusic(): Promise<void> {
  const room = musicRoom;
  musicRoom = null;
  try { await publisher.stop(); } finally { if (room) await room.disconnect(); }
}
export function pauseRoomMusic(): void { publisher.pause(); }
export async function resumeRoomMusic(): Promise<void> { await publisher.resume(); }
export async function stopRoomMusic(): Promise<void> { ++generation; await stopCurrentMusic(); }
