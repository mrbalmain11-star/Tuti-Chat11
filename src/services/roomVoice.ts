import { Room, RoomEvent } from 'livekit-client';
import { stagingBackend } from './stagingBackend';

/** Connects to the existing staging LiveKit authority. Never ships API secrets to Android. */
export async function connectRoomVoice(roomId: string, shouldPublish: () => boolean, onError: (message: string) => void): Promise<{ sync: () => Promise<void>; close: () => Promise<void> }> {
  if (!stagingBackend) throw new Error('Voice backend unavailable');
  const { data, error } = await stagingBackend.functions.invoke('phase2-voice-token', { body: { roomId } });
  if (error || !data?.token || !data?.url) throw new Error(String(data?.error || error?.message || 'Voice token unavailable'));
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const audio = new Map<string, HTMLAudioElement>();
  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    if (track.kind !== 'audio') return;
    const element = track.attach() as HTMLAudioElement;
    element.autoplay = true;
    element.style.display = 'none';
    document.body.appendChild(element);
    audio.set(participant.identity + ':' + track.sid, element);
    void element.play().catch(() => onError('اضغط على الشاشة للسماح بتشغيل الصوت'));
  });
  room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
    track.detach().forEach(el => el.remove());
    audio.delete(participant.identity + ':' + track.sid);
  });
  room.on(RoomEvent.Disconnected, () => onError('انقطع اتصال الصوت بالغرفة'));
  room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
    if (!room.canPlaybackAudio) {
      void room.startAudio().catch(error => onError('تعذر تشغيل الصوت المستلم: ' + String(error)));
    }
  });
  await room.connect(data.url, data.token, { autoSubscribe: true });
  let micQueue: Promise<void> = Promise.resolve();
  let closing = false;
  const sync = (): Promise<void> => {
    micQueue = micQueue.catch(() => {}).then(async () => {
      if (closing) return;
      const publish = Boolean(data.canPublish && shouldPublish());
      if (room.localParticipant.isMicrophoneEnabled === publish) return;
      try {
        await room.localParticipant.setMicrophoneEnabled(publish);
      } catch (error) {
        const name = error instanceof Error ? error.name : 'UnknownError';
        const detail = error instanceof Error ? error.message : String(error);
        const devices = navigator.mediaDevices;
        const context = !devices?.getUserMedia ? ' [getUserMedia unavailable]' : '';
        onError('فشل تشغيل الميكروفون [' + name + ']: ' + detail + context);
        // Android WebView may reject capture before runtime permission is granted.
        // Do not silently report a successful unmute.
        throw error;
      }
    });
    return micQueue;
  };
  try {
    await sync();
  } catch (error) {
    // A failed Android capture must not leave a LiveKit connection alive.
    await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
    room.disconnect();
    audio.forEach(el => el.remove());
    audio.clear();
    throw error;
  }
  return { sync, close: async () => {
    closing = true;
    await micQueue.catch(() => {});
    await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
    room.disconnect();
    audio.forEach(el => el.remove());
    audio.clear();
  } };
}
