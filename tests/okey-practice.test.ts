import assert from 'node:assert/strict';
import { discardOkey, drawOkey, isWinningHand, startOkey } from '../src/features/games/okey/rules';

const tiles = (cards: number[][]) => cards.map(([color, value], id) => ({ id, color, value }));
const winner = tiles([
  [0,1],[0,2],[0,3],[0,4],
  [1,11],[1,12],[1,13],[1,1],
  [0,8],[1,8],[2,8],
  [1,6],[2,6],[3,6],
]);
assert.equal(isWinningHand(winner), true);
const broken = winner.map(tile => tile.id === 7 ? { ...tile, value: 2 } : tile);
assert.equal(isWinningHand(broken), false);
assert.equal(isWinningHand(tiles(Array.from({ length: 14 }, (_, index) => [0, Math.floor(index / 2) + 1]))), true);
assert.equal(isWinningHand(winner.slice(1)), false);

const round = startOkey(() => 0.5);
assert.deepEqual(round.hands.map(hand => hand.length), [15, 14]);
assert.equal(new Set([...round.hands.flat(), ...round.stock].map(tile => tile.id)).size, 104);
assert.equal(drawOkey(round, 'stock'), round);
assert.equal(discardOkey(round, -1), round);
const next = discardOkey(round, round.hands[0][0].id);
assert.equal(next.turn, 1);
assert.equal(next.drawn, false);
const drew = drawOkey(next, 'discards');
assert.equal(drew.hands[1].length, 15);
assert.equal(drew.discards.length, 0);
assert.equal(drawOkey({ ...next, stock: [] }, 'stock').result, 'draw');
const extra = { id: 104, color: 3, value: 13 };
const declaration = { ...round, hands: [[...winner, extra], round.hands[1]] as typeof round.hands };
assert.equal(discardOkey(declaration, extra.id, true).result, 0);
const invalid = { ...declaration, hands: [[...broken, extra], round.hands[1]] as typeof round.hands };
assert.equal(discardOkey(invalid, extra.id, true), invalid);
console.log('Okey practice rules passed.');
