import { roomCountries, roomCountryCode } from '../data/roomCountries';
import type { VoiceRoom } from '../types';
import type { BackendRoom } from './stagingBackend';

export function mapRoomToUi(room: BackendRoom): VoiceRoom {
  const country = roomCountries.find(option => option.code === roomCountryCode(room.owner_country));
  return {
    id: room.id,
    publicId: room.public_id,
    title: room.title,
    accessLocked: room.access_locked,
    hostId: room.owner_id,
    hostName: room.owner_name ?? '',
    hostAvatar: room.owner_avatar ?? '',
    coverImage: room.cover_url ?? '',
    rank: 0,
    country: country?.name ?? '',
    countryFlag: country?.flag ?? '',
    listenersCount: 0,
    activeMicCount: 0,
    tag: room.tag ?? '',
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
