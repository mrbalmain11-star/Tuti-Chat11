import { stagingBackend } from '../../services/stagingBackend';

export const games = [
  ['greedy', 'غريدي', 'greedy'], ['teen_patti', 'تين باتي', 'teen_patti'],
  ['lucky_wheel', 'عجلة الحظ', 'lucky_wheel'], ['slot', 'سلوت', 'slot'],
  ['roulette', 'روليت', 'roulette'], ['crash', 'كراش', 'crash'],
  ['fruit', 'سلوت الفواكه', 'fruit'], ['plinko', 'باتشينكو', 'pachinko'],
  ['ludo', 'لودو', 'ludo'],
] as const;
export const gameAsset = '/assets/games/';
export const gameName = (code: string) => games.find(game => game[0] === code)?.[1] ?? code;
export type Risk = 'low' | 'normal' | 'high';
export type Rules = { min_stake: number; max_stake: number; payouts: Record<Risk, Record<number, number[]>> };
export type Game = { code: string; enabled: boolean; implemented: boolean; rules: Partial<Rules> };
export type Round = {
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

export const loadGames = () => rpc<Snapshot>('practice_games_snapshot');
export const dropBall = (pending: Pending) => rpc<Round>('practice_games_drop', pending);
export const loadGameAdmin = (code?: string, enabled?: boolean) =>
  rpc<AdminSnapshot>('practice_games_admin', code ? { p_code: code, p_enabled: enabled } : undefined);
