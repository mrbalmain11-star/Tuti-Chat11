import { reportGameIssue } from './gameHealth';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { stagingBackend } from '../../services/stagingBackend';
import { imageUrl } from '../../services/imageUrl';

export const freeGameNames: Record<string, string> = {
  'royal-cars': 'روليت السيارات الملكية',
  'fortune-gem': 'جوهرة الحظ',
  'greedy-original': 'عجلة توتي',
};

type State = {
  enabled: boolean; maintenance: boolean; version: string;
  player: { id: string; publicId: number; name: string; avatar: string | null; coins: number | null } | null;
  leaders: { name: string; id: number; wins: number }[];
};

export function useFreeGame<Result>(code: string, accountId: string) {
  const [state, setState] = useState<State>();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const request = useRef<{ id: string; choice: string } | undefined>(undefined);
  const active = useRef(false);
  const locking = useRef(false);
  useEffect(() => {
    active.current = true;
    let disposed = false;
    let loading = false;
    const refresh = async () => {
      if (!stagingBackend || loading) return;
      loading = true;
      try {
        const response = await stagingBackend.rpc('totichat_embedded_state', { p_code: code });
        if (response.error) throw response.error;
        if (!disposed) { setState(response.data as State); setError(false); }
      } catch {
        if (!disposed) { setError(true); reportGameIssue(accountId, code, 'connection'); }
      } finally {
        loading = false;
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener('online', refresh);
    return () => {
      disposed = true;
      active.current = false;
      window.clearInterval(interval);
      window.removeEventListener('online', refresh);
    };
  }, [code, accountId]);
  const ready = !!state?.enabled && !state.maintenance && state.player?.id === accountId;
  async function play(choice: string): Promise<Result | undefined> {
    if (!stagingBackend || !ready || locking.current) return;
    locking.current = true;
    setBusy(true);
    setError(false);
    const pending = request.current ?? { id: crypto.randomUUID(), choice };
    request.current = pending;
    try {
      const { data, error: playError } = await stagingBackend.rpc('totichat_embedded_play', {
        p_code: code, p_request: pending.id, p_choice: pending.choice,
      });
      if (playError) {
        if (playError.code === 'P0001') request.current = undefined;
        throw playError;
      }
      request.current = undefined;
      if (active.current) return data as Result;
    } catch {
      if (active.current) setError(true);
      if (request.current) reportGameIssue(accountId, code, 'connection');
    } finally {
      locking.current = false;
      if (active.current) setBusy(false);
    }
  }
  return { state, error, busy, ready, play, retrying: !!request.current };
}

export function FreeGameHeader({ state, error, ready, children }: {
  state?: State; error: boolean; ready: boolean; children?: ReactNode;
}) {
  const [leaders, showLeaders] = useState(false);
  const player = state?.player;
  return <>
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-black/75 p-2 text-xs text-amber-100">
      {player?.avatar && <img className="size-8 rounded-full object-cover" src={imageUrl(player.avatar)} alt="" />}
      {player && <span>{player.name} · <bdi>{player.publicId}</bdi> · <bdi>{player.coins?.toLocaleString('en-US') ?? '—'}</bdi> كونز</span>}
      <button type="button" className="ms-auto rounded border border-amber-500 px-2" onClick={() => showLeaders(!leaders)}>المتصدرون</button>
      {children}
    </div>
    <p className="rounded bg-black/75 p-2 text-xs">اللعب مجاني. الرصيد للعرض فقط.</p>
    {error && <p role="alert" className="bg-black p-2">تعذّر الاتصال. تقدر تعيد المحاولة.</p>}
    {state && !ready && <p role="status" className="bg-black p-2">{state.maintenance ? 'اللعبة في الصيانة' : 'اللعبة غير متاحة لهذا الحساب'}</p>}
    {leaders && <ol className="grid gap-1 rounded-xl bg-black/90 p-3 text-sm">
      {!state?.leaders.length && <li>لا توجد نتائج مسجلة بعد</li>}
      {state?.leaders.map(leader => <li key={leader.id}>{leader.name} · <bdi>{leader.id}</bdi> · <bdi>{leader.wins}</bdi> فوز</li>)}
    </ol>}
  </>;
}
