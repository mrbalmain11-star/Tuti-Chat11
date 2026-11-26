import { useEffect, useSyncExternalStore } from 'react';
import { stagingBackend } from './stagingBackend';

export type RankingPeriod = 'daily' | 'weekly' | 'monthly';
type RankingKind = 'wealth' | 'charm' | 'room';
export type RankingRow = { entity_id: string; public_id: number; display_name: string; avatar_url: string | null; score: number };

const empty: RankingRow[] = [];
type Entry = {
  rows: RankingRow[];
  refresh: () => Promise<void>;
  subscribe: (listener: () => void) => () => void;
  snapshot: () => RankingRow[];
};
const entries = new Map<string, Entry>();
const subscribeEmpty = () => () => {};
const emptySnapshot = () => empty;

function rankingEntry(account: string, period: RankingPeriod, kind: RankingKind): Entry {
  const key = JSON.stringify([account, period, kind]);
  const existing = entries.get(key);
  if (existing) return existing;
  const listeners = new Set<() => void>();
  let controller: AbortController | undefined;
  let timer: number;
  const refreshVisible = () => { if (!document.hidden) void entry.refresh(); };
  const entry: Entry = {
    rows: empty,
    snapshot: () => entry.rows,
    refresh: async () => {
      if (!stagingBackend || !listeners.size || controller) return;
      const request = new AbortController();
      controller = request;
      try {
        const { data, error } = await stagingBackend.rpc('live_rankings', { p_period: period, p_kind: kind }).abortSignal(request.signal);
        if (error) throw error;
        if (!Array.isArray(data)) throw new Error('Invalid leaderboard response');
        const seen = new Set<string>();
        const rows = data.filter((row): row is RankingRow => {
          if (!row || typeof row.entity_id !== 'string' || !row.entity_id.trim() ||
            typeof row.display_name !== 'string' || !row.display_name.trim() ||
            (row.avatar_url !== null && typeof row.avatar_url !== 'string')) return false;
          const id = row.entity_id.trim();
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        if (request.signal.aborted) return;
        entry.rows = rows.slice(0, 10);
        listeners.forEach(listener => listener());
      } catch (error) {
        if (!request.signal.aborted) console.error('Rankings load failed:', error);
      } finally {
        if (controller === request) controller = undefined;
      }
    },
    subscribe: listener => {
      listeners.add(listener);
      if (listeners.size === 1) {
        timer = window.setInterval(refreshVisible, 30000);
        window.addEventListener('focus', refreshVisible);
        window.addEventListener('totichat:room-gift-confirmed', refreshVisible);
        document.addEventListener('visibilitychange', refreshVisible);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size) return;
        window.clearInterval(timer);
        window.removeEventListener('focus', refreshVisible);
        window.removeEventListener('totichat:room-gift-confirmed', refreshVisible);
        document.removeEventListener('visibilitychange', refreshVisible);
        controller?.abort();
        controller = undefined;
        queueMicrotask(() => { if (!listeners.size && entries.get(key) === entry) entries.delete(key); });
      };
    },
  };
  entries.set(key, entry);
  return entry;
}

export function useLiveRanking(account: string, period: RankingPeriod, kind: RankingKind, enabled: boolean) {
  const entry = enabled && account ? rankingEntry(account, period, kind) : undefined;
  const rows = useSyncExternalStore(entry?.subscribe ?? subscribeEmpty, entry?.snapshot ?? emptySnapshot);
  useEffect(() => { void entry?.refresh(); }, [entry]);
  return rows;
}
