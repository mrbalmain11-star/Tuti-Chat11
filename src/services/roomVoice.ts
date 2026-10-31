import { Room, RoomEvent } from 'livekit-client';
import { stagingBackend } from './stagingBackend';

/** Connects to the existing staging LiveKit authority. Never ships API secrets to Android. */
export async function connectRoomVoice(roomId: string, shouldPublish: () => boolean, onError: (message: string) => void): Promise<{ sync: () => Promise<void>; close: () => Promise<void> }> {
  if (!stagingBackend) throw new Error('Voice backend unavailable');
  const { data, error } = await stagingBackend.functions.invoke('phase2-voice-token', { body: { roomId } });
  if (error || !data?.token || !data?.url) throw new Error(String(data?.error || error?.message || 'Voice token unavailable'));
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const audio = new Map<string, HTMLAudioElement>();
  const pendingPlayback = new Set<HTMLAudioElement>();
  let closing = false;
  const retryPlayback = () => {
    for (const element of [...pendingPlayback]) {
      if (!element.isConnected) {
        pendingPlayback.delete(element);
        continue;
      }
      void element.play().then(() => pendingPlayback.delete(element)).catch(() => {});
    }
    if (pendingPlayback.size === 0) document.removeEventListener('pointerdown', retryPlayback);
  };
  const removeAudio = (key: string) => {
    const element = audio.get(key);
    if (!element) return;
    pendingPlayback.delete(element);
    element.pause();
    element.remove();
    audio.delete(key);
    if (pendingPlayback.size === 0) document.removeEventListener('pointerdown', retryPlayback);
  };
  const clearAudio = () => {
    for (const key of [...audio.keys()]) removeAudio(key);
    pendingPlayback.clear();
    document.removeEventListener('pointerdown', retryPlayback);
  };
  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    if (closing || track.kind !== 'audio') return;
    const key = participant.identity + ':' + track.sid;
    removeAudio(key);
    const element = track.attach() as HTMLAudioElement;
    element.autoplay = true;
    element.playsInline = true;
    element.style.display = 'none';
    document.body.appendChild(element);
    audio.set(key, element);
    void element.play().catch(() => {
      if (closing || !element.isConnected) return;
      pendingPlayback.add(element);
      document.addEventListener('pointerdown', retryPlayback);
      onError('اضغط على الشاشة للسماح بتشغيل الصوت');
    });
  });
  room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
    track.detach().forEach(el => el.remove());
    removeAudio(participant.identity + ':' + track.sid);
  });
  room.on(RoomEvent.Disconnected, () => onError('انقطع اتصال الصوت بالغرفة'));
  // Android WebView can require a real user gesture before remote audio playback.
  // Avoid repeatedly calling startAudio from its own status-change event.
  const unlockAudio = () => {
    if (room.canPlaybackAudio) {
      document.removeEventListener('pointerdown', unlockAudio);
      return;
    }
    void room.startAudio().then(() => {
      document.removeEventListener('pointerdown', unlockAudio);
    }).catch(error => onError('تعذر تشغيل الصوت المستلم: ' + String(error)));
  };
  document.addEventListener('pointerdown', unlockAudio);
  try {
    await room.connect(data.url, data.token, { autoSubscribe: true });
  } catch (error) {
    document.removeEventListener('pointerdown', unlockAudio);
    room.disconnect();
    throw error;
  }
  let micQueue: Promise<void> = Promise.resolve();
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
    document.removeEventListener('pointerdown', unlockAudio);
    room.disconnect();
    closing = true;
    clearAudio();
    throw error;
  }
  return { sync, close: async () => {
    closing = true;
    document.removeEventListener('pointerdown', unlockAudio);
    await micQueue.catch(() => {});
    await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
    room.disconnect();
    closing = true;
    clearAudio();
  } };
}
