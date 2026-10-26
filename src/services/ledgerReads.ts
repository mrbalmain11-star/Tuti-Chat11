import { stagingBackend } from './stagingBackend';
import type { Transaction } from '../types';

type LedgerRow = {
  id: string;
  currency: string;
  amount_change: number | string;
  kind: string;
  created_at: string;
};

export async function fetchMyLedger(): Promise<Transaction[]> {
  if (!stagingBackend) throw new Error('Staging backend not configured');
  const { data: auth, error: authError } = await stagingBackend.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await stagingBackend.from('wallet_ledger')
    .select('id,currency,amount_change,kind,created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as LedgerRow[]).flatMap(row => {
    const amount = Number(row.amount_change);
    if (!Number.isSafeInteger(amount)) return [];
    const kind = row.kind.toLowerCase();
    const type: Transaction['type'] = kind.includes('gift')
      ? (amount < 0 ? 'gift_send' : 'gift_receive')
      : kind.includes('charge') || kind.includes('topup') ? 'charge' : 'reward';
    return [{
      id: row.id,
      type,
      title: row.kind + ' (' + row.currency + ')',
      amount,
      timestamp: row.created_at,
      status: 'نجاح' as const,
    }];
  });
}
