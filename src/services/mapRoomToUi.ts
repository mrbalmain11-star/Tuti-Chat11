import type { VoiceRoom } from '../types';
import type { BackendRoom } from './stagingBackend';

export function mapRoomToUi(room: BackendRoom): VoiceRoom {
  return {
    id: room.id,
    publicId: room.public_id,
    title: room.title,
    hostId: room.owner_id,
    hostName: '',
    hostAvatar: '',
    coverImage: '',
    rank: 0,
    country: '',
    countryFlag: '',
    listenersCount: 0,
    activeMicCount: 0,
    tag: '',
    agencyName: '',
    frameType: 'gold',
    memberAvatars: [],
    announcement: room.welcome_message,
    seats: Array.from({ length: 15 }, (_, i) => ({
      seatNumber: i + 1, user: null, isLocked: false, isMuted: true, isSpeaking: false,
    })),
    backgroundUrl: room.background_url ?? '',
  };
}
