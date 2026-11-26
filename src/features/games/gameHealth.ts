import { stagingBackend } from '../../services/stagingBackend';

const lastNotification = new Map<string, number>();

export function reportGameIssue(accountId: string, code: string, kind: 'screen' | 'connection') {
  if (!stagingBackend || !navigator.onLine) return;
  const key = JSON.stringify([accountId, code, kind]);
  const now = Date.now();
  if (now - (lastNotification.get(key) ?? 0) < 15 * 60 * 1000) return;
  lastNotification.set(key, now);
  void stagingBackend.rpc('totichat_embedded_report_issue', { p_code: code, p_kind: kind }).then(() => {}, () => {});
}
