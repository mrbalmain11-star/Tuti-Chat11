/** TotiChat 200-level progression core (staging). No wallet/audio side effects.
 * Thresholds are the XP needed to advance FROM level L to L+1.
 * A final 199-entry curve must be approved after economic calibration.
 */
export const ROYAL_MAX_LEVEL = 200 as const;
export type RoyalTrack = 'wealth' | 'charm' | 'room';
export type RoyalProgress = {
  level: number;
  lifetimeXp: bigint;
  xpIntoLevel: bigint;
  xpToNextLevel: bigint | null;
  progressPercent: number;
};
export const APPROVED_EARLY_TRANSITIONS = [
  10000n, 20000n, 30000n, 40000n, 50000n, 60000n,
  70000n, 80000n, 90000n, 100000n, 120000n, 140000n,
  160000n, 180000n, 200000n, 225000n, 250000n,
  275000n, 300000n, 325000n, 350000n, 400000n,
] as const;

/** Reject incomplete or invalid curves; never silently invent late-level costs. */
export function validateRoyalCurve(transitions: readonly bigint[]): void {
  if (transitions.length !== ROYAL_MAX_LEVEL - 1) {
    throw new Error('Royal progression requires exactly 199 transition costs');
  }
  transitions.forEach((cost, i) => {
    if (typeof cost !== 'bigint' || cost <= 0n) throw new Error('Invalid transition cost at level ' + (i + 1));
    if (i < APPROVED_EARLY_TRANSITIONS.length && cost !== APPROVED_EARLY_TRANSITIONS[i]) {
      throw new Error('Approved early level transition changed at level ' + (i + 1));
    }
    if (i > 0 && cost < transitions[i - 1]) throw new Error('Transition costs must not decrease');
  });
}

/** Level 1 is the starting level; surplus XP carries across every transition. */
export function calculateRoyalProgress(lifetimeXp: bigint, transitions: readonly bigint[]): RoyalProgress {
  validateRoyalCurve(transitions);
  if (lifetimeXp < 0n) throw new Error('XP cannot be negative');
  let remaining = lifetimeXp;
  let level = 1;
  while (level < ROYAL_MAX_LEVEL && remaining >= transitions[level - 1]) {
    remaining -= transitions[level - 1];
    level++;
  }
  const next = level === ROYAL_MAX_LEVEL ? null : transitions[level - 1];
  return {
    level, lifetimeXp, xpIntoLevel: remaining,
    xpToNextLevel: next === null ? null : next - remaining,
    progressPercent: next === null ? 100 : Number(remaining * 10000n / next) / 100,
  };
}

/** One eligible gift amount yields independent XP for each applicable track.
 * The server must deduplicate by the original financial gift-event ID.
 */
export function royalGiftXp(amount: bigint, hasVerifiedRoom: boolean) {
  if (amount <= 0n) throw new Error('Gift amount must be positive');
  return { wealth: amount, charm: amount, room: hasVerifiedRoom ? amount : 0n };
}
