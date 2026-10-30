import 'package:flutter/material.dart';
import 'cinematic_gift_catalog.dart';

/// Premium in-room gift announcement. Use a verified gift event only.
/// Tap handler is provided by the room router; this widget never navigates
/// to an unverified room itself.
class CinematicGiftBanner extends StatefulWidget {
  const CinematicGiftBanner({
    super.key,
    required this.event,
    this.onOpenSourceRoom,
    this.senderAvatar,
    this.recipientAvatar,
  });

  final VerifiedCinematicGiftEvent event;
  final VoidCallback? onOpenSourceRoom;
  final ImageProvider? senderAvatar;
  final ImageProvider? recipientAvatar;

  @override
  State<CinematicGiftBanner> createState() => _CinematicGiftBannerState();
}

class _CinematicGiftBannerState extends State<CinematicGiftBanner>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 4800),
  )..forward();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gift = cinematicGiftCatalog.firstWhere(
      (gift) => gift.id == widget.event.giftId,
    );
    final color = Color(gift.primaryColor);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        // Right-to-left ticker with a hold for readability.
        final dx = t < .14
            ? (1 - Curves.easeOutCubic.transform(t / .14)) * 1.25
            : t > .76
                ? -Curves.easeInCubic.transform((t - .76) / .24) * 1.25
                : 0.0;
        final opacity = t < .14
            ? (t / .14).clamp(0.0, 1.0)
            : t > .76
                ? ((1 - t) / .24).clamp(0.0, 1.0)
                : 1.0;
        return FractionalTranslation(
          translation: Offset(dx, 0),
          child: Opacity(opacity: opacity, child: child),
        );
      },
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.onOpenSourceRoom,
              borderRadius: BorderRadius.circular(26),
              child: Container(
                constraints: const BoxConstraints(minHeight: 70),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                    const Color(0xFF101322),
                    color.withValues(alpha: .45),
                    const Color(0xFF101322),
                  ]),
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(color: const Color(0xFFFFD783), width: 1.4),
                  boxShadow: [
                    BoxShadow(color: color.withValues(alpha: .38), blurRadius: 18),
                  ],
                ),
                child: Row(
                  textDirection: TextDirection.rtl,
                  children: [
                    _GiftAvatar(image: widget.senderAvatar, color: color),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            '${widget.event.senderName} أهدى ${widget.event.recipientName}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textDirection: TextDirection.rtl,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '${gift.title}  •  ${gift.coins} عملة',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textDirection: TextDirection.rtl,
                            style: const TextStyle(
                              color: Color(0xFFFFDE8D),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    _GiftAvatar(image: widget.recipientAvatar, color: color),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _GiftAvatar extends StatelessWidget {
  const _GiftAvatar({required this.image, required this.color});
  final ImageProvider? image;
  final Color color;

  @override
  Widget build(BuildContext context) => CircleAvatar(
        radius: 22,
        backgroundColor: color,
        child: CircleAvatar(
          radius: 19,
          backgroundColor: const Color(0xFF17231C),
          backgroundImage: image,
          child: image == null
              ? const Icon(Icons.person, color: Color(0xFFFFE3A5))
              : null,
        ),
      );
}
