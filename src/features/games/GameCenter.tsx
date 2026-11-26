import { useEffect, useRef, useState } from 'react';
import { gameAsset, gameName, games, loadSharedGames, recoveredGames, type SharedSnapshot } from './api';
import { EmbeddedGame, additionalGameCards, getEmbeddedGame } from './embeddedGames';
import { UnoPractice } from './uno/UnoPractice';
import { Domino } from './Domino';
import { SharedRoundPanel } from './SharedRoundPanel';

export function GameCenter({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const [snapshot, setSnapshot] = useState<SharedSnapshot>();
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [query, setQuery] = useState('');
  const catalog = [
    ...recoveredGames.map(([code, name, english]) => ({ code, name, english, icon: gameAsset + 'stage6/' + code + '.webp' })),
    ...[...games, ...additionalGameCards].filter(([code]) => !recoveredGames.some(([recovered]) => recovered === code))
      .map(([code, name, icon]) => ({ code, name, english: code, icon })),
  ].filter(({ code, name, english }) => [name, english, getEmbeddedGame(code)?.name ?? '']
    .some(label => label.toLowerCase().includes(query.trim().toLowerCase())));
  const standalone = selected === 'domino' || selected === 'uno';
  const embedded = getEmbeddedGame(selected);
  const [minimized, setMinimized] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const reload = useRef(() => {});
  const lastBalance = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let request = 0;
    let inFlight = false;
    let deadline = 0;
    setSnapshot(undefined);
    setSeconds(0);
    const tick = () => setSeconds(Math.max(0, Math.min(30, Math.ceil((deadline - performance.now()) / 1000))));
    const refresh = () => {
      if (standalone) return;
      if (inFlight) return;
      inFlight = true;
      const id = ++request;
      const sent = performance.now();
      void loadSharedGames(getEmbeddedGame(selected) ? undefined : selected).then(data => {
        if (!active || id !== request) return;
        const duration = Date.parse(data.closes_at) - Date.parse(data.server_time);
        deadline = sent + duration;
        tick();
        setSnapshot(data);
        setError(false);
        if (lastBalance.current !== undefined && lastBalance.current !== data.balance) {
          window.dispatchEvent(new Event('totichat:wallet-changed'));
        }
        lastBalance.current = data.balance;
      }).catch(() => {
        if (active && id === request) setError(true);
      }).finally(() => { inFlight = false; });
    };
    reload.current = refresh;
    refresh();
    window.addEventListener('online', refresh);
    const poll = window.setInterval(refresh, 2500);
    const timer = window.setInterval(tick, 200);
    return () => {
      active = false;
      window.removeEventListener('online', refresh);
      window.clearInterval(poll);
      window.clearInterval(timer);
    };
  }, [selected, standalone]);

  return <>
    {minimized && <button type="button" className="absolute bottom-28 end-3 z-[95] rounded-full bg-emerald-950 px-3 py-2 text-white"
      onClick={() => setMinimized(false)}>استعادة اللعبة</button>}
    <section role="dialog" aria-label="مركز ألعاب TotiChat" dir="rtl" hidden={minimized}
      className="absolute inset-x-0 bottom-0 z-[95] mx-auto max-h-[85dvh] max-w-md overflow-y-auto rounded-t-3xl
        border-t border-amber-500/70 bg-[#101c16] p-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-2xl">
      <header className="flex flex-wrap items-center gap-2 border-b border-white/15 pb-2">
        <img src="/icon.svg" alt="" className="h-9 w-9 rounded-lg" />
        <h2 className="font-bold">{embedded?.name ?? (selected ? gameName(selected) : 'مركز الألعاب')}</h2>
        <button type="button" className="ms-auto px-2" onClick={() => setMinimized(true)}>تصغير</button>
        <button type="button" className="px-2" onClick={onClose}>إغلاق</button>
      </header>
      <div className="my-3 flex justify-between gap-2 text-sm text-amber-200">
        {selected && <button type="button" onClick={() => setSelected(undefined)}>الألعاب</button>}
        {!standalone && snapshot && <span>رصيدك <bdi>{snapshot.balance?.toLocaleString('en-US') ?? '—'}</bdi> كوينز</span>}
      </div>
      {!standalone && error && <p role="alert" className="my-3 text-red-300">تعذر الاتصال بخادم الألعاب. يُعاد الاتصال تلقائياً.</p>}
      {!standalone && !snapshot && !error && <p role="status">جارٍ تحميل الألعاب…</p>}
      {!standalone && snapshot && !snapshot.funded && <p role="status" className="mb-3 text-amber-200">محفظة الألعاب غير ممولة.</p>}
      {selected === 'domino' ? <Domino paused={minimized} /> : selected === 'uno' ? <UnoPractice paused={minimized} /> : embedded && !minimized ? (
        <EmbeddedGame game={embedded} accountId={accountId} onClose={() => setSelected(undefined)} />
      ) : selected && !embedded && snapshot ? (
        <SharedRoundPanel key={selected} code={selected} accountId={accountId} snapshot={snapshot}
          seconds={seconds} online={!error} refresh={() => reload.current()} />
      ) : !selected && <>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن لعبة"
          aria-label="ابحث عن لعبة" className="mb-3 w-full rounded-xl border border-amber-400/35 bg-black/20 px-3 py-2" />
        {!catalog.length && <p>لا توجد ألعاب مطابقة.</p>}
        <div className="grid grid-cols-3 gap-2">
        {catalog.map(({ code, name, icon }) => {
          const game = snapshot?.catalog.find(item => item.code === code);
          const gameModule = getEmbeddedGame(code);
          const enabled = code === 'domino' || code === 'uno' || (gameModule ? gameModule.enabled : game?.enabled && !error);
          return <button key={code} type="button" disabled={!enabled}
            className="grid min-w-0 justify-items-center rounded-xl border border-white/10 bg-white/5 p-1.5 text-xs disabled:opacity-65"
            onClick={() => setSelected(code)}>
            <img src={icon.startsWith('/') ? icon : gameAsset + (gameModule?.icon ?? icon) + '.png'} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
            <strong className="mt-1">{gameModule?.name ?? name}</strong>
            {code === 'uno' && <span>تدريب محلي</span>}
            {!enabled && <span>غير متاحة</span>}
          </button>;
        })}
      </div></>}
    </section>
  </>;
}
