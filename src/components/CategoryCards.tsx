import { useLiveRanking, type RankingRow } from '../services/liveRankings';
import { imageUrl } from '../services/imageUrl';
import React from 'react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

const podiumRanks = [
  { rank: 2, className: 'w-full max-w-8 border-slate-300 text-slate-100' },
  { rank: 1, className: 'w-full max-w-10 border-amber-300 text-amber-100 shadow-[0_0_14px_rgba(251,191,36,.32)] -translate-y-1' },
  { rank: 3, className: 'w-full max-w-8 border-orange-300 text-orange-100' },
] as const;

const PodiumPreview: React.FC<{ rows: RankingRow[]; room: boolean }> = ({ rows, room }) => (
  <div dir="rtl" className="z-10 mt-2 mb-1 grid w-full grid-cols-[1fr_1.25fr_1fr] items-center justify-items-center gap-0.5">
    {podiumRanks.map(({ rank, className }) => {
      const leader = rows[rank - 1];
      const src = imageUrl(leader?.avatar_url, room ? 'totichat-room-images' : 'profile-avatars');
      return <span key={rank} className={`relative flex aspect-square min-w-0 items-center justify-center rounded-full border bg-black/25 text-xs font-black ${className}`}>
        {src && <img key={src} src={src} alt="" className="absolute inset-0 h-full w-full rounded-full object-cover"
          onError={event => { event.currentTarget.hidden = true; }} />}
        <span aria-hidden="true" className={src
          ? 'absolute inset-x-0 -bottom-1 mx-auto w-fit rounded-full bg-emerald-950 px-1 text-[8px] leading-3 shadow'
          : ''}>{rank}</span>
      </span>;
    })}
  </div>
);

export const CategoryCards: React.FC = () => {
  const { setOpenWealthLeaderboardModal, setLeaderboardTab, t, isRtl, leaderboardPeriod, currentUser, activeTab } = useApp();
  const active = activeTab === 'home';
  const wealth = useLiveRanking(currentUser.id, leaderboardPeriod, 'wealth', active);
  const charm = useLiveRanking(currentUser.id, leaderboardPeriod, 'charm', active);
  const room = useLiveRanking(currentUser.id, leaderboardPeriod, 'room', active);
  const rankings = { wealth, charm, room };
  const openRanking = (tab: 'wealth' | 'charm' | 'room') => {
    sounds.playClick();
    setLeaderboardTab(tab);
    setOpenWealthLeaderboardModal(true);
  };

  const cards = [
    { tab: 'wealth' as const, title: t.cardWealth, colors: 'from-[#155344] via-[#0e4036] to-[#082a25]' },
    { tab: 'charm' as const, title: t.cardCharm, colors: 'from-[#17604d] via-[#10483d] to-[#0a302a]' },
    { tab: 'room' as const, title: t.cardRoom, colors: 'from-[#0F543C] via-[#0A3D2C] to-[#06261B]' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 px-4 py-2" dir={isRtl ? 'rtl' : 'ltr'}>
      {cards.map(({ tab, title, colors }) => (
        <button
          key={tab}
          type="button"
          onClick={() => openRanking(tab)}
          aria-label={title}
          className={`group relative flex min-h-[88px] w-full flex-col items-center justify-between overflow-hidden rounded-2xl border-2 border-amber-400/70 bg-gradient-to-b ${colors} p-2 text-white shadow-[0_4px_12px_rgba(16,80,58,.28)] transition-all hover:border-amber-300 active:scale-95`}
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:10px_10px] opacity-15" aria-hidden="true" />
          <span className="z-10 flex w-full items-center justify-center text-center text-xs font-black tracking-wide text-amber-100 drop-shadow">
            {title}
          </span>
          <PodiumPreview rows={rankings[tab]} room={tab === 'room'} />
        </button>
      ))}
    </div>
  );
};
