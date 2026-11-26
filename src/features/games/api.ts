import { stagingBackend } from '../../services/stagingBackend';

export const games = [
  ['greedy', 'غريدي', 'greedy'], ['teen_patti', 'تين باتي', 'teen_patti'],
  ['lucky_wheel', 'عجلة الحظ', 'lucky_wheel'], ['slot', 'سلوت', 'slot'],
  ['roulette', 'روليت', 'roulette'], ['crash', 'كراش', 'crash'],
  ['fruit', 'سلوت الفواكه', 'fruit'], ['plinko', 'باتشينكو', 'pachinko'],
  ['ludo', 'لودو', 'ludo'],
] as const;
export const recoveredGames = [
  ['ludo', 'لودو', 'Ludo'], ['uno', 'أونو', 'UNO'],
  ['domino', 'دومينو', 'Domino'], ['carrom', 'كاروم', 'Carrom'],
  ['okey', 'أوكي', 'Okey'], ['knife', 'سكين', 'Knife'],
  ['liars-bar', 'لعبة الكذّابين', "Liar’s Bar"], ['greedy', 'غريدي', 'Greedy'],
  ['fishing', 'صيد السمك', 'Fishing'],
] as const;
export const gameAsset = '/assets/games/';
export const gameName = (code: string) => code === 'toti-food' ? 'توتي للمأكولات' : recoveredGames.find(game => game[0] === code)?.[1] ?? games.find(game => game[0] === code)?.[1] ?? code;
export type Risk = 'low' | 'normal' | 'high';
export type Rules = { min_stake: number; max_stake: number; payouts: Record<Risk, Record<number, number[]>> };
export type Game = { code: string; enabled: boolean; implemented: boolean; rules: Partial<Rules> };
export type Round = {
  game_code: string;
  arcade?: { pick: number; outcome: number; draw: number[] | null; scores: number[] | null };
  request_id: string; rows: number; risk: Risk; stake: number;
  path: number[]; bucket: number; multiplier: number; reward: number; balance_after: number; created_at: string;
};
export type Snapshot = { catalog: Game[]; balance: number | null; history: Round[] };
export type Pending = { p_request: string; p_stake: number; p_rows: number; p_risk: Risk };
export type AdminSnapshot = {
  catalog: Game[]; wallets: number; balance: number; round_count: number;
  rounds: (Round & { user_id: string; public_id: number | null })[];
  ledger: { id: number; kind: string; public_id: number | null; amount: number; balance_after: number; created_at: string }[];
  audit: { id: number; public_id: number | null; game_code: string; enabled: boolean; created_at: string }[];
};

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  if (!stagingBackend) throw new Error('GAMES_SERVER_UNAVAILABLE');
  const { data, error } = await stagingBackend.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const loadGames = () => rpc<Snapshot>('practice_games_snapshot_v2');
export const dropBall = (pending: Pending) => rpc<Round>('practice_games_drop', pending);
export const loadGameAdmin = (code?: string, enabled?: boolean) =>
  rpc<AdminSnapshot>('practice_games_admin', code ? { p_code: code, p_enabled: enabled } : undefined);

export type ArcadeInput = { p_code: string; p_request: string; p_stake: number; p_pick: number };
export const playArcade = (input: ArcadeInput) => rpc<Round>('practice_games_play', input);

export type SharedResult = { outcome: number | null; draw: number[]; scores: number[] | null; refunded?: boolean; winner?: number };
export type SharedEntry = {
  request_id: string; starts_at: string; stake: number; paid: number | null;
  status: 'pending' | 'settled' | 'refunded';
  selection: { pick?: number; rows?: number; risk?: Risk; payouts?: number[] };
  result: SharedResult | null;
};
export type SharedSnapshot = {
  server_time: string; round_start: string; closes_at: string;
  balance: number | null; funded: boolean; ludo: LudoMatch | null;
  catalog: Omit<Game, 'implemented'>[];
  entries: SharedEntry[];
  rounds: { starts_at: string; result: SharedResult }[];
};
export type SharedRequest = {
  p_request: string; p_code: string; p_start: string; p_stake: number;
  p_pick?: number; p_rows?: number; p_risk?: Risk;
};
export const loadSharedGames = (code?: string) => rpc<SharedSnapshot>('games_rounds_snapshot', { p_code: code ?? null });
export const joinSharedRound = (request: SharedRequest) => rpc<SharedEntry>('games_join_round', request);

export type LudoMatch = {
  starts_at: string; pieces_one: number[]; pieces_two: number[];
  seat: 1 | 2; turn: 1 | 2; die: number; turn_number: number; deadline: string;
};
export const moveSharedLudo = (start: string, turn: number, piece: number | null) =>
  rpc<void>('games_ludo_move', { p_start: start, p_turn: turn, p_piece: piece });

type TableIdentity = { name: string; avatar: string | null; public_id: number | null };
export type DominoMatch = {
  id: string;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled';
  revision: number;
  host: TableIdentity;
  guest: TableIdentity | null;
  hand: number[];
  other_count: number;
  stock_count: number;
  board: [number, number][];
  deadline: string | null;
  my_turn: boolean | null;
  outcome: 'win' | 'loss' | 'draw' | null;
  updated_at: string;
};
export type DominoLobby = {
  server_time: string;
  enabled: boolean;
  public_players: number;
  tables: { id: string; host: TableIdentity }[];
  current: DominoMatch | null;
  history: DominoMatch[];
};
export type DominoAction = {
  p_request: string;
  p_action: 'create' | 'join' | 'leave' | 'play' | 'draw' | 'pass';
  p_table?: string;
  p_revision?: number;
  p_tile?: number;
  p_left?: boolean;
  p_invitee?: number;
};

export const loadDomino = () => rpc<DominoLobby>('totichat_domino_lobby');
export const dominoAction = (action: DominoAction) => rpc<DominoMatch>('totichat_domino_action', action);

export type DominoAdminSnapshot = {
  enabled: boolean;
  waiting: number;
  playing: number;
  finished: number;
  recent: {
    id: string;
    status: DominoMatch['status'];
    private: boolean;
    updated_at: string;
    host: TableIdentity;
    guest: TableIdentity | null;
    winner: TableIdentity | null;
  }[];
};
export const loadDominoAdmin = (enabled?: boolean) => rpc<DominoAdminSnapshot>('totichat_domino_admin', { p_enabled: enabled ?? null });
