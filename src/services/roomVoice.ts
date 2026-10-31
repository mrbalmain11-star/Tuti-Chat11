import { Room, RoomEvent } from 'livekit-client';
import { stagingBackend } from './stagingBackend';
import { RoomMusicPublisher } from './roomMusic';

const music = new RoomMusicPublisher();
let musicRoom: Room | null = null;
export async function playRoomMusic(file: File): Promise<void> {
  if (!musicRoom) throw new Error('اتصال صوت الغرفة غير جاهز');
  await music.play(musicRoom, file);
}
export function pauseRoomMusic(): void { music.pause(); }
export async function resumeRoomMusic(): Promise<void> { await music.resume(); }
export async function stopRoomMusic(): Promise<void> { await music.stop(); }


/** Connects to the existing staging LiveKit authority. Never ships API secrets to Android. */
export async function connectRoomVoice(roomId: string, shouldPublish: () => boolean, onError: (message: string) => void): Promise<{ sync: () => Promise<void>; close: () => Promise<void> }> {
  if (!stagingBackend) throw new Error('Voice backend unavailable');
  const { data, error } = await stagingBackend.functions.invoke('phase2-voice-token', { body: { roomId } });
  if (error || !data?.token || !data?.url) throw new Error(String(data?.error || error?.message || 'Voice token unavailable'));
  // Keep voice playback on the low-latency path; adaptive video features are unnecessary for audio-only rooms.
  const room = new Room({ adaptiveStream: false, dynacast: false });
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
  room.on(RoomEvent.Disconnected, () => { if (!closing) onError('انقطع اتصال الصوت بالغرفة'); });
  // Distinguish network degradation from microphone or playback failures.
  // These events do not restart the microphone or interrupt a working stream.
  room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
    if (closing) return;
    console.info('[RoomVoice] connection quality', {
      participant: participant.identity,
      quality,
      roomId,
    });
  });
  room.on(RoomEvent.Reconnecting, () => {
    if (!closing) console.warn('[RoomVoice] transport reconnecting', { roomId });
  });
  room.on(RoomEvent.Reconnected, () => {
    if (!closing) console.info('[RoomVoice] transport reconnected', { roomId });
  });

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
    closing = true;
    document.removeEventListener('pointerdown', unlockAudio);
    await room.disconnect();
    clearAudio();
    throw error;
  }
  musicRoom = room;
  return { sync, close: async () => {
    if (musicRoom === room) { musicRoom = null; await music.stop(); }
    closing = true;
    document.removeEventListener('pointerdown', unlockAudio);
    await micQueue.catch(() => {});
    await room.disconnect();
    clearAudio();
  } };
}
