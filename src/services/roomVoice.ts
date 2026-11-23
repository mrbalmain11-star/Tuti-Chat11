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
export async function connectRoomVoice(roomId: string, shouldPublish: () => boolean, onError: (message: string) => void): Promise<{ canPublish: boolean; sync: () => Promise<void>; close: () => Promise<void> }> {
  if (!stagingBackend) throw new Error('Voice backend unavailable');
  // Seat assignment and unmute are separate database writes. A token requested
  // between them is listen-only, even if the UI has already enabled the mic.
  // Wait for the server to confirm publish rights before joining LiveKit.
  let data: { token?: string; url?: string; canPublish?: boolean; error?: string } | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await stagingBackend.functions.invoke('phase2-voice-token', { body: { roomId } });
    data = response.data;
    if (response.error || !data?.token || !data?.url) {
      throw new Error(String(data?.error || response.error?.message || 'Voice token unavailable'));
    }
    if (!shouldPublish() || data.canPublish === true) break;
    if (attempt === 3) {
      onError('الخادم لم يمنح صلاحية الميكروفون بعد تأكيد المقعد؛ يرجى إعادة فتح المايك');
      break;
    }
    await new Promise<void>(resolve => setTimeout(resolve, 350 * (attempt + 1)));
  }
  if (!data?.token || !data.url) throw new Error('Voice token unavailable');
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
      void element.play().then(() => {
        pendingPlayback.delete(element);
        if (pendingPlayback.size === 0) document.removeEventListener('pointerup', retryPlayback);
      }).catch(() => {});
    }
    if (pendingPlayback.size === 0) document.removeEventListener('pointerup', retryPlayback);
  };
  const removeAudio = (key: string) => {
    const element = audio.get(key);
    if (!element) return;
    pendingPlayback.delete(element);
    element.pause();
    element.remove();
    audio.delete(key);
    if (pendingPlayback.size === 0) document.removeEventListener('pointerup', retryPlayback);
  };
  const clearAudio = () => {
    for (const key of [...audio.keys()]) removeAudio(key);
    pendingPlayback.clear();
    document.removeEventListener('pointerup', retryPlayback);
  };
  room.on(RoomEvent.LocalTrackPublished, publication => {
    console.info('[RoomVoice] local track published', { roomId, kind: publication.kind, source: publication.source });
  });
  room.on(RoomEvent.TrackSubscriptionFailed, (trackSid, participant, error) => {
    console.error('[RoomVoice] remote track subscription failed', { roomId, trackSid, participant: participant.identity, error });
    if (!closing) onError('تعذر استقبال المسار الصوتي من الخادم');
  });
  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    console.info('[RoomVoice] remote track subscribed', { roomId, kind: track.kind, participant: participant.identity });
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
      document.addEventListener('pointerup', retryPlayback);
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
      document.removeEventListener('pointerup', unlockAudio);
      return;
    }
    void room.startAudio().then(() => {
      document.removeEventListener('pointerup', unlockAudio);
    }).catch(error => onError('تعذر تشغيل الصوت المستلم: ' + String(error)));
  };
  document.addEventListener('pointerup', unlockAudio);
  try {
    await room.connect(data.url, data.token, { autoSubscribe: true });
  } catch (error) {
    document.removeEventListener('pointerup', unlockAudio);
    closing = true;
    clearAudio();
    await room.disconnect().catch(() => {});
    throw error;
  }
  let micQueue: Promise<void> = Promise.resolve();
  let micRetryPending = false;
  const retryMicOnGesture = () => {
    if (closing || !micRetryPending || !shouldPublish()) return;
    micRetryPending = false;
    void sync().catch(() => {});
  };
  const sync = (): Promise<void> => {
    micQueue = micQueue.catch(() => {}).then(async () => {
      if (closing) return;
      const publish = Boolean(data.canPublish && shouldPublish());
      if (room.localParticipant.isMicrophoneEnabled === publish) return;
      try {
        await room.localParticipant.setMicrophoneEnabled(publish);
        console.info('[RoomVoice] microphone publication state', { roomId, requested: publish, enabled: room.localParticipant.isMicrophoneEnabled, tokenCanPublish: data.canPublish });
        if (publish) {
          micRetryPending = false;
          document.removeEventListener('pointerup', retryMicOnGesture);
        }
      } catch (error) {
        const name = error instanceof Error ? error.name : 'UnknownError';
        const detail = error instanceof Error ? error.message : String(error);
        const devices = navigator.mediaDevices;
        const context = !devices?.getUserMedia ? ' [getUserMedia unavailable]' : '';
        console.warn('[RoomVoice] microphone capture failed:', name, detail + context);
        onError(name === 'NotAllowedError'
          ? 'تعذّر الوصول للمايك. تأكد من سماح إذن الميكروفون للتطبيق.'
          : 'تعذّر تشغيل المايك. اضغط على الشاشة لإعادة المحاولة.');
        // Keep receiving room audio if Android microphone capture fails.
        // Retry publishing only after a fresh user gesture; never reconnect the room.
        if (publish && !closing) {
          micRetryPending = true;
          document.addEventListener('pointerup', retryMicOnGesture);
        }
        throw error;
      }
    });
    return micQueue;
  };
  // Microphone capture can fail on Android even when the remote audio connection works.
  // Preserve listening and let the next tap retry the microphone on the same room.
  await sync().catch(error => console.warn('[RoomVoice] microphone pending gesture retry', error));
  musicRoom = room;
  return { canPublish: data.canPublish === true, sync, close: async () => {
    closing = true;
    if (musicRoom === room) { musicRoom = null; await music.stop(); }
    document.removeEventListener('pointerup', unlockAudio);
    document.removeEventListener('pointerup', retryMicOnGesture);
    micRetryPending = false;
    await micQueue.catch(() => {});
    await room.disconnect();
    clearAudio();
  } };
}
