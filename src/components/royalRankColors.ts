/** Shared decorative TOP palette; no ranking or room state is defined here. */
export const royalRankColors = {
  1: { light: '#fff4ae', mid: '#e5ad31', dark: '#8a4c0c', stone: '#e8a51c' },
  2: { light: '#effaff', mid: '#91b7dc', dark: '#405b85', stone: '#5cb6ff' },
  3: { light: '#ffe6b8', mid: '#c88a46', dark: '#74401e', stone: '#e5a45e' },
} as const;

export type RoyalRank = keyof typeof royalRankColors;
