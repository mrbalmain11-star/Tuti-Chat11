export const duration = 30_000;
export const waveDuration = 1_100;
const poolSize = 20;

export type Fish = { id: number; cell: number; kind: 'silver' | 'tropical' | 'puffer' };
export type FishingRound = {
  waves: Fish[][];
  elapsed: number;
  score: number;
  caught: ReadonlySet<number>;
};

export function startFishing(random = Math.random): FishingRound {
  const waves = Array.from({ length: Math.ceil(duration / waveDuration) }, (_, wave) => {
    const cells = Array.from({ length: poolSize }, (_, cell) => cell);
    return Array.from({ length: 4 }, (_, index): Fish => {
      const [cell] = cells.splice(Math.floor(random() * cells.length), 1);
      const roll = random();
      return { id: wave * 4 + index, cell, kind: roll < 0.2 ? 'puffer' : roll < 0.6 ? 'tropical' : 'silver' };
    });
  });
  return { waves, elapsed: 0, score: 0, caught: new Set() };
}

export function advanceFishing(round: FishingRound, elapsed: number): FishingRound {
  const next = Math.min(duration, Math.max(round.elapsed, elapsed));
  return next === round.elapsed ? round : { ...round, elapsed: next };
}

export function visibleFish(round: FishingRound): Fish[] {
  if (round.elapsed >= duration) return [];
  return round.waves[Math.floor(round.elapsed / waveDuration)].filter(fish => !round.caught.has(fish.id));
}

export function catchFish(round: FishingRound, id: number, elapsed: number): FishingRound {
  const current = advanceFishing(round, elapsed);
  const fish = visibleFish(current).find(candidate => candidate.id === id);
  if (!fish) return current;
  return {
    ...current,
    score: current.score + (fish.kind === 'puffer' ? 3 : 1),
    caught: new Set([...current.caught, id]),
  };
}
