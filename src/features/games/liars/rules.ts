const ranks = ['A', 'K', 'Q'] as const;
type Rank = typeof ranks[number];
type Seat = 0 | 1;
type Card = { id: number; rank: Rank };
type Last = { player: Seat; cards: Card[] };
export type BluffRound = {
  hands: [Card[], Card[]];
  turn: Seat;
  target: Rank;
  last: Last | null;
  winner: Seat | null;
  revealed: Rank[];
};

export function startBluff(random = Math.random): BluffRound {
  const deck = Array.from({ length: 12 }, (_, id) => ({ id, rank: ranks[id % ranks.length] }));
  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  return { hands: [deck.slice(0, 6), deck.slice(6)], target: ranks[Math.floor(random() * ranks.length)],
    turn: 0, last: null, winner: null, revealed: [] };
}

export function playBluff(round: BluffRound, seat: Seat, ids: number[]): BluffRound {
  if (round.winner !== null || round.turn !== seat || !ids.length || ids.length > 3 || new Set(ids).size !== ids.length) return round;
  if (round.last && round.hands[round.last.player].length === 0) return round;
  const cards = round.hands[seat].filter(card => ids.includes(card.id));
  if (cards.length !== ids.length) return round;
  const hands: BluffRound['hands'] = [...round.hands];
  hands[seat] = hands[seat].filter(card => !ids.includes(card.id));
  return { ...round, hands, turn: seat === 0 ? 1 : 0, last: { player: seat, cards } };
}

export function resolveBluff(round: BluffRound, seat: Seat, challenge: boolean): BluffRound {
  const last = round.last;
  if (round.winner !== null || round.turn !== seat || !last) return round;
  if (!challenge) return round.hands[last.player].length === 0 ? { ...round, winner: last.player } : round;
  const truthful = last.cards.every(card => card.rank === round.target);
  return { ...round, winner: truthful ? last.player : seat, revealed: last.cards.map(card => card.rank) };
}
