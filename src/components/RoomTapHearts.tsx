import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import './room-tap-hearts.css';

const colors = ['#ff5188', '#ff788d', '#ff3671', '#ff98ba'];

export function RoomTapHearts() {
  const layerRef = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const surface = layerRef.current?.parentElement;
    if (!surface) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function tap(event: MouseEvent) {
      if (!surface || event.defaultPrevented || event.detail === 0 || reducedMotion.matches) return;
      const target = event.target;
      if (target !== surface && !(target instanceof Element && target.matches('[data-room-heart-area]'))) return;
      const bounds = surface.getBoundingClientRect();
      const particle = { id: sequence.current++, x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      setHearts(current => [...current.slice(-23), particle]);
    }
    surface.addEventListener('click', tap);
    return () => surface.removeEventListener('click', tap);
  }, []);

  return <div ref={layerRef} className="room-tap-hearts" aria-hidden="true">
    {hearts.map(({ id, x, y }) => (
      <span key={id} className={id % 2 === 0 ? 'room-tap-heart room-tap-heart-left' : 'room-tap-heart'}
        style={{ left: x, top: y, color: colors[id % colors.length] }}
        onAnimationEnd={() => setHearts(current => current.filter(heart => heart.id !== id))}>
        <Heart size={29} fill="currentColor" strokeWidth={1} />
      </span>
    ))}
  </div>;
}
