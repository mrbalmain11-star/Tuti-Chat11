import { stagingBackend } from '../../../services/stagingBackend';

export type Outcome = { slot: string; winner: string };
export type GreedyState = {
  enabled: true; serverTime: string; slot: string; closesAt: string;
  player: { id: string; publicId: number | null; name: string | null; avatar: string | null; coins: number | null };
  pick: string | null; winner: string | null; history: Outcome[]; records: (Outcome & { pick: string })[];
};

export async function loadGreedy(signal: AbortSignal): Promise<GreedyState | null> {
  if (!stagingBackend) throw new Error('GREEDY_OFFLINE');
  const { data, error } = await stagingBackend.rpc('totichat_original_greedy_state').abortSignal(signal);
  if (error) throw error;
  if (!data?.enabled) return null;
  if (!data.player?.id || !Array.isArray(data.history) || !Array.isArray(data.records)) throw new Error('INVALID_GREEDY_STATE');
  return data as GreedyState;
}

export async function recordGreedyPick(slot: string, food: string, signal: AbortSignal) {
  if (!stagingBackend) throw new Error('GREEDY_OFFLINE');
  const { data, error } = await stagingBackend.rpc('totichat_original_greedy_pick', { p_slot: slot, p_food: food }).abortSignal(signal);
  if (error) throw error;
  if (data !== food) throw new Error('GREEDY_PICK_NOT_CONFIRMED');
}

export type GreedyPeriod = 'day' | 'week' | 'month';
export type GreedyLeader = { name: string | null; public_id: number | null; wins: number };
export async function loadGreedyLeaders(period: GreedyPeriod, signal: AbortSignal): Promise<GreedyLeader[]> {
  if (!stagingBackend) throw new Error('GREEDY_OFFLINE');
  const { data, error } = await stagingBackend.rpc('totichat_original_greedy_leaders', { p_period: period }).abortSignal(signal);
  if (error || !Array.isArray(data)) throw error ?? new Error('INVALID_GREEDY_LEADERS');
  return data as GreedyLeader[];
}
