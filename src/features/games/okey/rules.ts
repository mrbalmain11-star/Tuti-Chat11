export type Tile = { id: number; color: number; value: number };
type Seat = 0 | 1;
export type OkeyRound = {
  hands: [Tile[], Tile[]];
  stock: Tile[];
  discards: Tile[];
  turn: Seat;
  drawn: boolean;
  result: Seat | 'draw' | null;
};

export function startOkey(random = Math.random): OkeyRound {
  const stock = Array.from({ length: 104 }, (_, id) => ({
    id, color: Math.floor(id / 26), value: Math.floor(id / 2) % 13 + 1,
  }));
  for (let index = stock.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [stock[index], stock[other]] = [stock[other], stock[index]];
  }
  return {
    hands: [stock.splice(0, 15), stock.splice(0, 14)],
    stock, discards: [], turn: 0, drawn: true, result: null,
  };
}

function isMeld(tiles: Tile[]): boolean {
  if (tiles.length <= 4 && tiles.every(tile => tile.value === tiles[0].value)) {
    return new Set(tiles.map(tile => tile.color)).size === tiles.length;
  }
  if (tiles.length > 13 || tiles.some(tile => tile.color !== tiles[0].color)) return false;
  const values = tiles.map(tile => tile.value).sort((a, b) => a - b);
  const consecutive = (items: number[]) => items.every((value, index) => value === items[0] + index);
  return consecutive(values) || (values[0] === 1 && consecutive([...values.slice(1), 14]));
}

export function isWinningHand(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false;
  const counts = new Map<number, number>();
  for (const tile of tiles) {
    const key = tile.color * 13 + tile.value;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 7 && [...counts.values()].every(count => count === 2)) return true;

  const all = (1 << tiles.length) - 1;
  const byFirstTile: number[][] = tiles.map(() => []);
  for (let mask = 1; mask <= all; mask++) {
    const members = tiles.filter((_, index) => (mask & (1 << index)) !== 0);
    if (members.length >= 3 && isMeld(members)) byFirstTile[31 - Math.clz32(mask & -mask)].push(mask);
  }

  const deadEnds = new Set<number>();
  function partition(remaining: number): boolean {
    if (!remaining) return true;
    if (deadEnds.has(remaining)) return false;
    const first = 31 - Math.clz32(remaining & -remaining);
    if (byFirstTile[first].some(meld => (remaining & meld) === meld && partition(remaining ^ meld))) return true;
    deadEnds.add(remaining);
    return false;
  }
  return partition(all);
}

export function drawOkey(round: OkeyRound, source: 'stock' | 'discards'): OkeyRound {
  if (round.result !== null || round.drawn) return round;
  const tile = round[source].at(-1);
  if (!tile) return source === 'stock' ? { ...round, result: 'draw' } : round;
  const hands: OkeyRound['hands'] = [...round.hands];
  hands[round.turn] = [...hands[round.turn], tile];
  return { ...round, hands, [source]: round[source].slice(0, -1), drawn: true };
}

export function discardOkey(round: OkeyRound, id: number, declare = false): OkeyRound {
  if (round.result !== null || !round.drawn) return round;
  const tile = round.hands[round.turn].find(piece => piece.id === id);
  if (!tile) return round;
  const hand = round.hands[round.turn].filter(piece => piece.id !== id);
  if (declare && !isWinningHand(hand)) return round;
  const hands: OkeyRound['hands'] = [...round.hands];
  hands[round.turn] = hand;
  return {
    ...round, hands, discards: [...round.discards, tile], drawn: false,
    turn: round.turn === 0 ? 1 : 0, result: declare ? round.turn : null,
  };
}
