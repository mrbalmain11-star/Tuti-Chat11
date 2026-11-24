import { useEffect, useState } from 'react';
import { Mic, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mapRoomToUi } from '../services/mapRoomToUi';
import { fetchSharedRoom, type SharedRoom } from '../services/roomShare';

export function SharedRoomMessage({ roomId }: { roomId: string }) {
  const { activeRoom, enterRoom, setIsRoomMinimized, setOpenChatThread } = useApp();
  const [room, setRoom] = useState<SharedRoom | null>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchSharedRoom(roomId).then(value => { if (active) setRoom(value); }).catch(() => { if (active) setRoom(null); });
    return () => { active = false; };
  }, [roomId]);

  async function open() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const latest = await fetchSharedRoom(roomId);
      if (!latest) throw new Error('Room unavailable');
      setOpenChatThread(null);
      if (activeRoom?.id === latest.id) setIsRoomMinimized(false);
      else enterRoom(latest.id, mapRoomToUi(latest));
    } catch { setError(true); }
    finally { setBusy(false); }
  }

  return <div>
    <button type="button" className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-amber-400/70 bg-emerald-950 px-2 py-2 text-start text-amber-50"
      onClick={() => void open()} disabled={busy} dir="rtl">
      {room?.cover_url ? <img src={room.cover_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <Mic className="h-5 w-5 shrink-0" />}
      <span className="flex min-w-0 flex-col">
        <strong className="truncate">{room?.title ?? 'مشاركة غرفة'}</strong>
        {room?.public_id != null && <bdi className="text-xs">ID {room.public_id}</bdi>}
        {room && <small className="flex items-center gap-1"><Users size={13} />{room.members}</small>}
        <span className="mt-1 rounded-md border border-amber-300/60 px-2 text-xs">{busy ? 'جارٍ التحقق…' : 'دخول الغرفة'}</span>
      </span>
    </button>
    {error && <p role="alert" className="text-xs text-rose-700">الغرفة غير متاحة أو تعذر التحقق من الدخول.</p>}
  </div>;
}
