export const storageCategories = [
  { id: 'frames', label: 'الإطارات' },
  { id: 'mounts', label: 'المركبات' },
  { id: 'bubbles', label: 'الفقاعات' },
  { id: 'entrances', label: 'مؤثرات الدخول' },
] as const;

type StorageCategory = typeof storageCategories[number]['id'];

export interface StorageItem {
  id: string;
  name: string;
  category: StorageCategory;
  price: number;
  durationDays: number | null;
  assetUrl: string;
  description: string | null;
}

export interface BagItem {
  id: string;
  name: string;
  category: StorageCategory;
  assetUrl: string | null;
  expiry: string;
  isEquipped: boolean;
}

export function getStorageCategory(category: string): StorageCategory | undefined {
  return storageCategories.find(({ id }) => id === (category === 'cars' ? 'mounts' : category))?.id;
}

export function getStorageAsset(id: string, previewUrl: string | null): string | null {
  const url = previewUrl?.trim();
  return url && (/^https:\/\//i.test(url) || /^\/(?![\/\\])/.test(url))
    ? url
    : id === 'frame-iraq-pegasus' ? '/iraq-pegasus-frame.png' : null;
}
