import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { stagingBackend } from '../services/stagingBackend';

type Announcement = {
  id: string; room_id: string; sender_id: string; recipient_id: string; sender_name: string; recipient_name: string;
  gift_name: string; quantity: number; total_coins: number; created_at: string;
};

/** Read-only, server-issued announcements. Never derives global events from local sends. */
export const GlobalGiftBanner: React.FC = () => {
  const { isLoggedIn, enterRoom } = useApp();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [avatars, setAvatars] = useState({ sender: '', recipient: '' });
  const cursor = useRef<string | null>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!isLoggedIn || !stagingBackend) { cursor.current = null; seen.current.clear(); setAnnouncement(null); return; }
    let active = true;
    let busy = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
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
        const next = fresh.reverse().find(row => row.total_coins >= 7000 && !!row.room_id);
        if (next) {
          fresh.forEach(row => seen.current.add(row.id));
          if (seen.current.size > 100) seen.current.clear();
          setAnnouncement(next);
          if (hideTimer) clearTimeout(hideTimer);
          hideTimer = setTimeout(() => { if (active) setAnnouncement(null); }, 6500);
        }
      } catch (error) {
        console.error('Global gift announcement unavailable:', error);
      } finally { busy = false; }
    };
    void poll();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void poll(); }, 6000);
    return () => { active = false; clearInterval(timer); if (hideTimer) clearTimeout(hideTimer); };
  }, [isLoggedIn]);

  if (!announcement) return null;
  return <button type="button" dir="rtl" onClick={() => { enterRoom(announcement.room_id); setAnnouncement(null); }}
    className="fixed top-[max(64px,env(safe-area-inset-top))] inset-x-4 z-[95] mx-auto flex max-w-sm flex-col items-center rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-[#063d32] via-[#0a634b] to-[#073629] px-4 py-3 text-center shadow-[0_8px_30px_rgba(203,155,53,.45)]"
    aria-label="فتح غرفة الهدية">
    <span className="w-full truncate text-xs font-black text-amber-100">{announcement.sender_name} أهدى إلى {announcement.recipient_name}</span>
    <span className="mt-1 w-full truncate text-sm font-black text-[#ffe6a0]">{announcement.gift_name} ×{announcement.quantity} · {announcement.total_coins.toLocaleString('ar-IQ')} عملة</span>
    <span className="mt-1 text-[10px] text-emerald-100">اضغط للدخول إلى الغرفة</span>
  </button>;
};
