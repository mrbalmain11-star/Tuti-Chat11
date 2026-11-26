export const size = 400;
export const pockets = [[22, 22], [378, 22], [22, 378], [378, 378]];
type Piece = { id: number; x: number; y: number; vx: number; vy: number; radius: number };
export type Board = { pieces: Piece[]; striker: Piece | null; seat: 0 | 1; scores: [number, number] };
export const baseline = (seat: Board['seat']) => seat ? 54 : 346;

export function startCarrom(): Board {
  return { pieces: Array.from({ length: 12 }, (_, id) => ({
    id, x: 200 + Math.cos(id * Math.PI / 6) * 48, y: 200 + Math.sin(id * Math.PI / 6) * 48, vx: 0, vy: 0, radius: 11,
  })), striker: null, seat: 0, scores: [0, 0] };
}

export function shoot(board: Board, x: number, y: number, power: number): Board {
  if (carromMoving(board) || !board.pieces.length || ![x, y, power].every(Number.isFinite)) return board;
  const start = baseline(board.seat);
  const dx = x - 200;
  const dy = y - start;
  const distance = Math.hypot(dx, dy);
  if (distance < 1 || (board.seat ? dy <= 0 : dy >= 0)) return board;
  const speed = 5 + 9 * Math.max(0, Math.min(1, power));
  return { ...board, striker: { id: -1, x: 200, y: start, vx: dx / distance * speed, vy: dy / distance * speed, radius: 14 } };
}

const inPocket = (piece: Piece) => pockets.some(([x, y]) => Math.hypot(piece.x - x, piece.y - y) <= 19);

export function stepCarrom(board: Board): Board {
  if (!board.striker && board.pieces.every(piece => !piece.vx && !piece.vy)) return board;
  const moving = (board.striker ? [...board.pieces, board.striker] : board.pieces).map(piece => ({ ...piece }));
  for (const piece of moving) {
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vx *= 0.985;
    piece.vy *= 0.985;
    for (const [position, velocity] of [['x', 'vx'], ['y', 'vy']] as const) {
      if (piece[position] < piece.radius || piece[position] > size - piece.radius) {
        piece[position] = Math.max(piece.radius, Math.min(size - piece.radius, piece[position]));
        piece[velocity] *= -0.8;
      }
    }
  }
  for (let index = 0; index < moving.length; index++) {
    const first = moving[index];
    for (const second of moving.slice(index + 1)) {
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const gap = Math.hypot(dx, dy);
      if (!gap || gap >= first.radius + second.radius) continue;
      const nx = dx / gap;
      const ny = dy / gap;
      const overlap = (first.radius + second.radius - gap) / 2;
      first.x -= nx * overlap;
      first.y -= ny * overlap;
      second.x += nx * overlap;
      second.y += ny * overlap;
      const impulse = ((first.vx - second.vx) * nx + (first.vy - second.vy) * ny) * 0.9;
      if (impulse > 0) {
        first.vx -= impulse * nx;
        first.vy -= impulse * ny;
        second.vx += impulse * nx;
        second.vy += impulse * ny;
      }
    }
  }
  const remaining = moving.filter(piece => !inPocket(piece));
  const pieces = remaining.filter(piece => piece.id !== -1);
  const striker = remaining.find(piece => piece.id === -1) ?? null;
  const scores: Board['scores'] = [...board.scores];
  scores[board.seat] += board.pieces.length - pieces.length;
  const stopped = remaining.every(piece => Math.hypot(piece.vx, piece.vy) < 0.12);
  if (!stopped && pieces.length) return { ...board, pieces, scores, striker };
  return {
    pieces: pieces.map(piece => ({ ...piece, vx: 0, vy: 0 })), scores, striker: null, seat: board.seat ? 0 : 1,
  };
}

export const carromMoving = (board: Board) => Boolean(board.striker || board.pieces.some(piece => piece.vx || piece.vy));
