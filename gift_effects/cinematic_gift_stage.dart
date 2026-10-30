import 'dart:async';
import 'package:flutter/material.dart';
import 'cinematic_gift_catalog.dart';
import 'zulfiqar_gift_overlay.dart';

/// Visual-only layer. Feed only server-verified gift transactions into [enqueue].
/// The room must retain its existing audio/session widget underneath this Stack.
class CinematicGiftStage extends StatefulWidget {
  const CinematicGiftStage({super.key, required this.child, required this.controller});
  final Widget child;
  final CinematicGiftStageController controller;

  @override
  State<CinematicGiftStage> createState() => _CinematicGiftStageState();
}

class CinematicGiftStageController extends ChangeNotifier {
  final List<VerifiedCinematicGiftEvent> _queue = [];
  final GiftEventDeduplicator _deduplicator = GiftEventDeduplicator();

  void enqueue(VerifiedCinematicGiftEvent event) {
    if (event.transactionId.isEmpty || event.roomId.isEmpty ||
        !giftQuantityOptions.contains(event.quantity)) return;
    if (!_deduplicator.accept(event)) return;
    _queue.add(event);
    notifyListeners();
  }

  VerifiedCinematicGiftEvent? takeNext() =>
      _queue.isEmpty ? null : _queue.removeAt(0);

  @override
  void dispose() {
    _queue.clear();
    _deduplicator.reset();
    super.dispose();
  }
}

class _CinematicGiftStageState extends State<CinematicGiftStage> {
  VerifiedCinematicGiftEvent? _active;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_tryNext);
    WidgetsBinding.instance.addPostFrameCallback((_) => _tryNext());
  }

  @override
  void didUpdateWidget(covariant CinematicGiftStage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_tryNext);
      widget.controller.addListener(_tryNext);
      _tryNext();
    }
  }

  void _tryNext() {
    if (!mounted || _active != null) return;
    final next = widget.controller.takeNext();
    if (next == null) return;
    setState(() => _active = next);
    // Placeholder effect for other gifts until approved animation assets exist.
    if (next.giftId != CinematicGiftId.zulfiqar) {
      _timer = Timer(const Duration(seconds: 7), _finish);
    }
  }

  void _finish() {
    if (!mounted) return;
    _timer?.cancel();
    setState(() => _active = null);
    _tryNext();
  }

  @override
  void dispose() {
    _timer?.cancel();
    widget.controller.removeListener(_tryNext);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final event = _active;
    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        if (event != null)
          if (event.giftId == CinematicGiftId.zulfiqar)
            ZulfiqarGiftOverlay(
              key: ValueKey(event.transactionId),
              senderName: event.senderName,
              recipientName: event.recipientName,
              onFinished: _finish,
            )
          else
            _GiftPlaceholder(event: event),
      ],
    );
  }
}

class _GiftPlaceholder extends StatelessWidget {
  const _GiftPlaceholder({required this.event});
  final VerifiedCinematicGiftEvent event;

  @override
  Widget build(BuildContext context) {
    final gift = cinematicGiftCatalog.firstWhere((g) => g.id == event.giftId);
    return Positioned.fill(
      child: IgnorePointer(
        child: ColoredBox(
          color: const Color(0xE6000B18),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.auto_awesome, color: Color(gift.primaryColor), size: 72),
                  const SizedBox(height: 20),
                  Text(gift.title, textDirection: TextDirection.rtl,
                      style: const TextStyle(color: Color(0xFFFFDB88), fontSize: 29)),
                  const SizedBox(height: 12),
                  Text('${event.senderName} أهدى إلى ${event.recipientName}',
                      textDirection: TextDirection.rtl,
                      style: const TextStyle(color: Colors.white, fontSize: 17)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
