export const colors = ['red', 'yellow', 'green', 'blue'] as const;
export type Color = typeof colors[number];
type Rank = number | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
export type Card = { id: number; color: Color | null; rank: Rank };
export type Seat = 0 | 1;
export type Round = {
  hands: [Card[], Card[]];
  stock: Card[];
  discard: Card[];
  color: Color;
  turn: Seat;
  drawn: number | null;
  winner: Seat | null;
  message: 'drew' | 'passed' | 'played' | null;
};
export type Move =
  | { kind: 'play'; id: number; color?: Color }
  | { kind: 'draw' }
  | { kind: 'pass' };

const opponent = (seat: Seat): Seat => seat === 0 ? 1 : 0;

function shuffle<T>(cards: readonly T[], random: () => number): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const position = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[position]] = [shuffled[position], shuffled[i]];
  }
  return shuffled;
}

export function createRound(random = Math.random): Round {
  const deck: Card[] = [];
  const add = (color: Card['color'], rank: Rank) => deck.push({ id: deck.length, color, rank });
  for (const color of colors) {
    add(color, 0);
    for (const rank of [1, 2, 3, 4, 5, 6, 7, 8, 9, 'skip', 'reverse', 'draw2'] as const) {
      add(color, rank);
      add(color, rank);
    }
    add(null, 'wild');
    add(null, 'wild4');
  }
  const stock = shuffle(deck, random);
  const hands: Round['hands'] = [stock.splice(0, 7), stock.splice(0, 7)];
  const [opening] = stock.splice(stock.findIndex(card => typeof card.rank === 'number'), 1);
  return { hands, stock, discard: [opening], color: opening.color!, turn: 0, drawn: null, winner: null, message: null };
}

export function canPlay(round: Round, seat: Seat, card: Card): boolean {
  if (round.winner !== null || seat !== round.turn || !round.hands[seat].includes(card)) return false;
  if (round.drawn !== null && round.drawn !== card.id) return false;
  if (card.rank === 'wild4') return !round.hands[seat].some(piece => piece.color === round.color);
  return card.rank === 'wild' || card.color === round.color || card.rank === round.discard.at(-1)?.rank;
}

function drawCards(round: Round, seat: Seat, count: number, random: () => number) {
  for (let i = 0; i < count; i++) {
    if (round.stock.length === 0 && round.discard.length > 1) {
      const top = round.discard.pop()!;
      round.stock = shuffle(round.discard, random);
      round.discard = [top];
    }
    const card = round.stock.pop();
    if (!card) break;
    round.hands[seat].push(card);
  }
}

export function applyMove(round: Round, seat: Seat, move: Move, random = Math.random): Round {
  if (round.winner !== null || round.turn !== seat) return round;
  if (move.kind === 'pass' && round.drawn === null) return round;
  if (move.kind === 'draw' && round.drawn !== null) return round;

  const card = move.kind === 'play' ? round.hands[seat].find(item => item.id === move.id) : undefined;
  if (move.kind === 'play' && (!card || !canPlay(round, seat, card) || (!card.color && !colors.includes(move.color!)))) return round;

  const next: Round = {
    ...round,
    hands: [[...round.hands[0]], [...round.hands[1]]],
    stock: [...round.stock],
    discard: [...round.discard],
  };
  const other = opponent(seat);

  if (move.kind === 'draw') {
    drawCards(next, seat, 1, random);
    const drawn = next.hands[seat].length > round.hands[seat].length ? next.hands[seat].at(-1) : undefined;
    if (drawn && canPlay(next, seat, drawn)) next.drawn = drawn.id;
    else next.turn = other;
    next.message = 'drew';
    return next;
  }

  next.drawn = null;
  next.turn = other;
  if (move.kind === 'pass') {
    next.message = 'passed';
    return next;
  }

  const played = card!;
  next.message = 'played';
  next.hands[seat] = next.hands[seat].filter(item => item.id !== played.id);
  next.discard.push(played);
  next.color = played.color ?? move.color!;
  if (played.rank === 'draw2' || played.rank === 'wild4') {
    drawCards(next, other, played.rank === 'draw2' ? 2 : 4, random);
  }
  if (['draw2', 'wild4', 'skip', 'reverse'].includes(String(played.rank))) next.turn = seat;
  if (next.hands[seat].length === 0) next.winner = seat;
  return next;
}

export function botMove(round: Round): Move {
  const hand = round.hands[1];
  const playable = hand.filter(card => canPlay(round, 1, card));
  const card = playable.find(candidate => candidate.color) ?? playable[0];
  if (!card) return { kind: round.drawn === null ? 'draw' : 'pass' };
  const count = (color: Color) => hand.filter(piece => piece.color === color).length;
  const color = colors.reduce((best, candidate) => count(candidate) > count(best) ? candidate : best);
  return { kind: 'play', id: card.id, color };
}
