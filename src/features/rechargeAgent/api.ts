import { stagingBackend } from '../../services/stagingBackend';

export type Recipient = { id: string; display_name: string; public_id: number; avatar_url: string | null; gender: string | null; vip_level: number; level: number };
export type AgentState = { balance: number; count: number; today: number; month: number };
export type Result = { id: string; status: 'completed' | 'failed' | 'pending'; error?: string; note?: string; recipient?: Recipient };
export type History = { id: string; created_at: string; coins: number; status: Result['status']; result: Result };
export type Decision = { id: string; created_at: string; coins: number; agency_name: string };
export type Intent = { action: 'charge' | 'request_supply'; requestId: string; data: { coins: number; public_id?: number; recipient_id?: string } };

export async function agentRpc<T>(action: string, data = {}, requestId?: string): Promise<T> {
  if (!stagingBackend) throw new Error('AGENT_OFFLINE');
  const result = await stagingBackend.rpc('recharge_agent', { p_action: action, p_data: data, p_request_id: requestId ?? null });
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const num = (value: number) => value.toLocaleString('en-US');
export const digits = (value: string) => value
  .replace(/[٠-٩۰-۹]/g, c => String(c.charCodeAt(0) - (c.charCodeAt(0) < 1776 ? 1632 : 1776)))
  .replace(/[^0-9]/g, '');
export const timestamp = (value: string) => new Date(value).toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' });
