import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Prototype overlay for TotiChat's approved full-screen Zulfiqar gift.
/// Add this widget to the room Stack when a verified gift event arrives.
/// This is a Flutter-drawn motion prototype, not the final cinematic 3D asset.
class ZulfiqarGiftOverlay extends StatefulWidget {
  const ZulfiqarGiftOverlay({
    super.key,
    required this.senderName,
    required this.recipientName,
    this.onFinished,
  });
  final String senderName;
  final String recipientName;
  final VoidCallback? onFinished;

  @override
  State<ZulfiqarGiftOverlay> createState() => _ZulfiqarGiftOverlayState();
}

class _ZulfiqarGiftOverlayState extends State<ZulfiqarGiftOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 7),
  )..forward().whenComplete(() => widget.onFinished?.call());

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            final t = _controller.value;
            final entrance = Curves.easeOutCubic.transform((t / .38).clamp(0.0, 1.0));
            final fade = ((1 - t) / .16).clamp(0.0, 1.0);
            final glow = .55 + .45 * math.sin(t * math.pi * 12).abs();
            return Opacity(
              opacity: fade,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(color: Colors.black.withValues(alpha: .66 * entrance)),
                  Container(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(colors: [
                        const Color(0xFF1F9C57).withValues(alpha: .35 * glow),
                        Colors.transparent,
                      ]),
                    ),
                  ),
                  Transform.translate(
                    offset: Offset(0, -MediaQuery.sizeOf(context).height * .95 * (1 - entrance)),
                    child: Transform.rotate(
                      angle: math.sin(t * math.pi * 4) * .035,
                      child: SizedBox(
                        height: 330,
                        width: 170,
                        child: CustomPaint(painter: _SwordPainter(glow)),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 92,
                    left: 16,
                    right: 16,
                    child: Opacity(
                      opacity: ((t - .24) / .15).clamp(0.0, 1.0),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: const Color(0xFF10281C).withValues(alpha: .95),
                          border: Border.all(color: const Color(0xFFFFD675), width: 1.5),
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: const [BoxShadow(color: Color(0x8871DCA0), blurRadius: 22)],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(
                            '${widget.senderName} أهدى سيف ذو الفقار إلى ${widget.recipientName}  •  10,000 🪙',
                            textAlign: TextAlign.center,
                            textDirection: TextDirection.rtl,
                            style: const TextStyle(color: Color(0xFFFFE4A1), fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: MediaQuery.sizeOf(context).height * .61,
                    left: 12,
                    right: 12,
                    child: Opacity(
                      opacity: ((t - .26) / .15).clamp(0.0, 1.0),
                      child: const Text(
                        'لا فتى إلا علي ولا سيف إلا ذو الفقار',
                        textAlign: TextAlign.center,
                        textDirection: TextDirection.rtl,
                        style: TextStyle(color: Color(0xFFFFD77D), fontSize: 21, fontWeight: FontWeight.bold, shadows: [
                          Shadow(color: Color(0xFF3EDB86), blurRadius: 14),
                        ]),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _SwordPainter extends CustomPainter {
  const _SwordPainter(this.glow);
  final double glow;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final paint = Paint()
      ..color = const Color(0xFFFFD675)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 9
      ..strokeCap = StrokeCap.round
      ..maskFilter = MaskFilter.blur(BlurStyle.outer, 11 * glow);
    final blade = Path()
      ..moveTo(cx, 24)
      ..lineTo(cx, 244)
      ..lineTo(cx - 27, 293)
      ..lineTo(cx - 11, 277)
      ..lineTo(cx, 294)
      ..lineTo(cx + 11, 277)
      ..lineTo(cx + 27, 293)
      ..lineTo(cx, 244);
    canvas.drawPath(blade, paint);
    canvas.drawPath(blade, Paint()
      ..color = const Color(0xFFFFE5A1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeJoin = StrokeJoin.round);
    canvas.drawLine(Offset(cx - 55, 75), Offset(cx + 55, 75), Paint()
      ..color = const Color(0xFFFFD675)
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round);
    canvas.drawCircle(Offset(cx, 21), 13, Paint()..color = const Color(0xFF45E09A));
  }

  @override
  bool shouldRepaint(covariant _SwordPainter oldDelegate) => oldDelegate.glow != glow;
}
