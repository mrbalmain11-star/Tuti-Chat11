import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Clapperboard, Link2, Volume2 } from 'lucide-react';
import { stagingBackend } from '../services/stagingBackend';

function youtubeVideoId(link: string): string | null {
  try {
    const url = new URL(link.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const [, route, pathId] = url.pathname.split('/');
    let id: string | null = null;
    if (url.hostname === 'youtu.be') {
      id = route;
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      if (route === 'watch') id = url.searchParams.get('v');
      if (['embed', 'shorts', 'live'].includes(route)) id = pathId;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

type YouTubePlayer = {
  destroy(): void;
  unMute(): void;
  getVolume(): number;
  setVolume(volume: number): void;
};

type YouTubeApi = {
  Player: new (
    iframe: HTMLIFrameElement,
    options: { events: { onReady: (event: { target: YouTubePlayer }) => void } },
  ) => YouTubePlayer;
};

const youtubeWindow = window as Window & {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
};
let apiRequest: Promise<YouTubeApi> | undefined;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (youtubeWindow.YT?.Player) return Promise.resolve(youtubeWindow.YT);
  apiRequest ??= new Promise<YouTubeApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    const previousCallback = youtubeWindow.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(fail, 15000);

    function fail() {
      window.clearTimeout(timeout);
      youtubeWindow.onYouTubeIframeAPIReady = previousCallback;
      script.remove();
      reject(new Error('YouTube player controls unavailable'));
    }

    youtubeWindow.onYouTubeIframeAPIReady = () => {
      if (!youtubeWindow.YT?.Player) {
        fail();
        return;
      }
      window.clearTimeout(timeout);
      youtubeWindow.onYouTubeIframeAPIReady = previousCallback;
      resolve(youtubeWindow.YT);
      previousCallback?.();
    };
    script.addEventListener('error', fail, { once: true });
    document.head.append(script);
  }).catch(error => {
    apiRequest = undefined;
    throw error;
  });
  return apiRequest;
}

export function RoomTheater({ roomId, isOwner }: { roomId: string; isOwner: boolean }) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const revision = useRef(0);
  const playerHost = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const [soundReadyFor, setSoundReadyFor] = useState<string | null>(null);

  useEffect(() => {
    const host = playerHost.current;
    if (!videoId || !host) return;
    let active = true;
    let instance: YouTubePlayer | undefined;
    const iframe = document.createElement('iframe');
    iframe.className = 'absolute inset-0 h-full w-full';
    iframe.title = 'مشغّل يوتيوب في غرفة المسرح';
    const params = new URLSearchParams({ enablejsapi: '1', origin: window.location.origin, playsinline: '1' });
    iframe.src = `https://www.youtube.com/embed/${videoId}?${params}`;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    host.appendChild(iframe);

    void loadYouTubeApi().then(api => {
      if (!active) return;
      instance = new api.Player(iframe, {
        events: {
          onReady: ({ target }) => {
            if (!active) return;
            player.current = target;
            setSoundReadyFor(videoId);
          },
        },
      });
    }).catch(error => console.warn('Theater sound controls unavailable:', error));

    return () => {
      active = false;
      player.current = null;
      setSoundReadyFor(null);
      instance?.destroy();
      host.replaceChildren();
    };
  }, [videoId]);

  function enableSound() {
    const readyPlayer = player.current;
    if (!readyPlayer) return;
    if (readyPlayer.getVolume() === 0) readyPlayer.setVolume(100);
    readyPlayer.unMute();
  }


  useEffect(() => {
    const backend = stagingBackend;
    if (!backend) return;
    let active = true;
    let timer: number;
    async function refresh() {
      const requestedRevision = revision.current;
      const { data, error } = await backend!.from('room_theater_videos')
        .select('video_id').eq('room_id', roomId).maybeSingle();
      if (!active) return;
      if (!error && requestedRevision === revision.current) setVideoId(data?.video_id ?? null);
      timer = window.setTimeout(refresh, 4000);
    }
    void refresh();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [roomId]);

  async function saveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isOwner || saving || !stagingBackend) return;
    const id = youtubeVideoId(link);
    if (!id) {
      setError('أدخل رابط فيديو صالح من يوتيوب');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { error } = await stagingBackend.from('room_theater_videos')
        .upsert({ room_id: roomId, video_id: id }, { onConflict: 'room_id' });
      if (error) throw error;
      revision.current += 1;
      setVideoId(id);
      setEditing(false);
    } catch {
      setError('تعذّر حفظ الرابط. حاول مرة ثانية.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="relative z-10 mx-auto w-full shrink-0 max-w-[540px] px-3 pt-1 text-center" dir="rtl">
      <h2 className="mb-1 flex items-center justify-center gap-2 font-bold text-amber-200">
        <Clapperboard size={18} aria-hidden="true" /> وضع المسرح
        {videoId && soundReadyFor === videoId && (
          <button type="button" onClick={enableSound}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-1 text-xs text-white">
            <Volume2 size={14} aria-hidden="true" /> تفعيل الصوت
          </button>
        )}
      </h2>
      <div className="relative mx-auto aspect-video w-[min(100%,48dvh)] overflow-hidden rounded-2xl border border-emerald-200/50 bg-black/85">
        {videoId ? (
          <div ref={playerHost} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-4 text-sm text-emerald-50/80">
            بانتظار رابط يوتيوب من مالك الغرفة
          </div>
        )}
        {isOwner && editing && (
          <form onSubmit={saveLink} className="absolute inset-0 flex flex-col justify-center gap-2 bg-emerald-950 p-4 text-white">
            <label htmlFor="theater-link" className="text-sm font-bold">رابط فيديو يوتيوب</label>
            <input id="theater-link" autoFocus required type="url" dir="ltr" value={link}
              placeholder="https://youtu.be/..." onChange={event => setLink(event.target.value)}
              className="w-full rounded-lg border border-emerald-200/40 bg-black/40 px-3 py-2 text-sm" />
            {error && <p role="alert" className="text-xs text-rose-200">{error}</p>}
            <div className="flex justify-center gap-3 text-sm">
              <button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-1.5">حفظ</button>
              <button type="button" disabled={saving} onClick={() => setEditing(false)} className="px-2">إلغاء</button>
            </div>
          </form>
        )}
      </div>
      <div className="flex h-9 items-center justify-center">
        {isOwner && (
          <button type="button" className="flex items-center gap-2 rounded-full border border-amber-300/70 bg-emerald-950 px-4 py-1.5 text-sm font-bold text-white"
            onClick={() => {
              setLink(videoId ? `https://youtu.be/${videoId}` : '');
              setError('');
              setEditing(true);
            }}>
            <Link2 size={16} aria-hidden="true" /> تغيير الرابط
          </button>
        )}
      </div>
    </section>
  );
}
