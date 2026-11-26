import assert from 'node:assert/strict';
import { advanceFishing, catchFish, duration, startFishing, visibleFish, waveDuration } from '../src/features/games/fishing/rules';

const round = startFishing(() => 0);
const initial = visibleFish(round);
assert.equal(initial.length, 4);
assert.equal(new Set(initial.map(target => target.cell)).size, 4);
assert.ok(initial.every(target => target.kind === 'puffer'));

const first = catchFish(round, initial[0].id, 100);
assert.equal(first.score, 3);
assert.equal(visibleFish(first).length, 3);
assert.equal(round.score, 0);
assert.equal(catchFish(first, initial[0].id, 150).score, 3);
assert.equal(catchFish(first, initial[1].id, waveDuration).score, 3);

const next = advanceFishing(first, waveDuration);
const targets = visibleFish(next);
assert.ok(targets.every(target => !initial.some(prior => target.id === prior.id)));
assert.equal(catchFish(next, targets[0].id, waveDuration).score, 6);
assert.equal(advanceFishing(next, 0), next);
assert.equal(visibleFish(advanceFishing(next, duration - 1)).length, 4);
assert.equal(visibleFish(advanceFishing(next, duration)).length, 0);
assert.equal(catchFish(next, targets[0].id, duration).score, 3);
const common = startFishing(() => 0.9);
assert.equal(catchFish(common, visibleFish(common)[0].id, 1).score, 1);
console.log('Fishing practice rules passed.');
