import { useCallback, useEffect, useRef, useState } from 'react';
import { dominoAction, loadDomino, type DominoAction, type DominoLobby, type DominoMatch } from './api';

const outcomes = { win: 'فوز', loss: 'خسارة', draw: 'تعادل' };
const button = 'min-h-10 rounded-xl border border-amber-400/35 bg-emerald-900 px-3 py-1.5 text-sm disabled:opacity-50';
const errors: Record<string, string> = {
  DOMINO_ILLEGAL_MOVE: 'هذه الحركة غير مسموحة.',
  DOMINO_STALE: 'تغيرت حالة الطاولة. حدّثنا بياناتها.',
  DOMINO_DISABLED: 'الدومينو متوقفة إدارياً.',
  DOMINO_INVALID_INVITE: 'تعذر العثور على حساب بهذا المعرّف.',
  DOMINO_TABLE_UNAVAILABLE: 'الطاولة لم تعد متاحة.',
  DOMINO_ALREADY_SEATED: 'لديك طاولة مفتوحة.',
  DOMINO_RATE_LIMIT: 'انتظر قليلاً ثم أعد المحاولة.',
  DOMINO_TURN: 'انتهى الدور أو حان دور اللاعب الآخر.',
};

function Player({ player }: { player: DominoMatch['guest'] }) {
  if (!player) return <span>بانتظار لاعب</span>;
  return <span className="flex min-w-0 items-center gap-2">
    {player.avatar && <img src={player.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />}
    <span className="truncate">{player.name} · {player.public_id ?? '—'}</span>
  </span>;
}

export function Domino({ paused }: { paused: boolean }) {
  const [lobby, setLobby] = useState<DominoLobby>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const [invitee, setInvitee] = useState('');
  const [left, setLeft] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [retry, setRetry] = useState<DominoAction>();
  const running = useRef(false);
  const loading = useRef(false);
  const serverOffset = useRef(0);
  const refresh = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const result = await loadDomino();
      serverOffset.current = Date.parse(result.server_time) - Date.now();
      setLobby(result);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      loading.current = false;
    }
  }, []);

  useEffect(() => {
    if (paused) return;
    void refresh();
    const poll = window.setInterval(refresh, 2500);
    const clock = window.setInterval(() => setNow(Date.now()), 500);
    window.addEventListener('online', refresh);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
      window.removeEventListener('online', refresh);
    };
  }, [paused, refresh]);

  const submit = useCallback(async (action: DominoAction) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setProblem('');
    setRetry(undefined);
    try {
      await dominoAction(action);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setProblem(errors[message] ?? 'تعذر تأكيد الإجراء.');
      if (!errors[message]) setRetry(action);
    } finally {
      running.current = false;
      setBusy(false);
      void refresh();
    }
  }, [refresh]);

  const match = lobby?.current;
  const first = match?.board[0]?.[0];
  const last = match?.board.at(-1)?.[1];
  const canPlay = match?.hand.some(tile => first == null ||
    [first, last].some(end => end === Math.floor(tile / 7) || end === tile % 7));
  const actionForTable = (p_action: DominoAction['p_action'], extra?: Partial<DominoAction>) => {
    void submit({ p_request: crypto.randomUUID(), p_action, p_table: match?.id, p_revision: match?.revision, ...extra });
  };
  const seconds = match?.deadline ? Math.max(0, Math.ceil((Date.parse(match.deadline) - now - serverOffset.current) / 1000)) : null;

  return <div className="space-y-3 text-sm">
    {loadFailed && <p role="alert">تعذر الاتصال بخادم طاولات الدومينو.</p>}
    {problem && <p role="alert">{problem}</p>}
    {retry && <button type="button" className={button} disabled={busy} onClick={() => void submit(retry)}>إعادة إرسال الإجراء</button>}
    {!lobby && !loadFailed && <p role="status">جارٍ تحميل الطاولات…</p>}
    {lobby && <>
      <p>اللاعبون في الجولات العامة الجارية: {lobby.public_players}</p>
      {match ? <>
        <div className="grid grid-cols-2 gap-2"><Player player={match.host} /><Player player={match.guest} /></div>
        {match.status === 'waiting' ? <p>الطاولة جاهزة للانضمام.</p> : <>
          <p>{match.my_turn ? 'دورك' : 'دور اللاعب الآخر'} · {seconds} ث · السحب {match.stock_count} · قطع الخصم {match.other_count}</p>
          <div className="flex flex-wrap gap-1 rounded-xl bg-black/30 p-2" dir="ltr" aria-label="لوحة اللعب">
            {match.board.map(([a, b], index) => <span key={index} className="rounded bg-amber-100 px-2 py-1 font-bold text-emerald-950">{a} │ {b}</span>)}
            {!match.board.length && <span dir="rtl">اللوحة فارغة</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={button} onClick={() => setLeft(!left)}>طرف الإضافة: {left ? 'اليسار' : 'اليمين'}</button>
            <button type="button" className={button} disabled={busy || !match.my_turn || !seconds || canPlay || !match.stock_count}
              onClick={() => actionForTable('draw')}>سحب</button>
            <button type="button" className={button} disabled={busy || !match.my_turn || !seconds || canPlay || match.stock_count > 0}
              onClick={() => actionForTable('pass')}>تمرير</button>
          </div>
          <div className="flex flex-wrap gap-2" dir="ltr" aria-label="قطعك">
            {match.hand.map(tile => {
              const a = Math.floor(tile / 7);
              const b = tile % 7;
              const end = left ? match.board[0]?.[0] : match.board.at(-1)?.[1];
              return <button key={tile} type="button" className={button}
                disabled={busy || !match.my_turn || !seconds || (end != null && end !== a && end !== b)}
                onClick={() => actionForTable('play', { p_tile: tile, p_left: left })}>{a} │ {b}</button>;
            })}
          </div>
        </>}
        <button type="button" className={button} disabled={busy} onClick={() => actionForTable('leave')}>مغادرة الطاولة</button>
      </> : lobby.enabled ? <>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} disabled={busy} onClick={() => actionForTable('create')}>إنشاء طاولة عامة</button>
          <input value={invitee} onChange={event => setInvitee(event.target.value)} aria-label="ID اللاعب المدعو"
            placeholder="ID اللاعب المدعو" inputMode="numeric" maxLength={9} className="min-w-0 rounded-xl border border-white/25 bg-black/20 px-2" />
          <button type="button" className={button} disabled={busy || !/^\d{1,9}$/.test(invitee)}
            onClick={() => actionForTable('create', { p_invitee: Number(invitee) })}>إنشاء طاولة خاصة ودعوة</button>
        </div>
        {lobby.tables.length ? <ul className="space-y-2">{lobby.tables.map(table => <li key={table.id} className="flex justify-between gap-2">
          <Player player={table.host} />
          <button type="button" className={button} disabled={busy} onClick={() => actionForTable('join', { p_table: table.id })}>انضمام</button>
        </li>)}</ul> : <p>لا توجد طاولات متاحة.</p>}
      </> : <p>الدومينو متوقفة إدارياً.</p>}
      <details><summary>آخر 10 جولات</summary>
        {!lobby.history.length && <p>لا توجد جولات مكتملة.</p>}
        {lobby.history.map(round => <p key={round.id} className="py-1">
          {new Date(round.updated_at).toLocaleString('ar-IQ')} · {round.outcome && outcomes[round.outcome]}
        </p>)}
      </details>
    </>}
  </div>;
}
