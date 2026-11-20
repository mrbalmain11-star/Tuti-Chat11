import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { stagingBackend } from '../services/stagingBackend';

type Announcement = {
  id: string; room_id: string; sender_id: string; recipient_id: string; sender_name: string; recipient_name: string;
  gift_name: string; quantity: number; total_coins: number; created_at: string;
};

/** Read-only, server-issued announcements. Never derives global events from local sends. */
export const GlobalGiftBanner: React.FC = () => {
  const { isLoggedIn, enterRoom, activeRoom, rooms } = useApp();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [avatars, setAvatars] = useState({ sender: '', recipient: '' });
  const cursor = useRef<string | null>(null);
  const pending = useRef<Announcement[]>([]);
  const seen = useRef(new Set<string>());
  const displayedId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !stagingBackend) { cursor.current = null; pending.current = []; displayedId.current = null; seen.current.clear(); setAnnouncement(null); return; }
    let active = true;
    let busy = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const showNext = () => {
      if (!active || displayedId.current || !pending.current.length) return;
      const next = pending.current.shift()!;
      displayedId.current = next.id;
      setAnnouncement(next);
      setAvatars({ sender: '', recipient: '' });
      void stagingBackend!.from('profiles').select('id,avatar_url')
        .in('id', [next.sender_id, next.recipient_id])
        .then(({ data: profiles, error: profileError }) => {
          if (!active || profileError || displayedId.current !== next.id) return;
          const avatarFor = (id: string) => {
            const path = profiles?.find(profile => profile.id === id)?.avatar_url;
            if (!path) return '';
            return /^https?:\/\//.test(path) ? path : stagingBackend!.storage.from('profile-avatars').getPublicUrl(path).data.publicUrl;
          };
          setAvatars({ sender: avatarFor(next.sender_id), recipient: avatarFor(next.recipient_id) });
        });
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!active || displayedId.current !== next.id) return;
        displayedId.current = null;
        setAnnouncement(null);
        showNext();
      }, 5300);
    };
    const poll = async () => {
      if (busy || !active) return;
      busy = true;
      try {
        const { data, error } = await stagingBackend!.from('gift_global_announcements')
          .select('id,room_id,sender_id,recipient_id,sender_name,recipient_name,gift_name,quantity,total_coins,created_at')
          .order('created_at', { ascending: false }).limit(12);
        if (error) throw error;
        if (!active) return;
        const rows = (data || []) as Announcement[];
        if (cursor.current === null) {
          cursor.current = rows[0]?.created_at || new Date().toISOString();
          return; // Do not replay historic announcements on login.
        }
        const fresh = rows.filter(row => row.created_at > cursor.current! && !seen.current.has(row.id));
        if (rows[0]?.created_at && rows[0].created_at > cursor.current) cursor.current = rows[0].created_at;
        const eligible = fresh.filter(row => row.total_coins >= 7000 && !!row.room_id && !seen.current.has(row.id));
        fresh.forEach(row => seen.current.add(row.id));
        if (seen.current.size > 500) seen.current = new Set(rows.map(row => row.id));
        pending.current.push(...eligible.reverse());
        if (pending.current.length > 30) pending.current.splice(0, pending.current.length - 30);
        showNext();
      } catch (error) {
        console.error('Global gift announcement unavailable:', error);
      } finally { busy = false; }
    };
    void poll();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void poll(); }, 6000);
    return () => { active = false; displayedId.current = null; clearInterval(timer); if (hideTimer) clearTimeout(hideTimer); };
  }, [isLoggedIn]);

  if (!announcement) return null;
  const openRoom = () => {
    const room = rooms.find(item => item.id === announcement.room_id);
    if (activeRoom?.id === announcement.room_id) { setAnnouncement(null); return; }
    if (room) {
      enterRoom(room.id);
    } else {
      // Never navigate to an unverified room. Fetch server-backed room metadata.
      void import('../services/stagingBackend').then(({ fetchRealRooms }) => fetchRealRooms())
        .then(async rows => {
          const found = rows.find(item => item.id === announcement.room_id);
          if (!found) { alert('الغرفة غير متاحة أو لا تملك صلاحية الدخول إليها.'); return; }
          const { mapRoomToUi } = await import('../services/mapRoomToUi');
          enterRoom(found.id, mapRoomToUi(found));
        }).catch(() => alert('تعذر التحقق من الغرفة. حاول مرة أخرى.'));
    }
    setAnnouncement(null);
  };
  return <button type="button" dir="rtl" onClick={openRoom}
    className="pointer-events-auto fixed top-[max(72px,env(safe-area-inset-top))] left-0 z-[150] w-[min(94vw,420px)] overflow-visible text-center"
    style={{ animation: 'totichat-royal-cross 5.3s linear both' }} aria-label="فتح غرفة الإعلان">
    <style>{`@keyframes totichat-royal-cross { from { transform: translateX(-110%); left: 0; } to { transform: translateX(0); left: 100%; } }`}</style>
    <div className="relative flex min-h-20 items-center justify-center rounded-[28px] border-2 border-amber-300 bg-gradient-to-r from-[#32113f] via-[#8a2555] to-[#4d1739] px-12 py-3 shadow-[0_8px_30px_rgba(203,155,53,.55)]">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-amber-300 bg-[#291b35] shadow-[0_0_12px_#e9b55e]">{avatars.sender ? <img src={avatars.sender} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="text-amber-200">★</span>}</span>
      <span className="min-w-0 flex-1 text-sm font-black leading-5 text-[#fff1c4] drop-shadow-[0_2px_3px_#210819]"><span className="block truncate">{announcement.sender_name} أهدى إلى {announcement.recipient_name}</span><span className="block truncate text-xs">{announcement.gift_name} ×{announcement.quantity} · {announcement.total_coins.toLocaleString('ar-IQ')} عملة</span></span>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-amber-300 bg-[#291b35] shadow-[0_0_12px_#e9b55e]">{avatars.recipient ? <img src={avatars.recipient} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="text-amber-200">★</span>}</span>
    </div>
  </button>;
};
