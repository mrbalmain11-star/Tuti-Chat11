import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';

/** Plays a trusted, hosted Lottie JSON asset; callers provide a legacy fallback. */
export const GiftLottieAnimation: React.FC<{
  url: string;
  onFailure: () => void;
}> = ({ url, onFailure }) => {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!container.current || !/^https:\/\//i.test(url)) {
      onFailure();
      return;
    }
    let disposed = false;
    const controller = new AbortController();
    let animation: ReturnType<typeof lottie.loadAnimation> | undefined;
    const timeout = window.setTimeout(() => {
      if (!disposed) {
        controller.abort();
        onFailure();
      }
    }, 8000);
    setReady(false);
    (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, mode: 'cors' });
        if (!response.ok) throw new Error('Gift animation download failed');
        const data = await response.json();
        if (disposed) return;
        if (!data || typeof data !== 'object' || !Array.isArray(data.layers)) {
          throw new Error('Invalid Lottie JSON');
        }
        animation = lottie.loadAnimation({
          container: container.current!,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          animationData: data,
          rendererSettings: { progressiveLoad: true },
        });
        animation.addEventListener('DOMLoaded', () => {
          window.clearTimeout(timeout);
          if (!disposed) setReady(true);
        });
        animation.addEventListener('data_failed', () => { if (!disposed) onFailure(); });
      } catch (error) {
        if (!disposed && !controller.signal.aborted) {
          console.error('Gift Lottie asset unavailable:', error);
          onFailure();
        }
      }
    })();
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
      animation?.destroy();
    };
  }, [url, onFailure]);
  return <div ref={container} className="w-full h-full" aria-label="حركة الهدية" style={{ opacity: ready ? 1 : 0 }} />;
};
