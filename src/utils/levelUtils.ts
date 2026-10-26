// Level and Experience calculation utilities
// Formula: 1 Coin = 1 EXP (1 كوينز دعم = 1 خبرة)

export const MAX_LEVEL = 260;
export const MAX_WEALTH_LEVEL = 240;
export const MAX_CHARM_LEVEL = 260;
export const MAX_GAME_LEVEL = 100;

// Cumulative experience required to reach each level (1 to 240+)
// Continuous curve: base scaling
export const calculateCumulativeExpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 2.85));
};

// Given cumulative EXP, find corresponding level (1 to maxLevel)
export const getLevelFromExp = (exp: number, maxLevel: number = MAX_LEVEL): number => {
  if (!exp || exp <= 0) return 1;
  let low = 1;
  let high = maxLevel;
  let current = 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const required = calculateCumulativeExpForLevel(mid);
    if (exp >= required) {
      current = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.min(maxLevel, Math.max(1, current));
};

export interface LevelProgress {
  level: number;
  nextLevel: number;
  currentExp: number;
  expForCurrentLevel: number;
  expForNextLevel: number;
  expInCurrentLevel: number;
  neededForNextLevel: number;
  progressPercent: number;
}

export const getLevelProgress = (exp: number, maxLevel: number = MAX_LEVEL): LevelProgress => {
  const safeExp = Math.max(0, exp || 0);
  const level = getLevelFromExp(safeExp, maxLevel);
  const nextLevel = Math.min(maxLevel, level + 1);

  const expForCurrentLevel = calculateCumulativeExpForLevel(level);
  const expForNextLevel = calculateCumulativeExpForLevel(nextLevel);

  const span = expForNextLevel - expForCurrentLevel;
  const expInCurrentLevel = safeExp - expForCurrentLevel;
  const neededForNextLevel = Math.max(0, expForNextLevel - safeExp);

  const progressPercent =
    level >= maxLevel
      ? 100
      : span > 0
      ? Math.min(100, Math.max(0, Math.round((expInCurrentLevel / span) * 100)))
      : 0;

  return {
    level,
    nextLevel,
    currentExp: safeExp,
    expForCurrentLevel,
    expForNextLevel,
    expInCurrentLevel,
    neededForNextLevel,
    progressPercent,
  };
};
