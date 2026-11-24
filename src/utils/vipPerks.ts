export function activeVipTier(value: number | undefined): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12 ? value : 0;
}

export function hasVipEntrance(value: number | undefined): boolean {
  return activeVipTier(value) >= 6;
}

export function hasVipChatBubble(value: number | undefined): boolean {
  const tier = activeVipTier(value);
  return tier >= 1 && tier <= 8;
}
