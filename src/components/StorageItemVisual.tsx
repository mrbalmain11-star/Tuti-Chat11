import { useState } from 'react';

export function StorageItemVisual({ url, name, play = false }: { url: string; name: string; play?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-xs text-slate-400">المعاينة غير متاحة</span>;

  if (/\.(mp4|webm)([?#]|$)/i.test(url)) {
    return <video aria-label={name} src={url} muted playsInline autoPlay={play} loop={play}
      preload="metadata" onError={() => setFailed(true)} className="h-full w-full object-contain" />;
  }
  return <img src={url} alt={name} loading="lazy" onError={() => setFailed(true)}
    className="h-full w-full object-contain" />;
}
