import React, { useEffect, useState } from 'react';
import './CpWingAvatarFrame.css';

const ASSET = '/assets/TotiChat_CP_Animated_Frame-2.html';
type Layers = string[];
let cached: Promise<Layers> | undefined;

/** Reuses the approved CP artwork and its four wing layers without showing the preview controls. */
function loadLayers(): Promise<Layers> {
  if (!cached) cached = fetch(ASSET).then(async response => {
    if (!response.ok) throw new Error('CP artwork unavailable');
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const images = Array.from(doc.querySelectorAll('.scene img.layer'));
    const frame = images.find(image => image.classList.contains('frame'));
    const wings = ['w1', 'w2', 'w3', 'w4'].map(name => images.find(image => image.classList.contains(name)));
    if (!frame || wings.some(image => !image)) throw new Error('CP artwork layers incomplete');
    const layers = [frame, ...wings].map(image => image!.getAttribute('src') || '');
    if (layers.some(src => !src.startsWith('data:image/'))) throw new Error('Invalid CP artwork source');
    return layers;
  }).catch(error => { cached = undefined; throw error; });
  return cached;
}

type Props = {
  avatar?: string | null;
  name?: string;
  enabled: boolean;
  className?: string;
};

/** Decorative overlay: parent must be position:relative, avatar remains managed by its existing component. */
export const CpWingAvatarFrame: React.FC<Props> = ({ enabled, name, className = '' }) => {
  const [layers, setLayers] = useState<Layers | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void loadLayers().then(value => { if (live) setLayers(value); }).catch(() => { if (live) setLayers(null); });
    return () => { live = false; };
  }, [enabled]);
  if (!enabled || !layers) return null;
  return <span data-avatar-frame className={`cp-wing-avatar-frame ${className}`} aria-label={name ? `إطار CP لـ ${name}` : 'إطار CP المتحرك'}>
    {layers.map((src, index) => <img key={index} className={`cp-wing-avatar-layer ${index ? `cp-wing-layer-w${index}` : 'cp-wing-avatar-base'}`} src={src} alt="" draggable={false} />)}
  </span>;
};
