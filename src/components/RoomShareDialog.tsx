import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link, MessageCircle, Mic, Search, Send, Share2, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { VoiceRoom } from '../types';
import { imageUrl } from '../services/imageUrl';
import { fetchRoomSharePeers, makeRoomShareLink, sendRoomShare, type SharePeer } from '../services/roomShare';
import { StoreAvatarFrame } from './StoreAvatarFrame';
import { RoyalOrnament } from './RoomOptionsDialog';
import './room-share-dialog.css';

const normalize = (text: string) => text.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
  .replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit.charCodeAt(0) < 1776 ? 1632 : 1776)));

export function RoomShareDialog({ room, publicId, members, onClose }: {
  room: VoiceRoom; publicId?: string; members?: number; onClose: () => void;
}) {
  const { currentUser, conversations } = useApp();
  const [peers, setPeers] = useState<SharePeer[]>();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const sending = useRef(false);
  const storageKey = 'totichat:room-share:' + currentUser.id + ':' + room.id;

  useEffect(() => {
    let active = true;
    setError(false);
    const load = () => void fetchRoomSharePeers().then(rows => {
      if (!active) return;
      setPeers(rows);
      setError(false);
      const eligible = new Set(rows.map(peer => peer.id));
      setSelected(previous => previous.filter(id => eligible.has(id)));
    }).catch(() => { if (active) { setPeers(undefined); setError(true); } });
    load();
    window.addEventListener('totichat:personal-blocks-changed', load);
    return () => { active = false; window.removeEventListener('totichat:personal-blocks-changed', load); };
  }, [retry, currentUser.id]);

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(message);
    } catch { setNotice('تعذر النسخ على هذا الجهاز.'); }
  }

  async function send() {
    if (sending.current || !selected.length) return;
    sending.current = true;
    setBusy(true);
    setNotice('');
    let confirmed = 0;
    const failed: string[] = [];
    try {
      const saved = localStorage.getItem(storageKey);
      const nonces: Record<string, string> = saved ? JSON.parse(saved) : {};
      for (const peer of selected) {
        try {
          const nonce = nonces[peer] ?? crypto.randomUUID();
          nonces[peer] = nonce;
          localStorage.setItem(storageKey, JSON.stringify(nonces));
          await sendRoomShare(room.id, peer, nonce);
          confirmed++;
          delete nonces[peer];
          try { localStorage.setItem(storageKey, JSON.stringify(nonces)); } catch { /* A recorded nonce still makes a retry safe. */ }
        } catch { failed.push(peer); }
      }
      setSelected(failed);
      if (confirmed) window.dispatchEvent(new Event('totichat:dm-refresh'));
      setNotice(failed.length
        ? (confirmed ? 'تم الإرسال إلى ' + confirmed + '، وتعذر التأكيد لـ' + failed.length + '. أعد المحاولة للمحددِين.' : 'تعذر تأكيد الإرسال. أعد المحاولة للمحددِين.')
        : 'تم إرسال بطاقة الغرفة إلى ' + confirmed + '.');
    } catch { setNotice('تعذر تجهيز طلب الإرسال على هذا الجهاز.'); }
    finally { sending.current = false; setBusy(false); }
  }

  const term = normalize(query);
  const visible = peers?.filter(peer => !term || normalize(peer.display_name).includes(term)
    || String(peer.public_id ?? '').includes(term) || (peer.special_id ?? '').includes(term));
  const online = new Set(conversations.filter(thread => thread.isOnline).map(thread => thread.userId));
  return <div className="room-share-overlay" dir="rtl" onClick={() => { if (!sending.current) onClose(); }}>
    <section className="room-share-panel" role="dialog" aria-modal="true" aria-label="مشاركة الغرفة" onClick={event => event.stopPropagation()}>
      <RoyalOrnament top />
      <header className="room-share-heading">
        <button type="button" aria-label="إغلاق المشاركة" disabled={busy} onClick={onClose}><X /></button>
        <h3><Share2 />مشاركة الغرفة</h3>
      </header>
      <div className="room-share-preview">
        {room.coverImage ? <img src={room.coverImage} alt="" /> : <Mic aria-hidden="true" />}
        <div><strong>{room.title}</strong>
          {publicId && <button type="button" onClick={() => void copy(publicId, 'تم نسخ رقم الغرفة')}><bdi>ID {publicId}</bdi><Copy size={15} /></button>}
          {members !== undefined && <small><Users size={15} />الموجودون: {members}</small>}
        </div>
      </div>
      <h4><MessageCircle size={18} />إرسال إلى دردشة خاصة</h4>
      <label className="room-share-search"><input placeholder="بحث عن مستخدم بالاسم أو ID…" aria-label="بحث عن مستخدم" value={query}
        onChange={event => setQuery(event.target.value)} /><Search size={17} /></label>
      <div className="room-share-peers">
        {error ? <p role="alert">تعذر تحميل الدردشات. <button type="button" onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</button></p>
          : !peers ? <p role="status">جارٍ تحميل الدردشات…</p>
          : !peers.length ? <p>لا توجد دردشات خاصة متاحة للمشاركة.</p>
          : !visible?.length ? <p>لم يتم العثور على نتائج.</p>
          : visible.map(peer => <label className="room-share-peer" key={peer.id}>
            <input type="checkbox" disabled={busy} checked={selected.includes(peer.id)} onChange={event => {
              const checked = event.target.checked;
              setSelected(previous => checked ? [...previous, peer.id] : previous.filter(id => id !== peer.id));
            }} />
            <span className="room-share-peer-copy"><strong>{peer.display_name}</strong>{online.has(peer.id) && <small>متصل الآن</small>}</span>
            <span className="room-share-avatar">
              <img src={imageUrl(peer.avatar_url) || '/placeholder-avatar.svg'} alt="" />
              <StoreAvatarFrame userId={peer.id} fallback={null} />
            </span>
          </label>)}
      </div>
      {notice && <p className="room-share-status" role="status">{notice}</p>}
      <footer className="room-share-actions">
        <button type="button" onClick={() => void copy(makeRoomShareLink(room.id), 'تم نسخ رابط الغرفة')}><Link size={17} />نسخ الرابط</button>
        <button type="button" disabled={busy || selected.length === 0 || error} onClick={() => void send()}>
          {busy ? <Check size={17} /> : <Send size={17} />} {busy ? 'جارٍ الإرسال…' : 'إرسال'}{selected.length > 0 && ' (' + selected.length + ')'}
        </button>
      </footer>
      <RoyalOrnament />
    </section>
  </div>;
}
