import { stagingBackend } from '../../../services/stagingBackend';

export type FoodRound = {
  starts_at: string;
  resolved_at: string;
  result: { outcome?: number; refunded?: boolean };
  multiplier: number | null;
};
export type FoodEntry = {
  request_id: string;
  starts_at: string;
  pick: number;
  stake: number;
  paid: number | null;
  status: 'pending' | 'settled' | 'refunded';
};
type Identity = { public_id: number | null; name: string | null; avatar: string | null };
export type FoodLeader = Identity & { points: string; rank: number };
export type FoodPeriod = 'day' | 'week' | 'month';
export type FoodState = {
  enabled: boolean;
  server_time: string;
  round_start: string;
  closes_at: string;
  player: Identity & { balance: number | null };
  level: number;
  vip: number;
  royal_eligible: boolean;
  monthly_stake: string;
  bets: Record<string, number>;
  rounds: FoodRound[];
  entries: FoodEntry[];
  latest_winners: { players: (Identity & { payout: string })[]; total_payout: string; round_start: string | null };
};
export type FoodRequest = { p_request: string; p_start: string; p_pick: number; p_stake: number };

async function rpc<T>(name: string, args?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  if (!stagingBackend) throw new Error('GAMES_SERVER_UNAVAILABLE');
  const request = stagingBackend.rpc(name, args);
  const { data, error } = await (signal ? request.abortSignal(signal) : request);
  if (error) throw error;
  return data as T;
}

export const loadFood = (signal: AbortSignal) => rpc<FoodState>('totichat_food_state', undefined, signal);
export const enterFood = (request: FoodRequest, royal = false) =>
  rpc<FoodEntry>(royal ? 'totichat_food_royal_enter' : 'totichat_food_enter', request);
export const loadFoodLeaders = (period: FoodPeriod, signal: AbortSignal) =>
  rpc<{ leaders: FoodLeader[]; player: FoodLeader | null }>('totichat_food_leaders', { p_period: period }, signal);

export type FoodReward = {
  kind: 'daily' | 'chest' | 'card';
  item: number;
  period: string;
  coins: number;
  requirement: number;
  progress: number;
  claimed: boolean;
  available: boolean;
};
export const loadFoodRewards = (signal: AbortSignal) =>
  rpc<{ enabled: boolean; items: FoodReward[] }>('totichat_food_rewards', undefined, signal);
export const claimFoodReward = ({ kind, item, period }: FoodReward) =>
  rpc<{ coins: number }>('totichat_food_reward_claim', { p_kind: kind, p_item: item, p_period: period });

export const finishFoodRound = (roundStart: string) =>
  rpc<void>('totichat_food_finish', { p_start: roundStart });
