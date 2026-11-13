import assert from 'node:assert/strict';
import {
  APPROVED_EARLY_TRANSITIONS, ROYAL_MAX_LEVEL, calculateRoyalProgress,
  royalGiftXp, validateRoyalCurve,
} from '../src/utils/royalLevels';

const curve = Array.from({ length: ROYAL_MAX_LEVEL - 1 }, (_, i) =>
  i < APPROVED_EARLY_TRANSITIONS.length ? APPROVED_EARLY_TRANSITIONS[i] : 400000n + BigInt(i - 21) * 25000n
);
validateRoyalCurve(curve);
assert.equal(calculateRoyalProgress(0n, curve).level, 1);
assert.equal(calculateRoyalProgress(9999n, curve).level, 1);
assert.equal(calculateRoyalProgress(10000n, curve).level, 2);
assert.equal(calculateRoyalProgress(35000n, curve).level, 3);
assert.equal(calculateRoyalProgress(35000n, curve).xpIntoLevel, 5000n);
const total = curve.reduce((sum, x) => sum + x, 0n);
assert.equal(calculateRoyalProgress(total, curve).level, 200);
assert.equal(calculateRoyalProgress(total + 999999n, curve).lifetimeXp, total + 999999n);
assert.equal(calculateRoyalProgress(total, curve).xpToNextLevel, null);
assert.deepEqual(royalGiftXp(50000n, true), { wealth: 50000n, charm: 50000n, room: 50000n });
assert.equal(royalGiftXp(50000n, false).room, 0n);
assert.throws(() => royalGiftXp(0n, true));
assert.throws(() => validateRoyalCurve(curve.slice(0, -1)));
assert.throws(() => validateRoyalCurve([1n, ...curve.slice(1)]));
assert.throws(() => calculateRoyalProgress(-1n, curve));
console.log('Royal progression core checks passed (illustrative unapproved late-level curve).');
