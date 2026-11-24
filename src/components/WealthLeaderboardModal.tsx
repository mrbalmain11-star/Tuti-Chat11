import React, { useId, useState } from 'react';
import { useLiveRanking, type RankingPeriod as TimePeriod, type RankingRow } from '../services/liveRankings';
import { imageUrl } from '../services/imageUrl';

const rankingImageFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#e9d5a1"/><circle cx="50" cy="38" r="17" fill="#94753e"/><path d="M17 91c3-27 18-38 33-38s30 11 33 38" fill="#94753e"/></svg>');
const onRankingImageError = (event: React.SyntheticEvent<HTMLImageElement>) => { if (event.currentTarget.src !== rankingImageFallback) event.currentTarget.src = rankingImageFallback; };

import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Flame,
  Coins,
  Trophy,
  Radio,
  Gem,
  ShieldCheck,
  HelpCircle,
  Clock,
  X,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { VipName } from './VipName';
import { UserProfile, WealthSupporter } from '../types';

function PodiumPortrait({ rank, src, name }: { rank: 1 | 2 | 3; src?: string; name: string }) {
  const filterId = useId();
  return (
    <div className={`relative mb-1 aspect-square max-w-full ${rank === 1 ? 'w-28' : 'w-24'}`} aria-label={`المركز ${rank}`}>
      <img src={src || rankingImageFallback} onError={onRankingImageError} alt={name}
        className="absolute left-[21%] top-[23%] h-[52%] w-[58%] rounded-[50%] object-cover" />
      <svg viewBox="0 0 100 100" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          {/* Key out the neutral checkerboard in the uploaded artwork while keeping the coloured frame. */}
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  25 0 -25 0 -.5" result="warm" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -25 0 25 0 -.5" result="violet" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 25 -25 0 -.5" result="green" />
            <feComposite in="warm" in2="violet" operator="over" result="warmOrViolet" />
            <feComposite in="green" in2="warmOrViolet" operator="over" />
            <feMorphology operator="dilate" radius="0.55" />
            <feMorphology operator="erode" radius="0.55" result="frameMask" />
            <feComposite in="SourceGraphic" in2="frameMask" operator="in" />
          </filter>
        </defs>
        <image href={`/assets/TOP${rank}.png`} width="100" height="100" filter={`url(#${filterId})`} />
      </svg>
    </div>
  );
}

export interface CharmLeaderboardItem {
  rank: number;
  charmReceived: number;
  user: UserProfile;
}

export interface RoomLeaderboardItem {
  id: string;
  rank: number;
  title: string;
  coverImage: string;
  hostName: string;
  hostAvatar: string;
  roomCups: number;
  roomGiftsAmount: number;
  activeListeners: number;
}

export const WealthLeaderboardModal: React.FC = () => {
  const {
    openWealthLeaderboardModal,
    setOpenWealthLeaderboardModal,
    leaderboardTab,
    leaderboardPeriod: period,
    setLeaderboardPeriod: setPeriod,
    setLeaderboardTab,
    setInternalProfileUser,
    setOpenInternalProfileModal,
    currentUser,
    setOpenRechargeModal,
    enterRoom,
    t,
    isRtl,
  } = useApp();

  const [showResetRulesModal, setShowResetRulesModal] = useState(false);
  const ranking = useLiveRanking(currentUser.id, period, leaderboardTab, openWealthLeaderboardModal);
  // Ranking RPC does not return VIP, role or level metadata: never copy the viewer's badges or privileges to another user.
  const profileFor=(r:RankingRow):UserProfile=>({
    id:r.entity_id,
    publicId: Number.isSafeInteger(r.public_id) && r.public_id > 0 ? r.public_id : undefined,
    name:r.display_name,
    nickname:r.display_name,
    avatar:imageUrl(r.avatar_url) || rankingImageFallback,
    country:'',countryCode:'',countryFlag:'',
    vipLevel:0,vipExpiry:'',
    wealthLevel:0,wealthExp:0,charmLevel:0,charmExp:0,gameLevel:0,gameExp:0,
    coins:0,diamonds:0,hearts:0,
    friendsCount:0,followersCount:0,followingCount:0,fansCount:0,visitorsCount:0,
    gender:'',birthdate:'',bio:'',album:[],
  });


  if (!openWealthLeaderboardModal) return null;


  // Guard the leaderboard UI against null, malformed or non-finite scores from the RPC.
  const safeRankingScore=(score:unknown):number=>{const value=Number(score);return Number.isFinite(value)&&value>=0?value:0;};
  const rankedSupporters:WealthSupporter[]=leaderboardTab==='wealth'?ranking.map((r,i)=>({rank:i+1,supportAmount:safeRankingScore(r.score),user:profileFor(r)})):[];
  const topWealth1=rankedSupporters[0],topWealth2=rankedSupporters[1],topWealth3=rankedSupporters[2],restWealth7=rankedSupporters.slice(3,10);
  const rankedCharmList:CharmLeaderboardItem[]=leaderboardTab==='charm'?ranking.map((r,i)=>({rank:i+1,charmReceived:safeRankingScore(r.score),user:profileFor(r)})):[];
  const topCharm1=rankedCharmList[0],topCharm2=rankedCharmList[1],topCharm3=rankedCharmList[2],restCharm7=rankedCharmList.slice(3,10);
  const rankedRoomList:RoomLeaderboardItem[]=leaderboardTab==='room'?ranking.map((r,i)=>({id:r.entity_id,rank:i+1,title:r.display_name,coverImage:imageUrl(r.avatar_url, 'totichat-room-images') || rankingImageFallback,hostName:'',hostAvatar:rankingImageFallback,roomCups:0,roomGiftsAmount:safeRankingScore(r.score),activeListeners:0})):[];
  const topRoom1=rankedRoomList[0],topRoom2=rankedRoomList[1],topRoom3=rankedRoomList[2],restRoom7=rankedRoomList.slice(3,10);

  const handleOpenUser = (u: UserProfile) => {
    sounds.playClick();
    setInternalProfileUser(u);
    setOpenInternalProfileModal(true);
  };

  const handleEnterRoom = (roomId: string) => {
    sounds.playClick();
    enterRoom(roomId);
    setOpenWealthLeaderboardModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none font-['Cairo',sans-serif] p-0 overflow-hidden animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Main Container - Warm Golden Luxury Palette */}
      <div className="w-full max-w-md h-full bg-gradient-to-b from-[#FFFDF8] via-[#FAF5E8] to-[#F3E7CA] text-slate-900 flex flex-col relative overflow-hidden shadow-2xl border-x border-amber-300/40">
        
        {/* Top Header: Navigation & Title */}
        <header className="relative z-20 pt-3 pb-2 px-4 bg-gradient-to-b from-white/95 via-[#FFFDF5]/95 to-amber-50/90 border-b border-amber-300/60 flex flex-col gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setOpenWealthLeaderboardModal(false);
              }}
              className="w-9 h-9 rounded-full bg-amber-100/90 hover:bg-amber-200 border border-amber-300/80 text-amber-950 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-xs"
              title={t.back}
            >
              {isRtl ? (
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              )}
            </button>

            {/* Dynamic Centered Title */}
            <div className="flex flex-col items-center">
              <h2 className="text-base font-black text-amber-950 tracking-wide drop-shadow-xs">
                {leaderboardTab === 'wealth' && t.wealthListTitle}
                {leaderboardTab === 'charm' && t.charmListTitle}
                {leaderboardTab === 'room' && t.roomListTitle}
              </h2>
              <span className="text-[10px] font-bold text-amber-800/90 mt-0.5">
                {leaderboardTab === 'wealth' && t.wealthListSubtitle}
                {leaderboardTab === 'charm' && t.charmListSubtitle}
                {leaderboardTab === 'room' && t.roomListSubtitle}
              </span>
            </div>

            {/* Left Button: Help & Reset Rules */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowResetRulesModal(true);
              }}
              className="w-9 h-9 rounded-full bg-amber-100/90 hover:bg-amber-200 border border-amber-300/80 text-amber-950 flex items-center justify-center transition active:scale-90 cursor-pointer shadow-xs"
              title={t.resetQuestion}
            >
              <HelpCircle className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* Main 3 Category Tabs: [ Wealth | Charm | Room ]                           */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-amber-100/70 border border-amber-300/70 shadow-inner">
            {/* 1. Wealth */}
            <button
              onClick={() => {
                sounds.playClick();
                setLeaderboardTab('wealth');
              }}
              className={`py-1.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                leaderboardTab === 'wealth'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-md scale-[1.02] border border-amber-300'
                  : 'text-amber-900/80 hover:bg-amber-200/50'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-900" />
              <span>{t.cardWealth}</span>
            </button>

            {/* 2. Charm */}
            <button
              onClick={() => {
                sounds.playClick();
                setLeaderboardTab('charm');
              }}
              className={`py-1.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                leaderboardTab === 'charm'
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-md scale-[1.02] border border-amber-300'
                  : 'text-amber-900/80 hover:bg-amber-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-900" />
              <span>{t.cardCharm}</span>
            </button>

            {/* 3. Room */}
            <button
              onClick={() => {
                sounds.playClick();
                setLeaderboardTab('room');
              }}
              className={`py-1.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                leaderboardTab === 'room'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md scale-[1.02] border border-amber-300'
                  : 'text-amber-900/80 hover:bg-amber-200/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-900" />
              <span>{t.cardRoom}</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* Time Period Sub-Tabs: [ Daily | Weekly | Monthly ]                        */}
          {/* ========================================================================= */}
          <div className="flex flex-col items-center gap-1.5 pt-0.5">
            <div className="inline-flex p-0.5 rounded-full bg-white/95 border border-amber-300/70 shadow-2xs">
              {(
                [
                  { id: 'daily', label: t.timeDaily },
                  { id: 'weekly', label: t.timeWeekly },
                  { id: 'monthly', label: t.timeMonthly },
                ] as const
              ).map((p) => {
                const isActive = period === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      sounds.playClick();
                      setPeriod(p.id);
                    }}
                    className={`px-4 py-1 rounded-full text-[11px] font-black transition cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-xs'
                        : 'text-amber-900/70 hover:text-amber-950'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Reset Time Info & Quick Question Click */}
            <div
              onClick={() => {
                sounds.playClick();
                setShowResetRulesModal(true);
              }}
              className="flex items-center justify-center gap-1.5 text-[10.5px] font-bold text-amber-900/90 cursor-pointer hover:text-amber-950 transition active:scale-98"
            >
              <Clock className="w-3 h-3 text-amber-700" />
              <span>
                {period === 'daily' && t.resetDailyText}
                {period === 'weekly' && t.resetWeeklyText}
                {period === 'monthly' && t.resetMonthlyText}
              </span>
              <span className="text-[10px] text-amber-700 underline font-black">
                ({t.resetQuestion})
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-3 pb-24 space-y-3.5">
          
          {/* ========================================================================= */}
          {/* BANNER: Throne of Top Supporters                                          */}
          {/* ========================================================================= */}
          <div className="relative rounded-2xl bg-gradient-to-r from-[#FAF0D7] via-[#FFF8E7] to-[#F5E6C4] border-2 border-amber-400/80 py-3.5 px-4 shadow-sm overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:14px_14px] opacity-15 pointer-events-none" />
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-amber-300/15 rounded-full blur-xl pointer-events-none" />

            <h2 className="relative z-10 text-xl sm:text-2xl font-black text-amber-950 tracking-wide font-['Cairo',sans-serif] text-center drop-shadow-xs">
              {t.throneOfSupporters}
            </h2>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: الثروة (Wealth Leaderboard)                                        */}
          {/* ========================================================================= */}
          {leaderboardTab === 'wealth' && (
            <>
              {/* TOP 3 PODIUM */}
              <div className="relative rounded-3xl bg-gradient-to-b from-white via-amber-50/80 to-amber-100/60 border border-amber-300/70 p-4 shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                <div className="relative z-10 flex items-end justify-center gap-2 pt-2 pb-1">
                  {/* TOP 2 (Silver Podium) */}
                  {!topWealth2 && <div className="flex-1" aria-hidden="true" />}
                  {topWealth2 && (
                    <div
                      onClick={() => handleOpenUser(topWealth2.user)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <PodiumPortrait rank={2} src={topWealth2.user.avatar} name={topWealth2.user.name} />

                      <VipName
                        name={topWealth2.user.name}
                        vipLevel={topWealth2.user.vipLevel}
                        fallbackColor="text-slate-900"
                        className="text-xs font-black max-w-[85px] mt-1 text-center"
                      />

                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topWealth2.supportAmount.toLocaleString()}</span>
                        <span>🪙</span>
                      </div>
                    </div>
                  )}

                  {/* TOP 1 (Gold Royal Falcon Sovereign Podium) */}
                  {topWealth1 && (
                    <div
                      onClick={() => handleOpenUser(topWealth1.user)}
                      className="flex-1.1 flex flex-col items-center cursor-pointer group active:scale-95 transition -translate-y-3"
                    >
                      <PodiumPortrait rank={1} src={topWealth1.user.avatar} name={topWealth1.user.name} />

                      <VipName
                        name={topWealth1.user.name}
                        vipLevel={topWealth1.user.vipLevel}
                        fallbackColor="text-amber-950"
                        className="text-sm font-black max-w-[100px] mt-1 text-center"
                      />

                      <div className="mt-1.5 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-500 text-slate-950 text-xs font-black shadow-xs font-sans">
                        <span>{topWealth1.supportAmount.toLocaleString()}</span>
                        <span className="text-amber-900">🪙</span>
                      </div>
                    </div>
                  )}

                  {/* Keep the winner centered even if only two ranked users exist. */}
                  {!topWealth3 && <div className="flex-1" aria-hidden="true" />}
                  {/* TOP 3 (Bronze Podium) */}
                  {topWealth3 && (
                    <div
                      onClick={() => handleOpenUser(topWealth3.user)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <PodiumPortrait rank={3} src={topWealth3.user.avatar} name={topWealth3.user.name} />

                      <VipName
                        name={topWealth3.user.name}
                        vipLevel={topWealth3.user.vipLevel}
                        fallbackColor="text-slate-900"
                        className="text-xs font-black max-w-[85px] mt-1 text-center"
                      />

                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topWealth3.supportAmount.toLocaleString()}</span>
                        <span>🪙</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: 7 Wealth Supporters (Ranks 4 to 10) - Without friend request icon button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-amber-950">
                    قائمة الداعمين (4 - 10)
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    مرتبة حسب قيمة الدعم
                  </span>
                </div>

                {restWealth7.map((supporter) => {
                  return (
                    <div
                      key={supporter.user.id}
                      onClick={() => handleOpenUser(supporter.user)}
                      className="p-2.5 rounded-2xl bg-white/95 hover:bg-amber-50/80 border border-amber-200/90 shadow-xs flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition group"
                    >
                      {/* Right: Rank + Avatar + Name + Badges */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-center shrink-0 font-sans shadow-2xs">
                          {supporter.rank}
                        </div>

                        {/* Avatar with country flag */}
                        <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-b from-amber-200 to-amber-400 border border-amber-300 shrink-0">
                          <img
                            src={supporter.user.avatar || rankingImageFallback}
                            onError={onRankingImageError}
                            alt={supporter.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                          {supporter.user.countryFlag && (
                            <span className="absolute -bottom-1 -left-1 text-xs">
                              {supporter.user.countryFlag}
                            </span>
                          )}
                        </div>
                        <div className="text-right min-w-0">
                          <VipName
                            name={supporter.user.name}
                            vipLevel={supporter.user.vipLevel}
                            fallbackColor="text-slate-900"
                            className="text-xs font-black truncate max-w-[130px]"
                          />
                          {supporter.user.publicId !== undefined && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span dir="ltr" className="text-[9px] text-slate-500 font-mono">
                                ID: {supporter.user.publicId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Left: Support amount only (بدون أيقونة طلب صداقة) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300/80 text-amber-950 font-black text-xs font-sans shadow-2xs">
                            <span>{supporter.supportAmount.toLocaleString()}</span>
                            <span className="text-amber-500 text-xs">🪙</span>
                          </div>
                          <span className="text-[9px] text-amber-700/80 mt-0.5 font-bold">
                            قيمة الدعم
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: الجاذبية (Charm Leaderboard)                                        */}
          {/* مريح للبصر، ذهبي اللون، يظهر به مستوى السحر وقيمة المرمي للحساب              */}
          {/* وبدون أيقونة طلب صداقة                                                     */}
          {/* ========================================================================= */}
          {leaderboardTab === 'charm' && (
            <>
              {/* TOP 3 PODIUM FOR CHARM */}
              <div className="relative rounded-3xl bg-gradient-to-b from-white via-amber-50/80 to-amber-100/60 border border-amber-300/70 p-4 shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                <div className="relative z-10 flex items-end justify-center gap-2 pt-2 pb-1">
                  {/* TOP 2 (Silver Podium) */}
                  {!topCharm2 && <div className="flex-1" aria-hidden="true" />}
                  {topCharm2 && (
                    <div
                      onClick={() => handleOpenUser(topCharm2.user)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <PodiumPortrait rank={2} src={topCharm2.user.avatar} name={topCharm2.user.name} />

                      <VipName
                        name={topCharm2.user.name}
                        vipLevel={topCharm2.user.vipLevel}
                        fallbackColor="text-slate-900"
                        className="text-xs font-black max-w-[85px] mt-1 text-center"
                      />

                      {/* مستوى السحر (Magic Level Badge) */}
                      {/* قيمة المرمي للحساب (Received Gifts Value) */}
                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topCharm2.charmReceived.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[8px] font-bold text-amber-800 mt-0.5">مرمي للحساب</span>
                    </div>
                  )}

                  {/* TOP 1 (Gold Royal Charm Podium with Falcon Aura) */}
                  {topCharm1 && (
                    <div
                      onClick={() => handleOpenUser(topCharm1.user)}
                      className="flex-1.1 flex flex-col items-center cursor-pointer group active:scale-95 transition -translate-y-3"
                    >
                      <PodiumPortrait rank={1} src={topCharm1.user.avatar} name={topCharm1.user.name} />

                      <VipName
                        name={topCharm1.user.name}
                        vipLevel={topCharm1.user.vipLevel}
                        fallbackColor="text-amber-950"
                        className="text-sm font-black max-w-[100px] mt-1 text-center"
                      />

                      {/* مستوى السحر (Magic Level Badge) */}
                      {/* قيمة المرمي للحساب */}
                      <div className="mt-1.5 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-500 text-slate-950 text-xs font-black shadow-xs font-sans">
                        <span>{topCharm1.charmReceived.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[9px] font-black text-amber-900 mt-0.5">مرمي للحساب (مرسل له)</span>
                    </div>
                  )}

                  {/* TOP 3 (Bronze Podium) */}
                  {!topCharm3 && <div className="flex-1" aria-hidden="true" />}
                  {topCharm3 && (
                    <div
                      onClick={() => handleOpenUser(topCharm3.user)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <PodiumPortrait rank={3} src={topCharm3.user.avatar} name={topCharm3.user.name} />

                      <VipName
                        name={topCharm3.user.name}
                        vipLevel={topCharm3.user.vipLevel}
                        fallbackColor="text-slate-900"
                        className="text-xs font-black max-w-[85px] mt-1 text-center"
                      />

                      {/* مستوى السحر (Magic Level Badge) */}
                      {/* قيمة المرمي للحساب */}
                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topCharm3.charmReceived.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[8px] font-bold text-amber-800 mt-0.5">مرمي للحساب</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Ranks 4 to 10 for Charm - Without friend request icon button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <span>✨</span>
                    <span>قائمة الجاذبية (4 - 10)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    بمستوى السحر وقيمة المرمي
                  </span>
                </div>

                {restCharm7.map((item) => {
                  return (
                    <div
                      key={item.user.id}
                      onClick={() => handleOpenUser(item.user)}
                      className="p-2.5 rounded-2xl bg-white/95 hover:bg-amber-50/80 border border-amber-200/90 shadow-xs flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition group"
                    >
                      {/* Right: Rank + Avatar + Name + مستوى السحر */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-center shrink-0 font-sans shadow-2xs">
                          {item.rank}
                        </div>

                        {/* Avatar with country flag */}
                        <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-b from-amber-200 to-amber-400 border border-amber-300 shrink-0">
                          <img
                            src={item.user.avatar || rankingImageFallback}
                            onError={onRankingImageError}
                            alt={item.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                          {item.user.countryFlag && (
                            <span className="absolute -bottom-1 -left-1 text-xs">
                              {item.user.countryFlag}
                            </span>
                          )}
                        </div>

                        <div className="text-right min-w-0">
                          <VipName
                            name={item.user.name}
                            vipLevel={item.user.vipLevel}
                            fallbackColor="text-slate-900"
                            className="text-xs font-black truncate max-w-[130px]"
                          />
                          {item.user.publicId !== undefined && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span dir="ltr" className="text-[9px] text-slate-500 font-mono">
                                ID: {item.user.publicId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Left: قيمة المرمي للحساب فقط (بدون أيقونة طلب صداقة) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-950 font-black text-xs font-sans shadow-2xs">
                            <span>{item.charmReceived.toLocaleString()}</span>
                            <span className="text-amber-500 text-xs">💎</span>
                          </div>
                          <span className="text-[9px] text-amber-700 mt-0.5 font-bold">
                            مرمي للحساب
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: الغرفة (Room Leaderboard)                                          */}
          {/* مريح للبصر، ذهبي اللون، شيل كلمة كاس، شيل المستطيل الأخضر المكتوب فيه دخول */}
          {/* إظهار اسم الروم وصورة الروم وقيمة المرمي للروم                            */}
          {/* ========================================================================= */}
          {leaderboardTab === 'room' && (
            <>
              {/* TOP 3 PODIUM FOR ROOMS */}
              <div className="relative rounded-3xl bg-gradient-to-b from-white via-amber-50/80 to-amber-100/60 border border-amber-300/70 p-4 shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                <div className="relative z-10 flex items-end justify-center gap-2 pt-2 pb-1">
                  {/* TOP 2 Room (Silver Podium) */}
                  {!topRoom2 && <div className="flex-1" aria-hidden="true" />}
                  {topRoom2 && (
                    <div
                      onClick={() => handleEnterRoom(topRoom2.id)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <PodiumPortrait rank={2} src={topRoom2.coverImage} name={topRoom2.title} />

                      {/* اسم الروم */}
                      <span className="text-xs font-black text-slate-900 max-w-[85px] mt-1 text-center truncate">
                        {topRoom2.title}
                      </span>

                      {/* قيمة المرمي للروم */}
                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topRoom2.roomGiftsAmount.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-800 mt-0.5">مرمي للروم</span>
                    </div>
                  )}

                  {/* TOP 1 Room (Gold Royal Room Podium with Falcon Aura) */}
                  {topRoom1 && (
                    <div
                      onClick={() => handleEnterRoom(topRoom1.id)}
                      className="flex-1.1 flex flex-col items-center cursor-pointer group active:scale-95 transition -translate-y-3"
                    >
                      <PodiumPortrait rank={1} src={topRoom1.coverImage} name={topRoom1.title} />

                      {/* اسم الروم */}
                      <span className="text-sm font-black text-amber-950 max-w-[100px] mt-1 text-center truncate">
                        {topRoom1.title}
                      </span>

                      {/* قيمة المرمي للروم */}
                      <div className="mt-1.5 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-500 text-slate-950 text-xs font-black shadow-xs font-sans">
                        <span>{topRoom1.roomGiftsAmount.toLocaleString()}</span>
                        <span>💎 مرمي للروم</span>
                      </div>
                    </div>
                  )}

                  {/* TOP 3 Room (Bronze Podium) */}
                  {!topRoom3 && <div className="flex-1" aria-hidden="true" />}
                  {topRoom3 && (
                    <div
                      onClick={() => handleEnterRoom(topRoom3.id)}
                      className="flex-1 flex flex-col items-center cursor-pointer group active:scale-95 transition"
                    >
                      <PodiumPortrait rank={3} src={topRoom3.coverImage} name={topRoom3.title} />

                      {/* اسم الروم */}
                      <span className="text-xs font-black text-slate-900 max-w-[85px] mt-1 text-center truncate">
                        {topRoom3.title}
                      </span>

                      {/* قيمة المرمي للروم */}
                      <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs font-sans">
                        <span>{topRoom3.roomGiftsAmount.toLocaleString()}</span>
                        <span>💎</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-800 mt-0.5">مرمي للروم</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Ranks 4 to 10 for Rooms - بدون المستطيل الأخضر لدخول الروم، النقر على الصف يدخل الروم مباشرة */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-amber-950">
                    قائمة الرومات (4 - 10)
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    مرتبة حسب قيمة المرمي للروم
                  </span>
                </div>

                {restRoom7.map((room) => {
                  return (
                    <div
                      key={room.id}
                      onClick={() => handleEnterRoom(room.id)}
                      className="p-2.5 rounded-2xl bg-white/95 hover:bg-amber-50/80 border border-amber-200/90 shadow-xs flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition group"
                    >
                      {/* Right: Rank + صورة الروم + اسم الروم + المضيف */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-center shrink-0 font-sans shadow-2xs">
                          {room.rank}
                        </div>

                        {/* صورة الروم */}
                        <div className="relative w-11 h-11 rounded-xl p-0.5 bg-gradient-to-b from-amber-200 to-amber-400 border border-amber-300 shrink-0 overflow-hidden">
                          <img
                            src={room.coverImage || rankingImageFallback}
                            onError={onRankingImageError}
                            alt={room.title}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        </div>

                        {/* Room Info */}
                        <div className="text-right min-w-0">
                          <span className="text-xs font-black text-slate-900 block truncate max-w-[140px] group-hover:text-amber-900 transition">
                            {room.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                              المضيف: {room.hostName}
                            </span>
                            <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full font-bold">
                              🎧 {room.activeListeners}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Left: قيمة المرمي للروم فقط (تم حذف المستطيل الأخضر المكتوب فيه دخول) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-950 font-black text-xs font-sans shadow-2xs">
                            <span>{room.roomGiftsAmount.toLocaleString()}</span>
                            <span className="text-amber-500 text-xs">💎</span>
                          </div>
                          <span className="text-[9px] text-amber-800 mt-0.5 font-bold">
                            مرمي للروم
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

        {/* Bottom Floating Bar: Current User Status & Primary Action in Golden Theme */}
        <footer className="absolute bottom-0 inset-x-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-amber-300/70 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400 shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-right">
              {leaderboardTab === 'wealth' && (
                <>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    إجمالي دعمك:
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-900 font-sans">
                    <span>{(currentUser.wealthExp || 0).toLocaleString()} 🪙</span>
                  </div>
                </>
              )}

              {leaderboardTab === 'charm' && (
                <>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-950 font-sans">
                    <span>مرمي لك: {(currentUser.charmExp || 0).toLocaleString()} 💎</span>
                  </div>
                </>
              )}

              {leaderboardTab === 'room' && (
                <>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    دعم الروم الحالي:
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-950 font-sans">
                    <span>14,500,000 💎 مرمي للروم</span>
                    <span className="text-[10px] text-slate-400">
                      (تؤام روحي)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Button - Unified Royal Golden Style */}
          {leaderboardTab === 'wealth' && (
            <button
              onClick={() => {
                sounds.playClick();
                setOpenRechargeModal(true);
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300/80"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>شحن ودعم الحساب</span>
            </button>
          )}

          {leaderboardTab === 'charm' && (
            <button
              onClick={() => {
                sounds.playClick();
                setOpenRechargeModal(true);
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300/80"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>زيادة الجاذبية</span>
            </button>
          )}

          {leaderboardTab === 'room' && (
            <button
              onClick={() => {
                sounds.playClick();
                handleEnterRoom('room-soulmate');
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300/80"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>دخول الروم</span>
            </button>
          )}
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG: When is the reset & rules                                         */}
      {/* ========================================================================= */}
      {showResetRulesModal && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          dir={isRtl ? 'rtl' : 'ltr'}
          onClick={() => setShowResetRulesModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-slate-800 border border-amber-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-amber-950">
                  {t.resetDialogTitle}
                </h3>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowResetRulesModal(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Answer & Explanation */}
            <div className="space-y-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                <h4 className="font-black text-amber-950 mb-2 flex items-center gap-1.5 text-[13px]">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>{t.resetOfficialTimes}</span>
                </h4>
                <ul className="space-y-2.5 text-slate-700 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-amber-950 text-xs block font-black">
                        1. {t.timeDaily}:
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {t.resetDailyDetail}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-amber-950 text-xs block font-black">
                        2. {t.timeWeekly}:
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {t.resetWeeklyDetail}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-amber-950 text-xs block font-black">
                        3. {t.timeMonthly}:
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {t.resetMonthlyDetail}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Point Calculation Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <h4 className="font-black text-slate-900 mb-1.5 flex items-center gap-1.5 text-[12px]">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>{t.calculationRulesTitle}</span>
                </h4>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <p>• {t.calcWealth}</p>
                  <p>• {t.calcCharm}</p>
                  <p>• {t.calcRoom}</p>
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowResetRulesModal(false);
              }}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
            >
              {t.understood}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
