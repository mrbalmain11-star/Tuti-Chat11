import { useEffect, useState, type RefObject } from 'react';
import { Heart } from 'lucide-react';
import './room-tap-hearts.css';

type Tap = { id: number; x: number; y: number };
const interactive = 'button,a,input,textarea,select,label,[role="button"],[contenteditable],iframe,video';

function isTapSurface(target: EventTarget | null, viewport: HTMLElement) {
  return target === viewport || (target instanceof Element
    && viewport.contains(target)
    && !!target.closest('[data-room-tap-surface]')
    && !target.closest(interactive));
}

export function RoomTapHearts({ viewport }: { viewport: RefObject<HTMLDivElement | null> }) {
  const [hearts, setHearts] = useState<Tap[]>([]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    let sequence = 0;
    let start: Tap | undefined;
    function down(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0 || !isTapSurface(event.target, element!)) return;
      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
    function up(event: PointerEvent) {
      if (!start || start.id !== event.pointerId) return;
      const tap = start;
      start = undefined;
      if (!isTapSurface(event.target, element!) || Math.hypot(tap.x - event.clientX, tap.y - event.clientY) > 10) return;
      const bounds = element!.getBoundingClientRect();
      const heart = { id: ++sequence, x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      setHearts(previous => [...previous.slice(-23), heart]);
    }
    function cancel(event: PointerEvent) {
      if (start?.id === event.pointerId) start = undefined;
    }
    element.addEventListener('pointerdown', down, true);
    element.addEventListener('pointerup', up, true);
    element.addEventListener('pointercancel', cancel, true);
    return () => {
      element.removeEventListener('pointerdown', down, true);
      element.removeEventListener('pointerup', up, true);
      element.removeEventListener('pointercancel', cancel, true);
    };
  }, [viewport]);

  return <div aria-hidden="true" className="room-tap-hearts">
    {hearts.map(({ id, x, y }) => <Heart key={id} className="room-tap-heart" fill="currentColor" size={31}
      style={{ left: x, top: y }} onAnimationEnd={() => setHearts(previous => previous.filter(heart => heart.id !== id))} />)}
  </div>;
}
