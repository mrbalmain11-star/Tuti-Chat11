import assert from 'node:assert/strict';
import { applyMove, botMove, canPlay, createRound, type Card, type Round } from '../src/features/games/uno/rules';

const initial = createRound(() => 0.5);
const all = [...initial.hands.flat(), ...initial.discard, ...initial.stock];
assert.equal(all.length, 108);
assert.equal(new Set(all.map(card => card.id)).size, 108);
assert.deepEqual(initial.hands.map(hand => hand.length), [7, 7]);

const red: Card = { id: 0, color: 'red', rank: 3 };
const blue: Card = { id: 1, color: 'blue', rank: 3 };
const skip: Card = { id: 2, color: 'red', rank: 'skip' };
const wild4: Card = { id: 3, color: null, rank: 'wild4' };
const draw2: Card = { id: 4, color: 'red', rank: 'draw2' };
const reserve = initial.stock.filter(card => card.id > 4);
const round: Round = {
  ...initial, hands: [[blue, skip, wild4, draw2], [reserve[0]]],
  stock: reserve.slice(1), discard: [red], color: 'red',
};
assert.equal(applyMove(round, 1, { kind: 'draw' }), round);
assert.equal(applyMove(round, 0, { kind: 'play', id: 999 }), round);
assert.equal(canPlay(round, 0, wild4), false);
assert.equal(applyMove(round, 0, { kind: 'play', id: blue.id }).color, 'blue');
assert.equal(applyMove(round, 0, { kind: 'play', id: skip.id }).turn, 0);

const afterDrawTwo = applyMove(round, 0, { kind: 'play', id: draw2.id });
assert.equal(afterDrawTwo.hands[1].length, 3);
assert.equal(afterDrawTwo.turn, 0);
assert.equal(round.hands[1].length, 1);

const wildRound: Round = { ...round, hands: [[wild4], [reserve[0]]] };
assert.equal(applyMove(wildRound, 0, { kind: 'play', id: wild4.id }), wildRound);
const won = applyMove(wildRound, 0, { kind: 'play', id: wild4.id, color: 'yellow' });
assert.equal(won.hands[1].length, 5);
assert.equal(won.winner, 0);
assert.equal(won.color, 'yellow');
assert.equal(applyMove(won, 0, { kind: 'draw' }), won);

const emptyStock: Round = { ...round, stock: [], hands: [[skip, wild4, draw2], [reserve[0]]], discard: [blue, red] };
const drew = applyMove(emptyStock, 0, { kind: 'draw' }, () => 0.5);
assert.equal(drew.drawn, blue.id);
assert.equal(drew.discard.length, 1);
assert.equal(applyMove(drew, 0, { kind: 'play', id: skip.id }), drew);
assert.equal(applyMove(drew, 0, { kind: 'pass' }).turn, 1);
assert.equal(applyMove(drew, 0, { kind: 'draw' }), drew);
assert.equal(botMove({ ...round, turn: 1, hands: [[wild4], [blue]] }).kind, 'play');

console.log('UNO practice rules passed.');
