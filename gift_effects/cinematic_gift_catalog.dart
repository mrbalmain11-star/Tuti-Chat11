/// TotiChat cinematic gift definitions.
/// Catalog metadata only. Do not charge coins on the client.
/// The server must authorize the gift and emit a verified room event.
enum CinematicGiftId {
  zulfiqar,
  imperialFalcon,
  royalThrone,
  legendaryDragon,
  royalJet,
  royalLoversHeart,
}

class CinematicGift {
  const CinematicGift({
    required this.id,
    required this.title,
    required this.coins,
    required this.duration,
    required this.effectKey,
    required this.primaryColor,
  });
  final CinematicGiftId id;
  final String title;
  final int coins;
  final Duration duration;
  final String effectKey;
  final int primaryColor;
  bool get publicBannerEligible => coins >= 7000;
}

const cinematicGiftCatalog = <CinematicGift>[
  CinematicGift(
    id: CinematicGiftId.zulfiqar,
    title: 'سيف ذو الفقار',
    coins: 10000,
    duration: Duration(seconds: 7),
    effectKey: 'sword_descend',
    primaryColor: 0xFF1B9B5A,
  ),
  CinematicGift(
    id: CinematicGiftId.imperialFalcon,
    title: 'الصقر الإمبراطوري',
    coins: 15000,
    duration: Duration(seconds: 7),
    effectKey: 'falcon_flight',
    primaryColor: 0xFFFFD276,
  ),
  CinematicGift(
    id: CinematicGiftId.royalThrone,
    title: 'عرش الملوك',
    coins: 25000,
    duration: Duration(seconds: 7),
    effectKey: 'palace_reveal',
    primaryColor: 0xFFDFB85E,
  ),
  CinematicGift(
    id: CinematicGiftId.legendaryDragon,
    title: 'التنين الأسطوري',
    coins: 50000,
    duration: Duration(seconds: 7),
    effectKey: 'dragon_fire',
    primaryColor: 0xFFE05C35,
  ),
  CinematicGift(
    id: CinematicGiftId.royalJet,
    title: 'الطائرة الملكية',
    coins: 75000,
    duration: Duration(seconds: 7),
    effectKey: 'jet_clouds',
    primaryColor: 0xFF90B5E8,
  ),
  CinematicGift(
    id: CinematicGiftId.royalLoversHeart,
    title: 'قلب العشاق الملكي',
    coins: 30000,
    duration: Duration(seconds: 7),
    effectKey: 'ruby_heart_wings',
    primaryColor: 0xFFEC638B,
  ),
];

const giftQuantityOptions = <int>[1, 7, 17, 77, 777];

/// Presentation event. Construct ONLY from a server-verified transaction,
/// not from a locally simulated purchase or an untrusted realtime payload.
class VerifiedCinematicGiftEvent {
  const VerifiedCinematicGiftEvent({
    required this.transactionId,
    required this.roomId,
    required this.senderName,
    required this.recipientName,
    required this.giftId,
    required this.quantity,
  });
  final String transactionId;
  final String roomId;
  final String senderName;
  final String recipientName;
  final CinematicGiftId giftId;
  final int quantity;
}

/// Room-level duplicate suppression for replayed realtime events.
class GiftEventDeduplicator {
  final Set<String> _seen = {};
  bool accept(VerifiedCinematicGiftEvent event) =>
      _seen.add(event.transactionId);
  void reset() => _seen.clear();
}
