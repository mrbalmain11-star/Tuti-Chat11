import { useEffect, useState } from 'react';
import { Ban, Crown, MoreVertical, Search, Shield, UserRound, Users, X } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';
import { imageUrl } from '../services/imageUrl';
import { latinDigits } from '../utils/digits';
import { activeVipTier } from '../utils/vipPerks';
import { RoomProfileAvatarFrame } from './RoomProfileCard';
import './room-members-dialog.css';

type Role = 'owner' | 'moderator' | 'member';
type Tab = 'members' | 'moderators' | 'bans';
export type DirectoryMember = {
  id: string; name: string | null; avatar: string | null; publicId: number | null; specialId: string | null;
  role: Role; seat: number | null; isMember: boolean; vip: number; online: boolean;
  chatMuted: boolean; micMuted: boolean; chatMuteByOwner: boolean; micMuteByOwner: boolean;
  ban: { createdAt: string; expiresAt: string | null; reason: string | null; canLift: boolean } | null;
};
type State = { role: Role; rows: DirectoryMember[] };
export type MemberAction = 'profile' | 'warn' | 'muteChat' | 'unmuteChat' | 'mute' | 'allowMic' | 'release_seat'
  | 'kick' | 'temporaryBan' | 'permanentBan' | 'unban' | 'grant' | 'revoke' | 'personalBlock';
const labels: Record<MemberAction, string> = {
  profile: 'عرض الملف الشخصي', warn: 'تحذير المستخدم', muteChat: 'كتم الكتابة', unmuteChat: 'رفع كتم الكتابة',
  mute: 'كتم المايكروفون', allowMic: 'رفع كتم المايكروفون', release_seat: 'إنزال من المايك',
  kick: 'طرد من الغرفة', temporaryBan: 'حظر مؤقت من الغرفة', permanentBan: 'حظر دائم من الغرفة',
  unban: 'فك حظر الغرفة', grant: 'تعيين مشرف', revoke: 'إزالة مشرف', personalBlock: 'حظر شخصي',
};
const tabs = [['members', 'الأعضاء', Users], ['moderators', 'المشرفون', Shield], ['bans', 'المحظورون', Ban]] as const;
const dateFormat = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'Asia/Baghdad', dateStyle: 'short', timeStyle: 'short' });

export function filterMembers(rows: DirectoryMember[], tab: Tab, query: string) {
  const needle = latinDigits(query.trim().normalize('NFKC')).toLowerCase();
  return rows.filter(row => (tab === 'members' ? row.isMember : tab === 'moderators' ? row.role === 'moderator' : !!row.ban)
    && (!needle || [row.name, row.publicId, row.specialId].some(value => value != null
      && latinDigits(String(value).normalize('NFKC')).toLowerCase().includes(needle))));
}

export function memberActions(row: DirectoryMember, viewer: Role, actorId: string, tab: Tab): MemberAction[] {
  const actions: MemberAction[] = ['profile'];
  if (tab === 'bans') return row.ban?.canLift ? [...actions, 'unban'] : actions;
  if (row.id === actorId || row.role === 'owner' || viewer === 'member' || (viewer === 'moderator' && row.role === 'moderator')) return actions;
  if (viewer === 'owner' && row.role === 'moderator') actions.push('revoke');
  else if (viewer === 'owner' && row.isMember) actions.push('grant');
  if (!row.isMember) return actions;
  actions.push('warn');
  if (viewer === 'owner' || !row.chatMuteByOwner) actions.push(row.chatMuted ? 'unmuteChat' : 'muteChat');
  if (row.micMuted && (viewer === 'owner' || !row.micMuteByOwner)) actions.push('allowMic');
  else if (!row.micMuted && row.seat !== null && row.vip < (viewer === 'owner' ? 10 : 8)) actions.push('mute');
  if (row.seat !== null) actions.push('release_seat');
  if (row.vip < 10) actions.push('kick');
  actions.push('temporaryBan', 'permanentBan', 'personalBlock');
  return actions;
}

function banDuration(row: DirectoryMember) {
  if (!row.ban?.expiresAt) return 'حظر دائم';
  const minutes = Math.round((Date.parse(row.ban.expiresAt) - Date.parse(row.ban.createdAt)) / 60000);
  const duration = minutes <= 0 ? '' : minutes >= 1440 ? ` · ${Math.round(minutes / 1440)} يوم`
    : minutes >= 60 ? ` · ${Math.round(minutes / 60)} ساعة` : ` · ${minutes} دقيقة`;
  return 'حظر مؤقت' + duration + ' · ينتهي ' + dateFormat.format(new Date(row.ban.expiresAt));
}

export function RoomMembersDialog({ roomId, actorId, pending, blockedIds, onClose, onAction }: {
  roomId: string; actorId: string; pending: boolean; blockedIds: string[];
  onClose: () => void; onAction: (action: MemberAction, member: DirectoryMember) => Promise<void> | void;
}) {
  const [state, setState] = useState<State>();
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>('members');
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = stagingBackend;
    if (!client) { setError(true); return; }
    let alive = true;
    let loading = false;
    let queued = false;
    async function load() {
      if (!alive) return;
      if (loading) { queued = true; return; }
      loading = true;
      try {
        const { data, error: failure } = await client!.rpc('totichat_room_member_directory', { p_room_id: roomId });
        if (failure || !Array.isArray(data?.rows) || !['owner', 'moderator', 'member'].includes(data.role)) throw failure ?? new Error('Directory unavailable');
        if (!alive) return;
        setState(data as State);
        if (data.role === 'member') setTab(current => current === 'bans' ? 'members' : current);
        setError(false);
      } catch {
        if (alive) { setState(undefined); setError(true); }
      } finally {
        loading = false;
        if (queued && alive) { queued = false; void load(); }
      }
    }
    const refreshRoom = (event: Event) => { if ((event as CustomEvent).detail === roomId) void load(); };
    const events = ['totichat:room-moderators-changed', 'totichat:room-bans-changed', 'totichat:room-seat-changed'];
    events.forEach(name => window.addEventListener(name, refreshRoom));
    window.addEventListener('online', load);
    const timer = window.setInterval(() => { if (!document.hidden && navigator.onLine) void load(); }, 5000);
    void load();
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('online', load);
      events.forEach(name => window.removeEventListener(name, refreshRoom));
    };
  }, [roomId, refresh]);

  const count = state ? filterMembers(state.rows, tab, '').length : null;
  const items = state ? filterMembers(state.rows, tab, query) : [];
  async function act(action: MemberAction, member: DirectoryMember) {
    if (busy || pending) return;
    setBusy(true);
    setMenu(undefined);
    try { await onAction(action, member); }
    finally { setBusy(false); if (action !== 'profile') setRefresh(value => value + 1); }
  }

  return <div className="room-members-overlay" dir="rtl" onClick={onClose}>
    <section className="room-members-dialog" role="dialog" aria-modal="true" aria-labelledby="room-members-title"
      onClick={event => event.stopPropagation()}>
      <div className="room-profile-crown room-members-crown" aria-hidden="true"><span /><Crown /><span /></div>
      <header className="room-members-header">
        <span className="room-members-header-icon" aria-hidden="true"><Users size={20} /></span>
        <div><h2 id="room-members-title">إدارة أعضاء الغرفة</h2><p>إدارة الصلاحيات والمشرفين</p></div>
        <button type="button" aria-label="إغلاق" onClick={onClose}><X size={22} /></button>
      </header>
      <nav className="room-members-tabs" aria-label="قوائم أعضاء الغرفة">
        {tabs.map(([value, name, Icon]) => <button type="button" key={value} aria-pressed={tab === value}
          disabled={value === 'bans' && (!state || state.role === 'member')}
          onClick={() => { setTab(value); setMenu(undefined); }}>
          <Icon size={16} aria-hidden="true" />{name}
        </button>)}
      </nav>
      <p className="room-members-count">{tab === 'members' ? 'الأعضاء المسجلون بالغرفة' : tab === 'moderators' ? 'المشرفون المعيّنون' : 'المحظورون من الغرفة'}
        {count !== null && <> (<bdi>{count}</bdi>)</>}</p>
      <label className="room-members-search"><input type="search" aria-label="بحث بالاسم أو ID" placeholder="بحث عن عضو (الاسم أو ID)"
        value={query} onChange={event => { setQuery(event.target.value); setMenu(undefined); }} /><Search aria-hidden="true" size={20} /></label>
      <div className="room-members-list">
        {!state && (error ? <p role="alert">تعذر تحميل القائمة. <button type="button" className="underline" onClick={() => setRefresh(value => value + 1)}>إعادة المحاولة</button></p>
          : <p role="status">جارٍ تحميل القائمة…</p>)}
        {state && items.length === 0 && <p role="status">{query.trim() ? 'ماكو نتائج للبحث.' : 'القائمة فارغة.'}</p>}
        {state && items.map(row => <article className="room-member-card" key={row.id}>
          <div className="room-member-row">
            <div className="room-member-avatar">
              {row.avatar ? <img src={imageUrl(row.avatar)} alt="" onError={event => { event.currentTarget.hidden = true; }} /> : null}
              <UserRound className="room-member-placeholder" aria-hidden="true" />
              <RoomProfileAvatarFrame userId={row.id} name={row.name ?? ''} isSelf={false} vipTier={activeVipTier(row.vip)} />
              <span className="room-member-presence" data-online={row.online} aria-label={row.online ? 'متصل' : 'غير متصل'} title={row.online ? 'متصل' : 'غير متصل'} />
            </div>
            <div className="room-member-identity"><strong title={row.name ?? undefined}>{row.name || 'مستخدم'}</strong>
              <span dir="ltr">ID: {row.specialId ?? row.publicId ?? '—'}</span>
            </div>
            {row.role !== 'member' && <span className="room-member-rank" data-role={row.role}>
              {row.role === 'owner' ? <><Crown size={15} />مالك الغرفة</> : <><Shield size={15} />مشرف</>}
            </span>}
            <button type="button" className="room-member-more" aria-expanded={menu === row.id} aria-label={'خيارات ' + (row.name ?? 'العضو')}
              onClick={() => setMenu(menu === row.id ? undefined : row.id)}><MoreVertical size={20} /></button>
          </div>
          {tab === 'bans' && row.ban && <p className="room-member-ban">{banDuration(row)}{row.ban.reason && <><br />{row.ban.reason}</>}</p>}
          {menu === row.id && <div className="room-member-menu" aria-label="خيارات العضو">
            {memberActions(row, state.role, actorId, tab).map(action => <button type="button" key={action}
              disabled={busy || pending} onClick={() => void act(action, row)}>{action === 'personalBlock' && blockedIds.includes(row.id) ? 'فك الحظر الشخصي' : labels[action]}</button>)}
          </div>}
        </article>)}
      </div>
      <span className="room-members-jewel" aria-hidden="true" />
    </section>
  </div>;
}
