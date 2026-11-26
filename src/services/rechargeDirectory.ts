import { stagingBackend } from './stagingBackend';
import { imageUrl } from './imageUrl';

export type RechargeAgentCard = { id: string; ownerId: string; name: string; publicId: number; avatar: string };
export type RechargeHistoryRow = { id: string; date: string; coins: number; status: string };

export async function fetchRechargeAgents(agencyId?: string): Promise<RechargeAgentCard[]> {
  if (!stagingBackend) throw new Error('Recharge service unavailable');
  const client = stagingBackend;
  let query = client.from('agencies').select('id,owner_id,name,public_id')
    .eq('kind', 'recharge').eq('is_active', true);
  if (agencyId) query = query.eq('id', agencyId);
  const { data, error } = await query.order('name').order('id');
  if (error) throw error;
  const agencies = (data ?? []).filter(row => Number.isSafeInteger(row.public_id) && row.public_id > 0 && row.owner_id);
  if (!agencies.length) return [];
  const { data: people, error: profileError } = await client.from('profiles')
    .select('id,avatar_url').in('id', [...new Set(agencies.map(row => row.owner_id))]);
  if (profileError) throw profileError;
  const avatars = new Map((people ?? []).map(row => [row.id, imageUrl(row.avatar_url)]));
  return agencies.map(row => ({
    id: row.id, ownerId: row.owner_id, name: row.name, publicId: row.public_id,
    avatar: avatars.get(row.owner_id) || '',
  }));
}

export async function fetchRechargeHistory(accountId: string): Promise<RechargeHistoryRow[]> {
  if (!stagingBackend) throw new Error('Recharge service unavailable');
  const [ledger, requests] = await Promise.all([
    stagingBackend.from('wallet_ledger').select('operation_id,transaction_id,amount_change,created_at')
      .eq('user_id', accountId).eq('currency', 'coins')
      .in('kind', ['agent_topup', 'owner_grant']).gt('amount_change', 0)
      .order('created_at', { ascending: false }).limit(50),
    stagingBackend.rpc('phase4_recharge_state'),
  ]);
  if (ledger.error) throw ledger.error;
  if (requests.error) throw requests.error;
  const ownRequests = (requests.data?.requests as {
    id: string; user_id: string; coins: number; status: string; created_at: string;
  }[] | undefined) ?? [];
  return [
    ...(ledger.data ?? []).map(row => ({ id: row.transaction_id || row.operation_id, date: row.created_at, coins: Number(row.amount_change), status: 'completed' })),
    ...ownRequests.filter(row => row.user_id === accountId && ['pending', 'failed'].includes(row.status)).map(row => ({ id: row.id, date: row.created_at, coins: Number(row.coins), status: row.status })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
