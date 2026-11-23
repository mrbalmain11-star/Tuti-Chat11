import { ReactNode, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getStorageAsset } from '../data/storageItems';
import { stagingBackend } from '../services/stagingBackend';
import { StorageItemVisual } from './StorageItemVisual';

export function StoreAvatarFrame({ userId, fallback }: { userId: string; fallback: ReactNode }) {
  const { currentUser, bagItems, equippedFrame } = useApp();
  const isSelf = userId === currentUser.id;
  const [remote, setRemote] = useState<{ userId: string; url: string } | null>(null);

  useEffect(() => {
    if (!stagingBackend || isSelf || !userId) return;
    const client = stagingBackend;
    let active = true;
    const refresh = async () => {
      const { data, error } = await client.rpc('equipped_public_decoration', {
        p_user_id: userId,
        p_category: 'frames',
      });
      if (!active || error) return;
      const url = getStorageAsset('', typeof data === 'string' ? data : null);
      setRemote(url ? { userId, url } : null);
    };
    void refresh();
    const interval = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [isSelf, userId]);

  const url = isSelf
    ? bagItems.find(item => item.id === equippedFrame)?.assetUrl
    : remote?.userId === userId ? remote.url : null;
  if (!url) return fallback;
  return (
    <div data-avatar-frame aria-hidden="true" className="pointer-events-none absolute -inset-[15%] z-20">
      <StorageItemVisual key={url} url={url} name="" play />
    </div>
  );
}
