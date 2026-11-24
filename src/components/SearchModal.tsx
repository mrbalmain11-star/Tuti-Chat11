import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Crown, DoorOpen, Info, Search, UserRound, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { stagingBackend, type BackendRoom } from '../services/stagingBackend';
import { imageUrl } from '../services/imageUrl';
import { mapRoomToUi } from '../services/mapRoomToUi';
import { getStorageAsset } from '../data/storageItems';
import { RoyalLevelEmblem } from './RoyalLevelEmblem';
import { StorageItemVisual } from './StorageItemVisual';
import { VIP_BEAST_METADATA } from './VipBadge';
import './royal-search.css';

export type SearchUser = {
  id: string; name: string; avatar: string | null; public_id: string | null;
  badge: 'admin' | 'special' | 'normal'; gender: string | null; vip: number;
  wealth: number; charm: number; frame: string | null; royal_track: 'wealth' | 'charm' | null; royal_level: number | null;
};
type SearchRoom = BackendRoom & { members: number; level: number; rank: number | null };
type SearchKind = 'rooms' | 'users';
type Result = SearchUser | SearchRoom;
const idImages = { admin: 'id-admin-red', special: 'id-special-pink', normal: 'id-normal-blue' };

function normalize(input: string) {
  return input.trim().replace(/\s+/g, ' ').replace(/[٠-٩۰-۹]/g, numeral => {
    const code = numeral.charCodeAt(0);
    return String(code - (code < 1776 ? 1632 : 1776));
  });
}

function Wing() {
  return <svg viewBox="0 0 44 44" aria-hidden="true" className="royal-search-wing" fill="currentColor">
    <path d="M5 2c7 14 22 18 33 30C21 28 7 21 5 2Zm-3 12c7 9 16 13 30 20C16 34 6 28 2 14Zm5 15c8 4 16 6 29 8-9 4-22 3-29-8Zm10 11 22-2 4 4c-10 2-17 2-26-2Z" />
  </svg>;
}

export function UserResult({ user, onOpen, details, frameOverride }: {
  user: SearchUser; onOpen: () => void; details?: ReactNode; frameOverride?: ReactNode;
}) {
  const avatar = imageUrl(user.avatar);
  const frame = getStorageAsset('', user.frame);
  const vip = VIP_BEAST_METADATA[user.vip];
  const gender = ['male', 'ذكر'].includes(user.gender ?? '') ? '♂' : ['female', 'أنثى'].includes(user.gender ?? '') ? '♀' : '';
  return <button type="button" className="royal-search-result" onClick={onOpen}>
    <span className="royal-search-picture">
      {avatar ? <img src={avatar} alt="" className="royal-search-avatar" /> : <UserRound />}
      {frameOverride ?? (frame ? <span className="royal-search-frame"><StorageItemVisual url={frame} name="" /></span> :
        user.royal_track && user.royal_level ? <span className="royal-search-frame">
          <RoyalLevelEmblem track={user.royal_track} kind="frame" level={user.royal_level} size={60} animated={false} />
        </span> : null)}
    </span>
    <span className="royal-search-result-text"><strong>{user.name} {gender}</strong>
      <span className="royal-search-meta">
        {user.public_id && <bdi><img className="royal-search-id" alt="" src={'/assets/id-badges/' + idImages[user.badge] + '.png'} />{user.public_id}</bdi>}
        {vip && <img className="royal-search-vip" src={vip.badgeImg} alt={'VIP ' + user.vip} />}
      </span>
      <small>الثروة {user.wealth} · الجاذبية {user.charm}</small>
      {details}
    </span>
  </button>;
}

function RoomResult({ room, onOpen }: { room: SearchRoom; onOpen: () => void }) {
  const cover = imageUrl(room.cover_path, 'totichat-room-images');
  return <button type="button" className="royal-search-result" onClick={onOpen}>
    <span className="royal-search-picture">
      {cover ? <img src={cover} alt="" className="royal-search-cover" /> : <DoorOpen />}
      {room.rank && <img src={'/assets/TOP' + room.rank + '.png'} alt={'Top ' + room.rank} className="royal-search-frame" />}
    </span>
    <span className="royal-search-result-text"><strong>{room.title}</strong>
      {room.public_id != null && <bdi>ID: {room.public_id}</bdi>}
      <small>مستوى الغرفة {room.level} · <Users size={13} aria-hidden="true" /> {room.members}</small>
    </span>
  </button>;
}

export function SearchModal() {
  const { openSearchModal, setOpenSearchModal, enterRoom, openProfileForUser } = useApp();
  const [kind, setKind] = useState<SearchKind>('rooms');
  const [input, setInput] = useState('');
  const [attempt, setAttempt] = useState(0);
  const query = normalize(input);
  const key = JSON.stringify([kind, query, attempt]);
  const [response, setResponse] = useState<{ key: string; rows: Result[] | null }>();
  const result = response?.key === key ? response.rows : undefined;

  function close() {
    setOpenSearchModal(false);
    setInput('');
    setKind('rooms');
    setResponse(undefined);
  }

  useEffect(() => {
    if (!openSearchModal || Capacitor.getPlatform() !== 'android') return;
    let active = true;
    // Android dismisses its keyboard before handing the next back press to the app.
    const listener = CapacitorApp.addListener('backButton', () => {
      if (active) {
        setOpenSearchModal(false);
        setInput('');
        setKind('rooms');
        setResponse(undefined);
      }
    });
    void listener.catch(console.error);
    return () => { active = false; void listener.then(handle => handle.remove()).catch(console.error); };
  }, [openSearchModal, setOpenSearchModal]);

  useEffect(() => {
    if (!openSearchModal || (query.length < 2 && !/^\d$/.test(query))) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        if (!stagingBackend) throw new Error('Search unavailable');
        const { data, error } = await stagingBackend.rpc('directory_search', { p_kind: kind, p_query: query }).abortSignal(controller.signal);
        if (error || !Array.isArray(data)) throw error ?? new Error('Invalid search response');
        if (!controller.signal.aborted) setResponse({ key, rows: [...new Map<string, Result>(data.map(row => [row.id, row])).values()] });
      } catch {
        if (!controller.signal.aborted) setResponse({ key, rows: null });
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [openSearchModal, kind, query, key]);

  if (!openSearchModal) return null;
  const hasQuery = query.length >= 2 || /^\d$/.test(query);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (hasQuery) setAttempt(value => value + 1);
  };

  return <div className="royal-search-overlay" dir="rtl">
    <section className="royal-search-dialog" role="dialog" aria-modal="true" aria-label="بحث">
      <div className="royal-search-crown" aria-hidden="true"><Crown /></div>
      <header className="royal-search-header"><Wing /><Search /><h2>بحث</h2><Wing />
        <button type="button" aria-label="إغلاق البحث" onClick={close}><X /></button>
      </header>
      <div className="royal-search-tabs">
        <button type="button" aria-pressed={kind === 'rooms'} onClick={() => { if (kind !== 'rooms') { setKind('rooms'); setAttempt(value => value + 1); } }}><DoorOpen />بحث عن غرفة</button>
        <button type="button" aria-pressed={kind === 'users'} onClick={() => { if (kind !== 'users') { setKind('users'); setAttempt(value => value + 1); } }}><UserRound />بحث عن مستخدم</button>
      </div>
      <form className="royal-search-input" onSubmit={submit}>
        <input autoFocus maxLength={80} type="search" value={input} enterKeyHint="search" aria-label={kind === 'rooms' ? 'اسم أو رقم الغرفة' : 'اسم أو رقم المستخدم'}
          placeholder={kind === 'rooms' ? 'اكتب اسم الغرفة أو رقم ID…' : 'اكتب اسم المستخدم أو رقم ID…'}
          onChange={event => { const next = event.target.value; if (normalize(next) !== query) setAttempt(value => value + 1); setInput(next); }} />
        <button type="submit" aria-label="تنفيذ البحث"><Search /></button>
      </form>
      <div className="royal-search-results" aria-live="polite">
        {!hasQuery ? <p><Info /> يمكنك البحث بالاسم أو رقم ID.</p>
          : result === undefined ? <p role="status">جارٍ البحث…</p>
          : result === null ? <p role="alert">تعذر الاتصال بخادم البحث. <button type="button" onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button></p>
          : !result.length ? <p>لم يتم العثور على نتائج.</p>
          : result.map(row => 'name' in row ? <UserResult key={row.id} user={row} onOpen={() => {
            close();
            openProfileForUser({ id: row.id, name: row.name, avatar: imageUrl(row.avatar), vipLevel: row.vip, wealthLevel: row.wealth, charmLevel: row.charm, isSpecialId: row.badge === 'special' });
          }} /> : <RoomResult key={row.id} room={row} onOpen={() => {
            close();
            enterRoom(row.id, mapRoomToUi({ ...row, owner_avatar: imageUrl(row.owner_avatar), cover_url: imageUrl(row.cover_path, 'totichat-room-images'), background_url: imageUrl(row.background_path, 'totichat-room-images') }));
          }} />)}
      </div>
    </section>
  </div>;
}
