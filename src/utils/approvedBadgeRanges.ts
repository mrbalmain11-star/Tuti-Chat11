/** Approved TotiChat wealth/charm badge progression (18 badges per track).
 * Visual assets are independent of this mapping.
 * Keep the level number outside badge artwork.
 */
export type ApprovedBadgeTrack = 'wealth' | 'charm';
export const APPROVED_BADGE_RANGES = [
  [1,10],[11,20],[21,30],[31,40],[41,50],[51,60],
  [61,70],[71,80],[81,90],[91,100],[101,110],[111,120],
  [121,130],[131,140],[141,150],[151,160],[161,170],[171,200],
] as const;

export function approvedBadgeIndex(level: number): number {
  const normalized = Number.isFinite(level) ? Math.min(200, Math.max(1, Math.floor(level))) : 1;
  return APPROVED_BADGE_RANGES.findIndex(([start, end]) => normalized >= start && normalized <= end) + 1;
}

export function approvedBadgeRange(index: number): readonly [number, number] | null {
  return APPROVED_BADGE_RANGES[index - 1] ?? null;
}
