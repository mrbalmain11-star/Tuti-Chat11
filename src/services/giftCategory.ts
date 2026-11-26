import type { GiftItem } from '../types';

export function giftCategory(category: string | null): GiftItem['category'] {
  switch (category?.trim().toLowerCase()) {
    case 'luck': case 'حظ': return 'حظ';
    case 'cp': return 'CP';
    case 'nation': case 'الأمة': return 'الأمة';
    case 'custom': case 'مخصص': return 'مخصص';
    default: return 'هدية';
  }
}
