import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';
import { OfficialScreenshotBadge, EntranceBannerPreview } from './LevelBadgeIcons';
import {
  getLevelProgress,
  calculateCumulativeExpForLevel,
  MAX_WEALTH_LEVEL,
  MAX_CHARM_LEVEL,
  MAX_GAME_LEVEL,
} from '../utils/levelUtils';

export const LevelsModal: React.FC = () => {
  const {
    openLevelsModal,
    setOpenLevelsModal,
    levelsModalTab,
    setLevelsModalTab,
    currentUser,
  } = useApp();

  if (!openLevelsModal) return null;

  const isWealth = levelsModalTab === 'wealth';
  const isGames = levelsModalTab === 'games';
  const isCharm = levelsModalTab === 'charm';

  // Target maximum levels requested:
  // Wealth max: 240
  // Charm / Magic max: 165
  // Games max: 100
  const maxTier = isWealth ? MAX_WEALTH_LEVEL : isCharm ? MAX_CHARM_LEVEL : MAX_GAME_LEVEL;

  const currentExp = isGames
    ? (currentUser.gameExp ?? calculateCumulativeExpForLevel(currentUser.gameLevel || 1))
    : isWealth
    ? (currentUser.wealthExp ?? calculateCumulativeExpForLevel(currentUser.wealthLevel || 1))
    : (currentUser.charmExp ?? calculateCumulativeExpForLevel(currentUser.charmLevel || 1));

  const progress = getLevelProgress(currentExp, maxTier);
  const currentLevel = progress.level || 1;
  const nextLevel = progress.nextLevel || 2;
  const expNeeded = progress.neededForNextLevel || (isWealth ? 24000 : isCharm ? 28000 : 30000);

  // 1. Wealth Tiers up to 240 (matching Screenshot 7 and user instruction: "الثروه اجعله 240 اخر شيء فاخر")
  const wealthTiers = [
    { range: '1-9', badgeLevel: 1, displayNumber: '1' },
    { range: '10-19', badgeLevel: 10, displayNumber: '10' },
    { range: '20-29', badgeLevel: 20, displayNumber: '20' },
    { range: '30-39', badgeLevel: 30, displayNumber: '30' },
    { range: '40-49', badgeLevel: 40, displayNumber: '40' },
    { range: '50-59', badgeLevel: 50, displayNumber: '50' },
    { range: '60-69', badgeLevel: 60, displayNumber: '60' },
    { range: '70-79', badgeLevel: 70, displayNumber: '70' },
    { range: '80-89', badgeLevel: 80, displayNumber: '80' },
    { range: '90-99', badgeLevel: 90, displayNumber: '90' },
    { range: '100-119', badgeLevel: 100, displayNumber: '100' },
    { range: '120-139', badgeLevel: 120, displayNumber: '120' },
    { range: '140-159', badgeLevel: 140, displayNumber: '140' },
    { range: '160-179', badgeLevel: 160, displayNumber: '160' },
    { range: '180-199', badgeLevel: 180, displayNumber: '180' },
    { range: '200-219', badgeLevel: 200, displayNumber: '200' },
    { range: '220-239', badgeLevel: 220, displayNumber: '220' },
    { range: '240', badgeLevel: 240, displayNumber: '240' },
  ];

  // 2. Magic / Charm Tiers up to 260 (matching user instruction: "ارفع مستوى السحر حته 260 مستوئ السحر 210 الوان مختلفه بين كل مستوى واخر")
  const charmTiers = [
    { range: '1-9', badgeLevel: 1, displayNumber: '1' },
    { range: '10-19', badgeLevel: 10, displayNumber: '10' },
    { range: '20-29', badgeLevel: 20, displayNumber: '20' },
    { range: '30-39', badgeLevel: 30, displayNumber: '30' },
    { range: '40-49', badgeLevel: 40, displayNumber: '40' },
    { range: '50-59', badgeLevel: 50, displayNumber: '50' },
    { range: '60-69', badgeLevel: 60, displayNumber: '60' },
    { range: '70-79', badgeLevel: 70, displayNumber: '70' },
    { range: '80-89', badgeLevel: 80, displayNumber: '80' },
    { range: '90-99', badgeLevel: 90, displayNumber: '90' },
    { range: '100-119', badgeLevel: 100, displayNumber: '100' },
    { range: '120-139', badgeLevel: 120, displayNumber: '120' },
    { range: '140-159', badgeLevel: 140, displayNumber: '140' },
    { range: '160-179', badgeLevel: 160, displayNumber: '160' },
    { range: '180-199', badgeLevel: 180, displayNumber: '180' },
    { range: '200-209', badgeLevel: 200, displayNumber: '200' },
    { range: '210-219', badgeLevel: 210, displayNumber: '210' },
    { range: '220-239', badgeLevel: 220, displayNumber: '220' },
    { range: '240-259', badgeLevel: 240, displayNumber: '240' },
    { range: '260', badgeLevel: 260, displayNumber: '260' },
  ];

  // 3. Game Tiers (matching Screenshot 16 & 18 and user instruction: "حدث مستوئ الالعاب")
  const gameTiers = [
    { range: '1-9', badgeLevel: 1, displayNumber: '1' },
    { range: '10-19', badgeLevel: 10, displayNumber: '10' },
    { range: '20-29', badgeLevel: 20, displayNumber: '20' },
    { range: '30-39', badgeLevel: 30, displayNumber: '30' },
    { range: '40-49', badgeLevel: 40, displayNumber: '40' },
    { range: '50-59', badgeLevel: 50, displayNumber: '50' },
    { range: '60-69', badgeLevel: 60, displayNumber: '60' },
    { range: '70-79', badgeLevel: 70, displayNumber: '70' },
    { range: '80-89', badgeLevel: 80, displayNumber: '80' },
    { range: '90-99', badgeLevel: 90, displayNumber: '90' },
    { range: '100-100', badgeLevel: 100, displayNumber: '100' },
    { range: '101-120', badgeLevel: 120, displayNumber: '120' },
    { range: '121-150', badgeLevel: 150, displayNumber: '150' },
  ];

  const tiers = isGames ? gameTiers : isWealth ? wealthTiers : charmTiers;
  const currentVariant = isGames ? 'games' : isWealth ? 'wealth' : 'charm';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm font-['Cairo',sans-serif] select-none p-0 overflow-hidden animate-in fade-in duration-200">
      {/* Mobile Frame Container matching Screenshots */}
      <div
        className="w-full max-w-md h-full flex flex-col relative text-white overflow-y-auto no-scrollbar shadow-2xl"
        dir="rtl"
      >
        {/* =========================================================================
            Atmospheric Background
            ========================================================================= */}
        <div className="fixed inset-0 max-w-md mx-auto pointer-events-none overflow-hidden z-0">
          <div
            className={`absolute inset-0 transition-colors duration-500 ${
              isGames
                ? 'bg-gradient-to-b from-[#021A15] via-[#041512] to-[#010907]'
                : isWealth
                ? 'bg-gradient-to-b from-[#1C0D02] via-[#0D0501] to-[#040100]'
                : 'bg-gradient-to-b from-[#1B0527] via-[#0B0212] to-[#040008]'
            }`}
          />
          {/* Radial Light Flare */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full blur-[100px] opacity-40 transition-colors duration-500 ${
              isGames ? 'bg-emerald-600/35' : isWealth ? 'bg-amber-600/30' : 'bg-purple-600/35'
            }`}
          />
        </div>

        {/* =========================================================================
            Top Navigation Bar (Tabs: الثروة | السحر | اللعبة & Back Arrow)
            Matching Screenshot 5, 7, 16
            ========================================================================= */}
        <div className="relative z-10 pt-4 pb-2 px-5 flex items-center justify-between">
          {/* Tabs on Left/Center with Green Active Indicator */}
          <div className="flex items-center gap-6 sm:gap-7">
            {/* Tab 1: الثروة (Wealth) */}
            <button
              onClick={() => {
                sounds.playClick();
                setLevelsModalTab('wealth');
              }}
              className="flex flex-col items-center cursor-pointer transition active:scale-95"
            >
              <span
                className={`text-base sm:text-lg tracking-wide transition-all ${
                  isWealth ? 'font-black text-white' : 'font-bold text-white/50 hover:text-white/80'
                }`}
              >
                الثروة
              </span>
              {isWealth && (
                <div className="w-7 h-[3.5px] bg-[#10B981] rounded-full mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              )}
            </button>

            {/* Tab 2: السحر (Magic / Charm) */}
            <button
              onClick={() => {
                sounds.playClick();
                setLevelsModalTab('charm');
              }}
              className="flex flex-col items-center cursor-pointer transition active:scale-95"
            >
              <span
                className={`text-base sm:text-lg tracking-wide transition-all ${
                  isCharm ? 'font-black text-white' : 'font-bold text-white/50 hover:text-white/80'
                }`}
              >
                السحر
              </span>
              {isCharm && (
                <div className="w-7 h-[3.5px] bg-[#10B981] rounded-full mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              )}
            </button>

            {/* Tab 3: اللعبة (Games) */}
            <button
              onClick={() => {
                sounds.playClick();
                setLevelsModalTab('games');
              }}
              className="flex flex-col items-center cursor-pointer transition active:scale-95"
            >
              <span
                className={`text-base sm:text-lg tracking-wide transition-all ${
                  isGames ? 'font-black text-white' : 'font-bold text-white/50 hover:text-white/80'
                }`}
              >
                اللعبة
              </span>
              {isGames && (
                <div className="w-7 h-[3.5px] bg-[#10B981] rounded-full mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              )}
            </button>
          </div>

          {/* Right Arrow: Back Button (Matching Screenshots) */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenLevelsModal(false);
            }}
            className="p-1.5 text-white hover:text-white/80 active:scale-90 transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowRight className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* =========================================================================
            Card 1 & 2: Top Progress Card (Matching Screenshot 5 & 7 for Wealth/Magic, 16 for Games)
            ========================================================================= */}
        <div className="relative z-10 px-5 pt-2 pb-3">
          {isGames ? (
            /* =====================================================================
               GAMES TOP CARD (Matching Screenshot 16 & 18 exactly)
               Concentric golden/emerald orbital rings + Avatar + Lv0 + Progress
               ===================================================================== */
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-l from-[#04281f] via-[#053d2e] to-[#04241c] p-4 shadow-xl relative overflow-hidden">
              {/* Concentric curved orbital rings (SVG background) */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <svg className="w-full h-full" viewBox="0 0 350 120" fill="none">
                  <circle cx="65" cy="60" r="50" stroke="#34D399" strokeWidth="1.2" strokeDasharray="3 3" />
                  <circle cx="65" cy="60" r="42" stroke="#FBBF24" strokeWidth="1" />
                  <circle cx="65" cy="60" r="58" stroke="#10B981" strokeWidth="0.8" />
                </svg>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                {/* User Avatar inside glowing double ring */}
                <div className="relative w-16 h-16 rounded-full shrink-0 p-1 bg-gradient-to-tr from-emerald-400 via-amber-300 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <div className="w-full h-full rounded-full overflow-hidden border border-emerald-200 bg-slate-900">
                    <img
                      src={
                        currentUser.avatar ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&q=80'
                      }
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Level Title, Badge, and Progress */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white font-sans">
                      Lv{currentLevel}
                    </span>
                    <OfficialScreenshotBadge level={currentLevel} variant="games" size="compact" />
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-black/50 border border-white/10 overflow-hidden my-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 shadow-[0_0_8px_#34D399]"
                      style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-emerald-100 font-bold tracking-wide">
                    تحتاج للمستوى التالي{' '}
                    <span className="text-amber-300 font-mono font-black">
                      {expNeeded.toLocaleString()}
                    </span>{' '}
                    نقاط خبرة
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* =====================================================================
               WEALTH / MAGIC TOP CARD (Matching Screenshot 5 & 7 exactly)
               Damask pattern box with avatar, username, "تحتاج إلى X نقطة خبرة"
               ===================================================================== */
            <div
              className={`rounded-2xl border p-4 shadow-xl relative overflow-hidden ${
                isWealth
                  ? 'border-amber-500/35 bg-gradient-to-b from-[#2A1604] via-[#1A0B02] to-[#0F0501]'
                  : 'border-purple-500/35 bg-gradient-to-b from-[#280838] via-[#170321] to-[#0A0010]'
              }`}
            >
              {/* Subtle Damask Texture Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                {/* Right side in RTL: Avatar with cartoon speech / ring */}
                <div className="flex items-center gap-3">
                  <div
                    className={`relative w-15 h-15 rounded-full shrink-0 p-0.5 shadow-md ${
                      isWealth
                        ? 'bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-tr from-purple-400 via-pink-200 to-fuchsia-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                      <img
                        src={
                          currentUser.avatar ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&q=80'
                        }
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <h3 className="text-base font-black text-white">
                      {currentUser.nickname || currentUser.name || 'حمدان'}
                    </h3>
                    <p className="text-xs text-slate-300 font-bold mt-1">
                      تحتاج إلى{' '}
                      <span
                        className={`font-mono font-black ${
                          isWealth ? 'text-amber-300' : 'text-purple-300'
                        }`}
                      >
                        {expNeeded.toLocaleString()}
                      </span>{' '}
                      نقطة خبرة للوصول إلى المستوى {nextLevel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Progress Bar & Percentage Row (Matching Screenshot 5 & 7) */}
              <div className="mt-3.5 relative z-10">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1 px-0.5">
                  <span className="font-mono">{progress.progressPercent}%</span>
                  <span className="font-mono">LV{currentLevel}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isWealth
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-[0_0_8px_#F59E0B]'
                        : 'bg-gradient-to-r from-purple-500 via-fuchsia-300 to-pink-500 shadow-[0_0_8px_#C084FC]'
                    }`}
                    style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            Sub-Section Title: وصف المستوى (For Games) or بخصوص المستويات
            ========================================================================= */}
        <div className="relative z-10 px-5 pt-1 pb-3 text-center">
          {isGames ? (
            <div className="text-center">
              <h2 className="text-sm font-black text-emerald-300 tracking-wide">
                وصف المستوى
              </h2>
              <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
                تُكتسب من خلال اللعب، عملة واحدة = 1 نقطة خبرة
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h2
                className={`text-sm font-black tracking-wide ${
                  isWealth ? 'text-amber-300' : 'text-purple-300'
                }`}
              >
                {isWealth ? 'بخصوص مستويات الثروة (الحد الأقصى 240 👑)' : 'بخصوص مستويات السحر (الحد الأقصى 165 ✨)'}
              </h2>
              <p className="text-xs text-white/70 font-medium mt-0.5">
                {isWealth
                  ? 'يمثل مستوى الثروة القوة الاقتصادية. 1 كوينز دعم = 1 نقطة خبرة ثروة.'
                  : 'يمثل مستوى السحر مدى الجاذبية والهدايا المستلمة. 1 كوينز هدايا = 1 نقطة خبرة سحر.'}
              </p>
            </div>
          )}
        </div>

        {/* =========================================================================
            Main Table Container
            - For Wealth: 3 Columns [المستوى | الأيقونة | مؤثر الدخول] (Matching Screenshot 7)
            - For Magic & Games: 2 Columns [المستوى | الأيقونة] (Matching Screenshot 5 & 16)
            ========================================================================= */}
        <div className="relative z-10 px-5 pb-8 flex-1">
          <div
            className={`rounded-2xl overflow-hidden border shadow-2xl backdrop-blur-md transition-colors ${
              isGames
                ? 'bg-[#021813]/90 border-emerald-900/50 shadow-[0_0_25px_rgba(5,150,105,0.2)]'
                : isWealth
                ? 'bg-[#150B03]/90 border-amber-900/60 shadow-[0_0_25px_rgba(180,83,9,0.25)]'
                : 'bg-[#12031C]/90 border-purple-900/60 shadow-[0_0_25px_rgba(126,34,206,0.25)]'
            }`}
          >
            {/* Table Header Row */}
            {isWealth ? (
              /* 3 Columns for Wealth (Matching Screenshot 7) */
              <div className="grid grid-cols-3 text-center py-3 border-b border-amber-900/40 font-bold text-xs text-amber-200/90">
                <div className="flex items-center justify-center font-black">
                  المستوى
                </div>
                <div className="flex items-center justify-center font-black border-x border-amber-900/40">
                  الأيقونة
                </div>
                <div className="flex items-center justify-center font-black">
                  مؤثر الدخول
                </div>
              </div>
            ) : (
              /* 2 Columns for Magic & Games (Matching Screenshot 5 & 16) */
              <div
                className={`grid grid-cols-2 text-center py-3 border-b font-bold text-xs ${
                  isGames
                    ? 'border-emerald-900/40 text-emerald-200/90'
                    : 'border-purple-900/40 text-purple-200/90'
                }`}
              >
                <div className="flex items-center justify-center font-black">
                  المستوى
                </div>
                <div
                  className={`flex items-center justify-center font-black border-r ${
                    isGames ? 'border-emerald-900/40' : 'border-purple-900/40'
                  }`}
                >
                  الأيقونة
                </div>
              </div>
            )}

            {/* Table Body Rows */}
            <div className="divide-y divide-white/5">
              {tiers.map((t) => (
                <div
                  key={t.range}
                  className={`py-2.5 px-2 transition-colors hover:bg-white/5 items-center ${
                    isWealth
                      ? 'grid grid-cols-3 text-center'
                      : 'grid grid-cols-2 text-center'
                  }`}
                >
                  {/* Column 1 (Right in RTL): المستوى (Level Range) */}
                  <div className="flex items-center justify-center text-xs sm:text-sm font-bold text-slate-200 font-sans tracking-wider">
                    {t.range}
                  </div>

                  {/* Column 2 (Middle in Wealth / Left in 2-col): الأيقونة (Badge) */}
                  <div
                    className={`flex items-center justify-center ${
                      isWealth ? 'border-x border-amber-900/30' : 'border-r ' + (isGames ? 'border-emerald-900/30' : 'border-purple-900/30')
                    }`}
                  >
                    <OfficialScreenshotBadge
                      level={t.badgeLevel}
                      overrideDisplayNumber={t.displayNumber}
                      variant={currentVariant}
                      size="md"
                    />
                  </div>

                  {/* Column 3 (Left in RTL for Wealth): مؤثر الدخول (Entrance Banner Preview) */}
                  {isWealth && (
                    <div className="flex items-center justify-center">
                      <EntranceBannerPreview level={t.badgeLevel} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
