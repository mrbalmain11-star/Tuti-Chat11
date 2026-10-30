import 'package:flutter_test/flutter_test.dart';
import '../cinematic_gift_catalog.dart';

void main() {
  test('all cinematic gifts cost at least 10000 coins', () {
    expect(cinematicGiftCatalog, hasLength(6));
    for (final gift in cinematicGiftCatalog) {
      expect(gift.coins, greaterThanOrEqualTo(10000), reason: gift.title);
      expect(gift.publicBannerEligible, isTrue, reason: gift.title);
    }
  });

  test('approved gifts have distinct increasing premium prices', () {
    final byId = {for (final gift in cinematicGiftCatalog) gift.id: gift.coins};
    expect(byId[CinematicGiftId.zulfiqar], 10000);
    expect(byId[CinematicGiftId.imperialFalcon], 15000);
    expect(byId[CinematicGiftId.royalThrone], 25000);
    expect(byId[CinematicGiftId.royalLoversHeart], 30000);
    expect(byId[CinematicGiftId.legendaryDragon], 50000);
    expect(byId[CinematicGiftId.royalJet], 75000);
    expect(byId.values.toSet(), hasLength(6));
  });

  test('approved gift quantity choices are preserved', () {
    expect(giftQuantityOptions, [1, 7, 17, 77, 777]);
  });

  test('duplicate verified gift transaction is not displayed twice', () {
    final deduplicator = GiftEventDeduplicator();
    const event = VerifiedCinematicGiftEvent(
      transactionId: 'transaction-123',
      roomId: 'room-1',
      senderName: 'sender',
      recipientName: 'recipient',
      giftId: CinematicGiftId.zulfiqar,
      quantity: 1,
    );
    expect(deduplicator.accept(event), isTrue);
    expect(deduplicator.accept(event), isFalse);
  });
}
