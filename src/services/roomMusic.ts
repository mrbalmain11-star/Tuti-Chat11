import { LocalAudioTrack, Room, Track } from 'livekit-client';

/**
 * Independent room-music publisher. The existing microphone publisher is untouched.
 * Only the operator's own mic/seat changes should call stop().
 */
export class RoomMusicPublisher {
  private audio: HTMLAudioElement | null = null;
  private context: AudioContext | null = null;
  private track: LocalAudioTrack | null = null;
  private objectUrl: string | null = null;
  private ownerRoom: Room | null = null;

  async play(room: Room, file: File): Promise<void> {
    await this.stop();
    if (!file.type.startsWith('audio/')) throw new Error('اختر ملفاً صوتياً');
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.preload = 'auto';
    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const destination = context.createMediaStreamDestination();
    // Route to LiveKit only: avoid playing a second local copy and causing echo.
    source.connect(destination);
    const mediaTrack = destination.stream.getAudioTracks()[0];
    if (!mediaTrack) {
      await context.close();
      URL.revokeObjectURL(url);
      throw new Error('تعذر تجهيز مسار الموسيقى');
    }
    const track = new LocalAudioTrack(mediaTrack);
    this.audio = audio;
    this.context = context;
    this.track = track;
    this.objectUrl = url;
    this.ownerRoom = room;
    audio.onended = () => { void this.stop(); };
    try {
      await context.resume();
      await room.localParticipant.publishTrack(track, {
        name: 'totichat-room-music',
        source: Track.Source.Unknown,
      });
      await audio.play();
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  pause(): void { this.audio?.pause(); }
  async resume(): Promise<void> { await this.audio?.play(); }
  get isPlaying(): boolean { return Boolean(this.audio && !this.audio.paused); }

  async stop(): Promise<void> {
    const room = this.ownerRoom;
    const track = this.track;
    const audio = this.audio;
    const context = this.context;
    const url = this.objectUrl;
    this.ownerRoom = null;
    this.track = null;
    this.audio = null;
    this.context = null;
    this.objectUrl = null;
    if (audio) { audio.onended = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }
    if (room && track) {
      try { await room.localParticipant.unpublishTrack(track); } catch (error) {
        console.warn('[RoomMusic] unpublish failed', error);
      }
    }
    track?.stop();
    if (context && context.state !== 'closed') await context.close();
    if (url) URL.revokeObjectURL(url);
  }
}
