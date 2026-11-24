import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getStorageAsset } from '../data/storageItems';
import { getCpFramePreference } from '../services/cpFramePreference';
import { imageUrl } from '../services/imageUrl';
import { stagingBackend } from '../services/stagingBackend';
import { CpWingAvatarFrame } from './CpWingAvatarFrame';
import { EpicGiftArtwork } from './EpicGiftArtwork';
import { SwordArt } from './GiftAnimationOverlay';
import { RoyalLevelEmblem } from './RoyalLevelEmblem';
import { UserResult, type SearchUser } from './SearchModal';
import { StorageItemVisual } from './StorageItemVisual';
import { VipAvatarFrame } from './VipAvatarFrame';

export type ProfileSection = 'frame' | 'vehicle' | 'gifts' | 'honor';
type InventoryItem = {
  id: string; name: string; icon: string | null; asset: string | null;
  source: 'store' | 'level' | 'vip'; equipped: boolean; expires_at: string | null;
  track: 'wealth' | 'charm' | null; level: number | null;
};
type ReceivedGift = { id: string; name: string | null; icon: string | null; asset: string | null; quantity: string; receipts: string; amount: string };
type Supporter = SearchUser & { rank: number; amount: string; cp_frame: boolean };
type ProfileData = {
  wealth_lifetime_xp: string; charm_lifetime_xp: string;
  items?: InventoryItem[]; gifts?: ReceivedGift[]; supporters?: Supporter[];
  quantity?: string; amount?: string; count?: number;
  active_frame: Pick<InventoryItem, 'id' | 'asset' | 'name' | 'source' | 'track' | 'level'> | null;
};
type Failure = 'forbidden' | 'connection';
const pageSize = 20;
const format = (value: string) => BigInt(value).toLocaleString('ar-IQ');
const sources = { store: 'المتجر', level: 'مكافأة المستوى', vip: 'اشتراك VIP' };
const titles = { frame: 'الإطارات', vehicle: 'المركبات', gifts: 'لوحة الهدايا', honor: 'لوحة الشرف' };

export function useProfileSections(userId: string, section: ProfileSection, enabled: boolean) {
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [response, setResponse] = useState<{ key: string; data?: ProfileData; error?: Failure }>();
  const [summary, setSummary] = useState<{ userId: string; wealth: bigint; charm: bigint; activeFrame: ProfileData['active_frame'] }>();
  const scope = JSON.stringify([userId, section, section === 'honor' ? offset : 0]);
  const refreshRef = useRef<() => void>(() => {});
  const retry = () => setRevision(value => value + 1);
  const result = response?.key === scope ? response : undefined;

  useEffect(() => { setOffset(0); }, [section, userId]);
  useEffect(() => {
    if (enabled) return;
    setSummary(undefined);
    setResponse(undefined);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !userId) return;
    const client = stagingBackend;
    if (!client) {
      setResponse({ key: scope, error: 'connection' });
      return;
    }
    let request: AbortController | undefined;
    let queued = false;
    const refresh = async () => {
      if (request) { queued = true; return; }
      const controller = new AbortController();
      request = controller;
      try {
        const { data, error } = await client.rpc('profile_sections', {
          p_user: userId, p_section: section, p_offset: section === 'honor' ? offset : 0,
        }).abortSignal(controller.signal);
        if (error) throw error;
        if (typeof data?.wealth_lifetime_xp !== 'string' || typeof data?.charm_lifetime_xp !== 'string') {
          throw new Error('Missing profile totals');
        }
        const wealth = BigInt(data.wealth_lifetime_xp);
        const charm = BigInt(data.charm_lifetime_xp);
        if (controller.signal.aborted) return;
        setSummary({ userId, wealth, charm, activeFrame: (data as ProfileData).active_frame });
        setResponse({ key: scope, data });
        if (section === 'honor' && offset > 0 && offset >= data.count) setOffset(0);
      } catch (error) {
        if (controller.signal.aborted) return;
        const forbidden = typeof error === 'object' && error !== null && 'code' in error && error.code === '42501';
        setSummary(undefined);
        setResponse({ key: scope, error: forbidden ? 'forbidden' : 'connection' });
      } finally {
        request = undefined;
        if (queued && !controller.signal.aborted) {
          queued = false;
          void refresh();
        }
      }
    };
    refreshRef.current = refresh;
    void refresh();
    return () => { request?.abort(); refreshRef.current = () => {}; };
  }, [enabled, userId, section, offset, scope, revision]);

  useEffect(() => {
    if (!enabled || !userId || !stagingBackend) return;
    const client = stagingBackend;
    const refresh = () => { if (!document.hidden) refreshRef.current(); };
    const filter = (table: string, field: string) => ({ schema: 'public', table, filter: field + '=eq.' + userId });
    const channel = client.channel('profile-sections-' + userId)
      .on('postgres_changes', { ...filter('gift_events', 'sender_id'), event: 'INSERT' }, refresh)
      .on('postgres_changes', { ...filter('gift_events', 'recipient_id'), event: 'INSERT' }, refresh)
      .on('postgres_changes', { ...filter('store_ownership', 'user_id'), event: '*' }, refresh)
      .on('postgres_changes', { ...filter('vip_entitlements', 'user_id'), event: '*' }, refresh)
      .subscribe(status => { if (status === 'SUBSCRIBED') refresh(); });
    const events = ['focus', 'online', 'totichat:room-gift-confirmed', 'totichat:profile-decoration-changed'];
    events.forEach(event => window.addEventListener(event, refresh));
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 10000);
    return () => {
      events.forEach(event => window.removeEventListener(event, refresh));
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(timer);
      void client.removeChannel(channel);
    };
  }, [enabled, userId]);

  return { result, summary: summary?.userId === userId ? summary : undefined, retry, offset, setOffset };
}

const artwork = {
  'epic-imperial-falcon': 'falcon', 'epic-royal-throne': 'throne', 'epic-legendary-dragon': 'dragon',
  'epic-royal-jet': 'jet', 'epic-royal-lovers-heart': 'heart',
} as const;

function InventoryVisual({ item, play }: { item: InventoryItem; play: boolean }) {
  const url = getStorageAsset(item.id, item.asset);
  if (item.source === 'vip' && item.level) return <img alt={item.name} className="h-full w-full object-contain"
    src={'/assets/vip/frames/vip' + String(item.level).padStart(2, '0') + '.webp'} />;
  if (item.track && item.level) return <RoyalLevelEmblem track={item.track} level={item.level} kind="frame" size={70} animated={play} />;
  if (url) return <StorageItemVisual key={url} url={url} name={item.name} play={play} />;
  return <span className="text-xl">{item.icon || 'المعاينة غير متاحة'}</span>;
}

export function ProfileSections({ section, state, isSelf, cpFrame, openStorage }: {
  section: ProfileSection; state: ReturnType<typeof useProfileSections>; isSelf: boolean; cpFrame: boolean; openStorage: () => void;
}) {
  const { openProfileForUser } = useApp();
  const [preview, setPreview] = useState<string>();
  const [limit, setLimit] = useState(24);
  const { result, retry, offset, setOffset } = state;
  const data = result?.data;
  const supporterCard = (user: Supporter) => <UserResult user={user} onOpen={() => openProfileForUser({
    id: user.id, name: user.name, avatar: imageUrl(user.avatar), vipLevel: user.vip, wealthLevel: user.wealth, charmLevel: user.charm,
  })} frameOverride={user.cp_frame && getCpFramePreference(user.id) !== 'off'
    ? <CpWingAvatarFrame enabled name={user.name} /> : !user.frame && user.vip ? <VipAvatarFrame level={user.vip} /> : undefined}
    details={<small>المركز {user.rank} · {format(user.amount)} عملة</small>} />;
  return <section dir="rtl" className="w-full rounded-2xl border border-amber-300/70 bg-gradient-to-br from-white via-amber-50 to-emerald-50 p-3 text-emerald-950 shadow-sm">
    <h3 className="mb-3 text-center text-sm font-black text-amber-950">{titles[section]}</h3>
    {!result ? <p role="status" className="py-4 text-center text-sm">جارٍ تحميل البيانات…</p>
      : result.error ? <p role="alert" className="py-4 text-center text-sm text-red-800">
        {result.error === 'forbidden' ? 'لا تتوفر صلاحية عرض هذه البيانات.' : 'تعذر تحميل البيانات من الخادم.'}{' '}
        <button type="button" className="underline" onClick={retry}>إعادة المحاولة</button>
      </p> : data && <>
        {(section === 'frame' || section === 'vehicle') && <>
          {section === 'frame' && cpFrame && <div className="mb-2 flex items-center gap-3 rounded-xl border border-amber-300 bg-white p-2">
            <span className="relative m-2 inline-block h-12 w-12"><CpWingAvatarFrame enabled name="إطار CP" /></span>
            <span className="text-xs font-bold">إطار CP · العلاقة المؤكدة · مفعّل</span>
          </div>}
          {!data.items?.length && !(section === 'frame' && cpFrame) && <p className="py-4 text-center text-sm">
            {section === 'vehicle' ? 'لا توجد مركبات لدى هذا المستخدم.' : 'لا توجد إطارات لدى هذا المستخدم.'}
          </p>}
          <div className="grid grid-cols-2 gap-2">
            {data.items?.slice(0, limit).map(item => {
              const equipped = item.equipped && !(section === 'frame' && cpFrame);
              return <button type="button" key={item.source + item.id} className="min-w-0 rounded-xl border border-amber-200 bg-white p-2"
                aria-pressed={preview === item.id} onClick={() => setPreview(value => value === item.id ? undefined : item.id)}>
                <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center">
                  <InventoryVisual item={item} play={equipped || preview === item.id} />
                </span>
                <strong className="block break-words text-xs">{item.name}</strong>
                <small className="block">{sources[item.source]}{equipped ? ' · مفعّل' : ''}</small>
                {item.expires_at && <small className="block">حتى {new Date(item.expires_at).toLocaleDateString('ar-IQ')}</small>}
              </button>;
            })}
          </div>
          {(data.items?.length ?? 0) > limit && <button type="button" className="mt-3 underline" onClick={() => setLimit(n => n + 24)}>عرض المزيد</button>}
          {isSelf && <button type="button" onClick={openStorage} className="mx-auto mt-3 block rounded-full border border-amber-400 bg-white px-4 py-2 text-xs font-bold">فتح التخزين</button>}
        </>}
        {section === 'gifts' && <>
          <p className="mb-2 text-center text-sm font-bold">{format(data.quantity!)} هدية · {format(data.amount!)} عملة</p>
          {!data.gifts?.length && <p className="py-3 text-center text-sm">لا توجد هدايا مستلمة.</p>}
          <ul className="grid grid-cols-2 gap-2">
            {data.gifts?.map(gift => {
              const art = artwork[gift.id as keyof typeof artwork];
              const url = getStorageAsset(gift.id, gift.asset);
              return <li key={gift.id} className="min-w-0 rounded-xl border border-amber-200 bg-white p-2 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center text-2xl [&_svg]:max-h-full [&_svg]:max-w-full">
                  {url ? <StorageItemVisual url={url} name={gift.name || gift.id} /> : gift.id === 'epic-zulfiqar'
                    ? <SwordArt /> : art ? <EpicGiftArtwork kind={art} /> : gift.icon}
                </span>
                <strong className="block break-words text-xs">{gift.name || gift.id}</strong>
                <small className="block">{format(gift.quantity)} هدية · {format(gift.receipts)} عملية</small>
                <small className="block">{format(gift.amount)} عملة</small>
              </li>;
            })}
          </ul>
        </>}
        {section === 'honor' && <>
          {!data.supporters?.length && <p className="py-4 text-center text-sm">لا يوجد داعمون في لوحة الشرف.</p>}
          {offset === 0 && !!data.supporters?.length && <div dir="ltr" className="mb-3 grid grid-cols-3 items-end gap-1 text-center">
            {[3, 1, 2].map(rank => {
              const winner = data.supporters?.find(user => user.rank === rank);
              return <div key={rank} className={rank === 1 ? 'pt-0' : 'pt-5'}>
                {winner && <button type="button" dir="rtl" className={'w-full min-w-0 rounded-xl border-2 bg-white p-1 ' + (
                  rank === 1 ? 'border-yellow-500' : rank === 2 ? 'border-slate-400' : 'border-orange-700')}
                  onClick={() => openProfileForUser({ id: winner.id, name: winner.name, avatar: imageUrl(winner.avatar) })}>
                  <img src={imageUrl(winner.avatar) || '/placeholder-avatar.svg'} alt="" className="mx-auto h-9 w-9 rounded-full object-cover" />
                  <strong className="block truncate text-xs">{rank}. {winner.name}</strong>
                  <small className="block break-words text-[10px]">{format(winner.amount)} عملة</small>
                </button>}
              </div>;
            })}
          </div>}
          {data.supporters?.map(user => <div key={user.id} className="text-white">{supporterCard(user)}</div>)}
          {(offset > 0 || offset + pageSize < (data.count ?? 0)) && <nav aria-label="صفحات الداعمين" className="flex justify-between text-sm">
            <button type="button" disabled={!offset} onClick={() => setOffset(offset - pageSize)}>السابق</button>
            <button type="button" disabled={offset + pageSize >= (data.count ?? 0)} onClick={() => setOffset(offset + pageSize)}>التالي</button>
          </nav>}
        </>}
      </>}
  </section>;
}
