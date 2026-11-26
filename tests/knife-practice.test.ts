import assert from 'node:assert/strict';
import { newKnifeRound, rotateTarget, targetCount, throwAtTarget } from '../src/features/games/knife/rules';

const round = newKnifeRound();
const first = throwAtTarget(round);
assert.equal(first.score, 1);
assert.equal(first.over, false);
assert.equal(round.score, 0);
const collision = throwAtTarget(first);
assert.equal(collision.score, 1);
assert.equal(collision.over, true);
assert.equal(throwAtTarget(collision), collision);
assert.equal(rotateTarget(collision, 100), collision);
assert.equal(throwAtTarget({ ...first, angle: Math.PI * 2 - 0.05 }).over, true);

let clear = round;
for (let index = 0; index < targetCount(1); index++) {
  clear = throwAtTarget({ ...clear, angle: index * Math.PI / 3 });
}
assert.equal(clear.level, 2);
assert.equal(clear.score, 6);
assert.deepEqual(clear.marks, []);
assert.ok(rotateTarget(clear, 100).angle > clear.angle);
assert.equal(targetCount(100), 12);
assert.deepEqual(newKnifeRound(), round);
console.log('Knife practice rules passed.');
