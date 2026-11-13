import React, { useEffect, useState } from 'react';
import { Crown, Sparkles, House } from 'lucide-react';
import { fetchRoyalRankings, type RoyalRankingEntry } from '../services/royalRankings';
import { royalProgress, type RoyalTrack } from '../utils/royalLevels';

const tracks: { id: RoyalTrack; label: string; Icon: typeof Crown }[] = [
  { id: 'wealth', label: 'الثروة', Icon: Crown },
  { id: 'charm', label: 'السحر', Icon: Sparkles },
  { id: 'room', label: 'الغرفة', Icon: House },
];
export const RoyalRankings: React.FC = () => {
  const [track, setTrack] = useState<RoyalTrack>('wealth');
  const [entries, setEntries] = useState<RoyalRankingEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setEntries([]);
    void fetchRoyalRankings(track).then(rows => {
      if (active) setEntries(rows);
    }).catch(() => {
      if (active) setError('تعذر تحميل التصنيف الموثق');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [track]);
  const top = entries.slice(0, 3);
  return <section className="mt-4 rounded-2xl border border-amber-300/25 bg-black/20 p-3" dir="rtl" aria-label="التصنيفات الملكية">
    <h3 className="mb-3 text-center text-base font-black text-amber-200">التصنيفات الملكية</h3>
    <div className="grid grid-cols-3 gap-2">
      {tracks.map(({ id, label, Icon }) => <button type="button" key={id} onClick={() => setTrack(id)} aria-pressed={track === id}
        className={`flex min-h-10 items-center justify-center gap-1 rounded-lg border text-xs font-bold ${track === id ? 'border-amber-300 bg-amber-300/20 text-amber-100' : 'border-white/10 text-slate-300'}`}>
        <Icon className="h-4 w-4" />{label}
      </button>)}
    </div>
    {loading ? <p className="p-4 text-center text-xs">جارٍ تحميل التصنيف...</p> : error ? <p role="alert" className="p-4 text-center text-xs text-red-200">{error}</p> : entries.length === 0 ? <p className="p-4 text-center text-xs">لا توجد هدايا مؤهلة للتصنيف بعد</p> : <>
      <div className="mt-4 grid grid-cols-3 items-end gap-2">
        {[top[1],top[0],top[2]].map((entry, index) => <div key={entry?.public_id ?? index} className={`min-w-0 rounded-xl border p-2 text-center ${index === 1 ? 'border-amber-300 bg-amber-300/20 pb-5' : 'border-white/20 bg-white/5'}`}>
          <div className="text-lg">{index === 1 ? '👑' : index === 0 ? '🥈' : '🥉'}</div>
          <div className="truncate text-xs font-bold">{entry?.display_name ?? '—'}</div>
          {entry && <div className="mt-1 text-[10px] text-amber-100">L{royalProgress(BigInt(entry.lifetime_xp)).level}</div>}
        </div>)}
      </div>
      <ol className="mt-3 space-y-1">
        {entries.map((entry, i) => <li key={entry.public_id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
          <span className="min-w-0 truncate">{i+1}. {entry.display_name}</span>
          <span className="shrink-0 font-mono text-amber-200">{BigInt(entry.lifetime_xp).toLocaleString('en-US')} XP</span>
        </li>)}
      </ol>
    </>}
  </section>;
};
