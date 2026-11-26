const fullTurn = Math.PI * 2;
const clearance = 0.24;

export type KnifeRound = { angle: number; marks: number[]; level: number; score: number; over: boolean };

export function newKnifeRound(): KnifeRound {
  return { angle: 0, marks: [], level: 1, score: 0, over: false };
}

export function rotateTarget(round: KnifeRound, deltaMs: number): KnifeRound {
  if (round.over || deltaMs <= 0) return round;
  const speed = Math.min(3, 1.08 + round.level * 0.3);
  return { ...round, angle: (round.angle + speed * deltaMs / 1000) % fullTurn };
}

export const targetCount = (level: number) => Math.min(5 + level, 12);

export function throwAtTarget(round: KnifeRound): KnifeRound {
  if (round.over) return round;
  const mark = Math.PI / 2 - round.angle;
  const blocked = round.marks.some(previous => {
    const difference = mark - previous;
    return Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference))) < clearance;
  });
  if (blocked) return { ...round, over: true };
  const cleared = round.marks.length + 1 >= targetCount(round.level);
  return {
    ...round,
    marks: cleared ? [] : [...round.marks, mark],
    level: cleared ? round.level + 1 : round.level,
    score: round.score + 1,
  };
}
