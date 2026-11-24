import { useCallback, useEffect, useState } from 'react';
import { gameAsset, games, loadGames, type Round, type Rules, type Snapshot } from './api';
import { Plinko } from './Plinko';

export function GameCenter({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    let current = true;
    let refreshId = 0;
    const refresh = () => {
      const id = ++refreshId;
      void loadGames().then(data => {
        if (!current || id !== refreshId) return;
        setSnapshot(data);
        setError(false);
      }).catch(() => {
        if (current && id === refreshId) setError(true);
      });
    };
    refresh();
    window.addEventListener('online', refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      current = false;
      window.removeEventListener('online', refresh);
      window.clearInterval(timer);
    };
  }, []);

  const onRound = useCallback((round: Round) => {
    setSnapshot(previous => {
      if (!previous) return previous;
      if (previous.history.some(item => item.request_id === round.request_id)) return previous;
      const history = [...previous.history, round]
        .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 12);
      return { ...previous, history, balance: history[0].balance_after };
    });
  }, []);
  const plinko = snapshot?.catalog.find(game => game.code === 'plinko');
  const rules = plinko?.rules as Rules | undefined;
  return <>
    {minimized && <button type="button" className="absolute bottom-28 end-3 z-[95] rounded-full bg-emerald-950 px-3 py-2 text-white"
      onClick={() => setMinimized(false)}>استعادة اللعبة</button>}
    <section role="dialog" aria-label="مركز ألعاب TotiChat" dir="rtl" hidden={minimized}
      className="absolute inset-x-0 bottom-0 z-[95] mx-auto max-h-[85dvh] max-w-md overflow-y-auto rounded-t-3xl
        border-t border-amber-500/70 bg-[#101c16] p-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-2xl">
      <header className="flex flex-wrap items-center gap-2 border-b border-white/15 pb-2">
        <img src="/icon.svg" alt="" className="h-9 w-9 rounded-lg" />
        <h2 className="font-bold">{selected ? 'باتشينكو' : 'مركز الألعاب'}</h2>
        <button type="button" className="ms-auto px-2" onClick={() => setMinimized(true)}>تصغير</button>
        <button type="button" className="px-2" onClick={onClose}>إغلاق</button>
      </header>
      <div className="my-3 flex justify-between gap-2 text-sm text-amber-200">
        {selected && <button type="button" onClick={() => setSelected(false)}>الألعاب</button>}
        {snapshot && <span>الرصيد التجريبي {snapshot.balance?.toLocaleString('ar-IQ') ?? 'يُفتح عند أول جولة'}</span>}
      </div>
      {error && <p role="alert" className="my-3 text-red-300">تعذر الاتصال بخادم الألعاب. يُعاد الاتصال تلقائياً.</p>}
      {!snapshot && !error && <p role="status">جارٍ تحميل الألعاب…</p>}
      {selected && rules && snapshot ? <>
        {!plinko?.enabled && <p role="status" className="text-amber-200">اللعبة متوقفة إدارياً.</p>}
        <Plinko accountId={accountId} rules={rules} history={snapshot.history} onRound={onRound} />
      </> : <div className="grid grid-cols-3 gap-2">
        {games.map(([code, name, icon]) => {
          const game = snapshot?.catalog.find(item => item.code === code);
          return <button key={code} type="button" disabled={!game?.enabled || error}
            className="grid min-w-0 justify-items-center rounded-xl border border-white/10 bg-white/5 p-1.5 text-xs disabled:opacity-65"
            onClick={() => setSelected(true)}>
            <img src={gameAsset + icon + '.png'} alt="" className="aspect-square w-full rounded-lg object-cover" />
            <strong className="mt-1">{name}</strong>
            {game && !game.enabled && <span>{game.implemented ? 'متوقفة' : 'قيد التجهيز'}</span>}
          </button>;
        })}
      </div>}
    </section>
  </>;
}
