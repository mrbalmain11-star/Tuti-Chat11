import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCpFramePreference } from '../services/cpFramePreference';
import { imageUrl } from '../services/imageUrl';
import { stagingBackend } from '../services/stagingBackend';
import { sounds } from '../utils/audio';
import { CpWingAvatarFrame } from './CpWingAvatarFrame';
import { VipAvatarFrame } from './VipAvatarFrame';
import { UserResult, type SearchUser } from './SearchModal';

const labels = { friends: 'الأصدقاء', following: 'متابعة', fans: 'المعجبون', visitors: 'الزوار' };
type Kind = keyof typeof labels;
type SocialUser = SearchUser & { following: boolean; cp_frame: boolean; visited_at: string | null };
type Stats = Record<Kind, number | null> & { matches: number; rows: SocialUser[] };
const pageSize = 30;
const visitsFormat = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' });

export function ProfileSocialStats({ viewerId, targetId, enabled, compact = false }: {
  viewerId: string;
  targetId?: string;
  enabled: boolean;
  compact?: boolean;
}) {
  const { openProfileForUser, toggleFollowHost } = useApp();
  const instanceId = useId();
  const [kind, setKind] = useState<Kind | null>(null);
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const scope = JSON.stringify([viewerId, targetId]);
  const key = JSON.stringify([scope, kind, query, offset, attempt]);
  const refreshRef = useRef<() => void>(() => {});
  const [countResponse, setCountResponse] = useState<{ scope: string; data: Stats | null }>();
  const counts = countResponse?.scope === scope ? countResponse.data : undefined;
  const [response, setResponse] = useState<{ key: string; data: Stats | null }>();
  const data = response?.key === key ? response.data : undefined;
  const visitorsPrivate = Boolean(targetId);

  useEffect(() => {
    if (enabled) return;
    setKind(null);
    setQuery('');
    setOffset(0);
    setResponse(undefined);
    setCountResponse(undefined);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !kind) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setKind(null);
    };
    window.addEventListener('keydown', onKey);
    const listener = Capacitor.getPlatform() === 'android'
      ? CapacitorApp.addListener('backButton', () => setKind(null))
      : null;
    void listener?.catch(console.error);
    return () => {
      window.removeEventListener('keydown', onKey);
      void listener?.then(handle => handle.remove()).catch(console.error);
    };
  }, [enabled, kind]);

  useEffect(() => {
    if (!enabled || !viewerId) return;
    const client = stagingBackend;
    if (!client) {
      setResponse({ key, data: null });
      setCountResponse({ scope, data: null });
      return;
    }
    let request: AbortController | undefined;
    const refresh = async () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      try {
        const result = await client.rpc('profile_stats', {
          p_target: targetId ?? null, p_kind: kind, p_query: query, p_offset: offset,
        }).abortSignal(controller.signal);
        if (result.error || !Array.isArray(result.data?.rows)) throw result.error ?? new Error('Invalid profile stats');
        if (!controller.signal.aborted) {
          setCountResponse({ scope, data: result.data });
          if (offset > 0 && offset >= result.data.matches) setOffset(0);
          else setResponse({ key, data: result.data });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Profile statistics could not be loaded:', error);
          setResponse({ key, data: null });
          setCountResponse({ scope, data: null });
        }
      }
    };
    refreshRef.current = refresh;
    const followChanged = () => { setPending(null); void refresh(); };
    const firstLoad = window.setTimeout(refresh, query ? 230 : 0);
    const visible = () => { if (!document.hidden) void refresh(); };
    const interval = window.setInterval(visible, targetId ? 12000 : 30000);
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('totichat:follows-changed', followChanged);
    return () => {
      refreshRef.current = () => {};
      request?.abort();
      window.clearTimeout(firstLoad);
      window.clearInterval(interval);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('totichat:follows-changed', followChanged);
      setPending(null);
    };
  }, [enabled, viewerId, targetId, kind, query, offset, key, scope]);

  useEffect(() => {
    if (!enabled || !viewerId || !stagingBackend) return;
    const client = stagingBackend;
    let timer: number | undefined;
    const invalidate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => refreshRef.current(), 150);
    };
    const filter = { schema: 'public', table: 'profile_stats_updates', filter: 'user_id=eq.' + viewerId };
    const channel = client.channel('profile-stats-' + instanceId)
      .on('postgres_changes', { ...filter, event: 'INSERT' }, invalidate)
      .on('postgres_changes', { ...filter, event: 'UPDATE' }, invalidate)
      .subscribe(status => { if (status === 'SUBSCRIBED') invalidate(); });
    return () => { window.clearTimeout(timer); void client.removeChannel(channel); };
  }, [enabled, viewerId, instanceId]);

  const gridClass = compact
    ? 'grid grid-cols-4 gap-2 text-center mt-4 p-2.5 rounded-2xl bg-white/95 border border-amber-200/90 shadow-xs'
    : 'grid grid-cols-4 gap-1 text-center mt-6 pt-1 px-1 min-w-0';
  return <>
    <div className={gridClass} aria-busy={enabled && counts === undefined}>
      {(Object.keys(labels) as Kind[]).map(option => {
        const privateOption = option === 'visitors' && visitorsPrivate;
        return <button type="button" key={option} disabled={privateOption}
          aria-label={privateOption ? 'قائمة الزوار خاصة بصاحب الملف' : labels[option]}
          onClick={() => { sounds.playClick(); setQuery(''); setOffset(0); setKind(option); }}
          className="active:scale-95 transition disabled:cursor-default">
          <span className={compact ? 'text-xl font-bold text-slate-900 block font-sans' : 'text-2xl font-black text-slate-900 block font-sans'}>
            {privateOption ? '—' : counts?.[option] ?? (counts === null ? '—' : '…')}
          </span>
          <span className={compact ? 'text-xs text-slate-500 font-bold mt-0.5 block' : 'text-xs text-slate-500 font-bold mt-1 block'}>
            {labels[option]}
          </span>
        </button>;
      })}
    </div>
    {enabled && counts === null && <p className="mt-2 text-center text-xs text-red-700" role="alert">
      تعذر تحميل إحصائيات الملف. <button type="button" className="underline" onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button>
    </p>}
    {enabled && kind && createPortal(
      <div className="royal-search-overlay" dir="rtl">
        <section className="royal-search-dialog" role="dialog" aria-modal="true" aria-label={labels[kind]}>
          <header className="royal-search-header">
            <h2>{labels[kind]}{data ? ' (' + data[kind] + ')' : ''}</h2>
            <button type="button" aria-label="إغلاق القائمة" onClick={() => setKind(null)}><X /></button>
          </header>
          <div className="royal-search-input">
            <input type="search" value={query} maxLength={80} aria-label="بحث بالاسم أو رقم ID"
              placeholder="ابحث بالاسم أو رقم ID"
              onChange={event => { setOffset(0); setQuery(event.target.value); }} />
          </div>
          <div className="royal-search-results" aria-live="polite">
            {data === undefined ? <p role="status">جارٍ تحميل القائمة…</p>
              : data === null ? <p role="alert">تعذر تحميل القائمة. <button type="button" onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button></p>
              : !data.rows.length ? <p>{query ? 'لا توجد نتائج للبحث.' : 'لا توجد حسابات في هذه القائمة.'}</p>
              : data.rows.map(user => <div key={user.id}>
                <UserResult user={user} onOpen={() => {
                  setKind(null);
                  openProfileForUser({ id: user.id, name: user.name, avatar: imageUrl(user.avatar),
                    vipLevel: user.vip, wealthLevel: user.wealth, charmLevel: user.charm, isSpecialId: user.badge === 'special' });
                }} frameOverride={user.cp_frame && getCpFramePreference(user.id) !== 'off'
                  ? <CpWingAvatarFrame enabled name={user.name} />
                  : !user.frame && user.vip > 0 ? <VipAvatarFrame level={user.vip} /> : undefined
                } details={<>
                  {kind === 'visitors' && user.visited_at && <small>آخر زيارة {visitsFormat.format(new Date(user.visited_at))}</small>}
                  {user.id !== viewerId && <small>{user.following ? 'تتابعه' : 'لا تتابعه'}</small>}
                </>} />
                {kind === 'following' && !targetId && user.following && <button type="button"
                  className="my-1 mr-3 rounded border border-amber-400 px-2 py-1 text-xs text-amber-100"
                  disabled={pending !== null} onClick={() => { if (toggleFollowHost(user.id, false)) setPending(user.id); }}>
                  {pending === user.id ? 'جارٍ التحديث…' : 'إلغاء المتابعة'}
                </button>}
              </div>)}
            {data && (offset > 0 || offset + pageSize < data.matches) &&
              <nav className="flex justify-center gap-4 py-2" aria-label="صفحات القائمة">
                <button type="button" disabled={!offset} className="disabled:opacity-40" onClick={() => setOffset(value => value - pageSize)}>السابق</button>
                <button type="button" disabled={offset + pageSize >= data.matches} className="disabled:opacity-40" onClick={() => setOffset(value => value + pageSize)}>التالي</button>
              </nav>}
          </div>
        </section>
      </div>, document.body,
    )}
  </>;
}
