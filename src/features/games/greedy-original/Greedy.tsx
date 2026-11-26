import { useState, useEffect, useRef } from 'react';
import {
  CoinIcon,
  GreedyWoodSign,
  FoodIconRenderer,
} from './components/GameIcons';
import { sound } from './sound';
import { loadGreedy, loadGreedyLeaders, recordGreedyPick, type GreedyState, type GreedyLeader, type GreedyPeriod } from './api';
import { imageUrl } from '../../../services/imageUrl';
import falcon from './assets/falcon.webp';
import './greedy-original.css';

// أسماء الفوز الكلاسيكية لجميع الأطعمة بدون استثناء
export const WIN_CLASSIC_NAMES: Record<string, string> = {
  fish: 'مبروك ربح السمك',
  tomato: 'مبروك ربح الطماطم',
  carrot: 'مبروك ربح الجزر',
  meat: 'مبروك ربح الستيك',
  broccoli: 'مبروك ربح البروكلي',
  corn: 'مبروك ربح الذرة',
  chicken: 'مبروك ربح الدجاج',
  shrimp: 'مبروك ربح الروبيان',
  salad: 'مبروك ربح السلطة',
  pizza: 'مبروك ربح البيتزا',
};

// 8 Wheel Food Items matching the exact screenshot layout
export interface WheelFood {
  id: string;
  nameAr: string;
  multiplier: number;
  isHot?: boolean;
  angle: number; // clockwise angle from top
  category: 'meat' | 'veggie';
}

const WHEEL_ITEMS: WheelFood[] = [
  { id: 'carrot', nameAr: 'جزر', multiplier: 5, angle: 0, category: 'veggie' }, // 12 o'clock
  { id: 'shrimp', nameAr: 'روبيان', multiplier: 10, angle: 45, category: 'meat' }, // 1:30
  { id: 'tomato', nameAr: 'طماطم', multiplier: 5, angle: 90, category: 'veggie' }, // 3 o'clock
  { id: 'chicken', nameAr: 'دجاج', multiplier: 15, angle: 135, category: 'meat' }, // 4:30
  { id: 'corn', nameAr: 'ذرة', multiplier: 5, angle: 180, category: 'veggie' }, // 6 o'clock
  { id: 'meat', nameAr: 'لحم', multiplier: 25, angle: 225, category: 'meat' }, // 7:30
  { id: 'broccoli', nameAr: 'بروكلي', multiplier: 5, angle: 270, category: 'veggie' }, // 9 o'clock
  { id: 'fish', nameAr: 'سمك', multiplier: 45, angle: 315, category: 'meat' }, // 10:30
];

export default function Greedy({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const [state, setState] = useState<GreedyState>();
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(false);
  const [roundTimer, setRoundTimer] = useState<number>();
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(-1);
  const [winRibbon, setWinRibbon] = useState<string>();
  const [details, setDetails] = useState<'rules' | 'records' | 'leaders'>();
  const [period, setPeriod] = useState<GreedyPeriod>('day');
  const [leaders, setLeaders] = useState<GreedyLeader[]>();
  const [leadersError, setLeadersError] = useState(false);
  const [leaderAttempt, setLeaderAttempt] = useState(0);
  useEffect(() => {
    if (details !== 'leaders') return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    setLeaders(undefined);
    setLeadersError(false);
    void loadGreedyLeaders(period,controller.signal).then(data => {
      if (active) setLeaders(data);
    }).catch(() => { if (active) setLeadersError(true); }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [details, leaderAttempt, period]);
  const [toastMessage, setToastMessage] = useState<string>();
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const pickRequest = useRef<AbortController | null>(null);
  const refresh = useRef(() => {});
  const lastPlayed = useRef<number | undefined>(undefined);
  const wheelTime = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTime = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [confirmedPick, setConfirmedPick] = useState<{ slot: string; food: string }>();

  useEffect(() => {
    let active = true;
    let request: AbortController | null = null;
    let closes = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => setRoundTimer(closes ? Math.max(0, Math.ceil((closes - performance.now()) / 1000)) : undefined);
    async function load() {
      if (request || !active) return;
      const started = performance.now();
      const controller = new AbortController();
      request = controller;
      timer = setTimeout(() => controller.abort(), 8000);
      try {
        const next = await loadGreedy(controller.signal);
        if (!active) return;
        if (next && next.player.id !== accountId) throw new Error('GREEDY_SESSION_CHANGED');
        closes = next ? started + Date.parse(next.closesAt) - Date.parse(next.serverTime) : 0;
        tick();
        setUnavailable(!next);
        setState(next ?? undefined);
        setError(false);
      } catch {
        if (active) setError(true);
      } finally {
        clearTimeout(timer);
        request = null;
      }
    }
    refresh.current = () => void load();
    void load();
    const poll = setInterval(load, 1600);
    const clock = setInterval(tick, 200);
    window.addEventListener('online', load);
    return () => {
      active = false;
      request?.abort();
      pickRequest.current?.abort();
      clearInterval(poll);
      clearInterval(clock);
      clearTimeout(timer);
      clearTimeout(toastTime.current);
      clearTimeout(wheelTime.current);
      window.removeEventListener('online', load);
      sound.dispose();
    };
  }, [accountId]);

  useEffect(() => {
    if (!error && roundTimer !== undefined && roundTimer >= 1 && roundTimer <= 5) sound.playCountdownBeep(roundTimer === 1);
  }, [error, roundTimer]);
  const currentWinningFoodId = state?.winner;
  useEffect(() => {
    if (!currentWinningFoodId || !state?.slot) {
      clearTimeout(wheelTime.current);
      setActiveHighlightIndex(-1);
      setWinRibbon(undefined);
      return;
    }
    const slotTime = Date.parse(state.slot);
    if (lastPlayed.current === slotTime) return;
    const target = WHEEL_ITEMS.findIndex(item => item.id === currentWinningFoodId);
    if (target < 0) return;
    lastPlayed.current = slotTime;
    let step = 0;
    let speed = 55;
    const total = 24 + target;
    const animate = () => {
      step += 1;
      setActiveHighlightIndex(step % 8);
      sound.playWheelTick(1);
      if (step < total) {
        if (step > total - 8) speed += 32;
        wheelTime.current = setTimeout(animate, speed);
      } else {
        sound.playWin();
        setWinRibbon(state.pick === currentWinningFoodId
          ? WIN_CLASSIC_NAMES[currentWinningFoodId]
          : 'نتيجة الجولة: ' + WHEEL_ITEMS[target].nameAr);
      }
    };
    wheelTime.current = setTimeout(animate, speed);
    return () => clearTimeout(wheelTime.current);
  }, [currentWinningFoodId, state?.slot]);

  const showToast = (message: string) => {
    clearTimeout(toastTime.current);
    setToastMessage(message);
    toastTime.current = setTimeout(() => setToastMessage(undefined), 3000);
  };
  const chosen = (confirmedPick?.slot === state?.slot ? confirmedPick?.food : undefined) ?? state?.pick;
  const canPick = !!state && !error && !chosen && !busy && (roundTimer ?? 0) > 0;
  async function pick(food: string) {
    if (!canPick || !state || pickRequest.current) return;
    const controller = new AbortController();
    pickRequest.current = controller;
    setBusy(true);
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      await recordGreedyPick(state.slot, food, controller.signal);
      setConfirmedPick({ slot: state.slot, food });
      sound.playBetPlace();
      showToast('تسجّل توقعك.');
    } catch {
      showToast('تعذر تأكيد التوقع. دا نحدّث حالة الجولة.');
    } finally {
      clearTimeout(timeout);
      pickRequest.current = null;
      setBusy(false);
      refresh.current();
    }
  }

  const formatCoins = (value: number | null | undefined) => value?.toLocaleString('en-US') ?? '—';
  const playerCoins = state?.player.coins;
  const pastResults = state?.history ?? [];
  const roundState = currentWinningFoodId ? 'spinning' : 'betting';
  const toggleSound = () => setSoundEnabled(sound.toggleSound());
  const toggleMusic = () => setMusicEnabled(sound.toggleMusic());

  return (
    <div
      dir="rtl"
      className="greedy-original relative w-full flex flex-col bg-[#040C14] text-white select-none overflow-hidden font-['Tajawal',sans-serif]"
    >
      {/* FULL-SCREEN GAME CONTAINER (Takes 100% of the screen width and height seamlessly) */}
      <div className="relative w-full flex flex-col bg-gradient-to-b from-[#0B2135] via-[#081B2C] to-[#030B12]">

        {/* Main Game Shell (Rich Turquoise Pool & Sunlit Carnival Deck spanning full viewport) */}
        <div
          className="relative w-full flex flex-col p-2 sm:p-3"
          style={{
            background: 'radial-gradient(circle at 50% 28%, #60A5FA 0%, #38BDF8 22%, #0284C7 48%, #0369A1 72%, #082F49 100%)',
          }}
        >
          {/* Subtle Ambient Caustics & Sun Gleam */}
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.85)_0%,transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-white/25 via-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Top Game Bar Inside The Pop-Up Arena */}
          <div className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-between px-2 pt-0.5 shrink-0">
            <button type="button" onClick={onClose} className="z-20 rounded-full border border-amber-300 bg-black/70 px-2 py-1 text-xs" aria-label="العودة إلى قائمة الألعاب">رجوع</button>

            {/* Center Wooden Sign */}
            <div className="transform scale-95 sm:scale-100 drop-shadow-xl hover:scale-102 transition-transform">
              <GreedyWoodSign />
            </div>

            {/* Top Controls: Audio, Close & Rules */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Calm Music Toggle Button (موسيقى هادئة) */}
              <button
                onClick={toggleMusic}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border shadow-md flex items-center justify-center text-xs font-bold transition-transform active:scale-90 ${
                  musicEnabled
                    ? 'bg-gradient-to-b from-[#00ACC1] to-[#00838F] border-[#80DEEA] text-yellow-300 shadow-[0_0_10px_rgba(128,222,234,0.7)]'
                    : 'bg-black/50 border-slate-600 text-slate-400'
                }`}
                title={musicEnabled ? 'كتم الموسيقى' : 'تشغيل الموسيقى الهادئة'}
              >
                {musicEnabled ? '🎵' : '🔇'}
              </button>

              {/* Sound FX Toggle Button */}
              <button
                onClick={toggleSound}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border shadow-md flex items-center justify-center text-xs font-bold transition-transform active:scale-90 ${
                  soundEnabled
                    ? 'bg-gradient-to-b from-[#00ACC1] to-[#00838F] border-[#80DEEA] text-cyan-100 shadow-[0_0_10px_rgba(128,222,234,0.7)]'
                    : 'bg-black/50 border-slate-600 text-slate-400'
                }`}
                title={soundEnabled ? 'كتم المؤثرات' : 'تشغيل المؤثرات'}
              >
                {soundEnabled ? '🔊' : '🔈'}
              </button>

              {/* Rules Button with Pink Dot */}
              <div className="relative">
                <button
                  onClick={() => setDetails('rules')}
                  className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-[#D79A00] shadow-md text-xs sm:text-sm font-black text-[#4E2600] active:scale-95 transition-transform"
                  style={{
                    background: 'linear-gradient(180deg, #FFFDE7 0%, #FFE082 45%, #FFB300 100%)',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.3), inset 0 1px 2px #FFFFFF',
                  }}
                >
                  قاعدة
                </button>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#F43F5E] border border-white shadow-xs animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#F43F5E] border border-white shadow-xs" />
              </div>
            </div>
          </div>

          {/* CLASSIC SIMPLE WINNER RIBBON (شريط بسيط بدون تأثير بخط كلاسيكي) */}
          {winRibbon && (
            <div className="w-full max-w-sm sm:max-w-md mx-auto px-4 my-1 z-30 transition-all duration-300">
              <div
                className="py-1.5 px-4 rounded-xl border border-[#D4AF37] shadow-xl flex items-center justify-between"
                style={{
                  background: 'linear-gradient(90deg, #1A130A 0%, #36230E 50%, #1A130A 100%)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,215,0,0.35)',
                }}
              >
                <span className="text-[#D4AF37] text-xs">◆</span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[#FFF2C6] text-base sm:text-lg font-bold tracking-wide select-none"
                    style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
                  >
                    {winRibbon}
                  </span>

                </div>
                <span className="text-[#D4AF37] text-xs">◆</span>
              </div>
            </div>
          )}

          {/* THE 3D GOLDEN FERRIS WHEEL ARENA (Clean layout, no overlapping, strictly single winner) */}
          <div className="relative flex-1 flex items-center justify-center w-full py-1 min-h-[300px] max-h-[380px] my-auto">
            <div className="relative w-full max-w-[350px] aspect-square flex items-center justify-center transform scale-95 sm:scale-100 transition-transform">

              {/* Golden Wheel Outer Beveled Rim with Metallic Sheen */}
              <div
                className="absolute inset-0 rounded-full border-[10px] border-[#FBC02D] pointer-events-none"
                style={{
                  boxShadow: '0 0 35px rgba(255,215,0,0.65), inset 0 3px 5px rgba(255,255,255,0.75), inset 0 -3px 6px rgba(183,110,0,0.9), 0 10px 25px rgba(0,0,0,0.5)',
                }}
              />
              <div className="absolute inset-[6px] rounded-full border-2 border-[#FFF9C4]/80 pointer-events-none" />
              <div className="absolute inset-[11px] rounded-full border border-[#B78103]/50 pointer-events-none" />

              {/* Rotating Carnival Light Dots around the Rim with Warm Incandescent Glow */}
              {[...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16;
                const r = 48;
                const lx = r * Math.cos((angle * Math.PI) / 180);
                const ly = r * Math.sin((angle * Math.PI) / 180);
                const isActive = (i + (roundTimer ?? 0)) % 2 === 0;
                return (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full border border-[#F57F17] pointer-events-none transition-opacity duration-300"
                    style={{
                      transform: `translate(${lx}%, ${ly}%)`,
                      background: isActive ? '#FFFDE7' : '#FFE082',
                      boxShadow: isActive
                        ? '0 0 10px #FFEE58, 0 0 4px #FFF'
                        : '0 0 4px rgba(255,238,88,0.4)',
                      opacity: isActive ? 1 : 0.45,
                    }}
                  />
                );
              })}

              {/* Wheel Spokes - Polished Golden Metallic Rods */}
              {[0, 45, 90, 135].map(deg => (
                <div
                  key={deg}
                  className="absolute w-[300px] sm:w-[330px] h-[3px] bg-gradient-to-r from-[#FDD835]/30 via-[#F57F17] to-[#FDD835]/30 pointer-events-none shadow-xs"
                  style={{ transform: `rotate(${deg}deg)` }}
                />
              ))}

              {/* CENTER HUB: Crowned Falcon "Toti Chat" Royal Mascot + High-Contrast Digital Timer */}
              <div
                className="relative z-10 w-[128px] h-[128px] sm:w-[138px] sm:h-[138px] rounded-full overflow-hidden flex flex-col items-center justify-center border-[4px] border-[#FFCA28] bg-black"
                style={{
                  boxShadow: '0 0 28px rgba(255,202,40,0.7), inset 0 0 14px rgba(255,215,0,0.5), 0 10px 25px rgba(0,0,0,0.85)',
                }}
              >
                {/* Crowned Falcon Royal Badge Image */}
                <img
                  src={falcon}
                  alt="Toti Chat Falcon"
                  className="w-full h-full object-cover select-none pointer-events-none scale-105"
                  draggable={false}
                />

                {/* Elegant Translucent Glass Timer Docked Gracefully at Lower Rim */}
                <div className="absolute bottom-1.5 inset-x-2 py-0.5 px-2 rounded-full bg-black/85 backdrop-blur-xs border border-amber-400/90 shadow-[0_2px_12px_rgba(0,0,0,0.9)] flex items-center justify-center gap-1.5 z-20">
                  <span className="text-[9px] sm:text-[10px] font-black text-amber-300 drop-shadow-xs whitespace-nowrap leading-none">
                    {roundState === 'betting' ? 'وقت التوقع:' : 'السحب:'}
                  </span>
                  <span
                    className={`font-black text-sm sm:text-base leading-none tracking-tight transition-all ${
                      roundTimer !== undefined && roundTimer <= 5 && roundState === 'betting'
                        ? 'text-red-500 scale-110 animate-bounce'
                        : 'text-amber-100'
                    }`}
                    style={{
                      fontFamily: "'Changa', 'Tajawal', sans-serif",
                      textShadow: '0 0 8px rgba(255,215,0,0.8), 0 2px 4px #000',
                    }}
                  >
                    {roundTimer === undefined ? '—' : roundTimer + 's'}
                  </span>
                </div>
              </div>

              {/* THE 8 FOOD SLOTS - Perfect geometric sizing, self-contained, no outer protrusions */}
              {WHEEL_ITEMS.map((item, index) => {
                const angleRad = (item.angle - 90) * (Math.PI / 180);
                const radius = 38.5;
                const x = radius * Math.cos(angleRad);
                const y = radius * Math.sin(angleRad);

                // Strictly ONE single square wins per round (بكل جولة يفوز مربع واحد فقط)
                const isWinningSlot = !!winRibbon && currentWinningFoodId === item.id;
                const isHighlightedSlot = activeHighlightIndex === index;
                const isJustBet = chosen === item.id;

                return (
                  <button type="button"
                    key={item.id} aria-label={item.nameAr} aria-pressed={isJustBet}
                    disabled={!canPick} onClick={() => void pick(item.id)}
                    className={`absolute z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 active:scale-95 ${
                      isJustBet ? 'scale-105' : ''
                    }`}
                    style={{
                      left: `calc(50% + ${x}%)`,
                      top: `calc(50% + ${y}%)`,
                    }}
                  >
                    {/* Food Card Slot - Self-Contained, No Extra Protrusions, Clean Bounds */}
                    <div
                      className={`relative greedy-food-card rounded-2xl overflow-hidden flex flex-col items-center justify-between border-[2px] transition-all duration-200 shadow-xl ${
                        isWinningSlot
                          ? 'border-yellow-200 ring-4 ring-yellow-400 z-30'
                          : isHighlightedSlot
                          ? 'border-cyan-100 ring-4 ring-cyan-300 z-25'
                          : 'border-[#FFE082] hover:border-white ring-1 ring-[#FFB300]/60'
                      }`}
                      style={{
                        background: isWinningSlot
                          ? 'linear-gradient(180deg, #FFF9C4 0%, #FFCA28 40%, #FF8F00 100%)'
                          : 'linear-gradient(180deg, #60A5FA 0%, #2563EB 30%, #1D4ED8 65%, #0C2E68 100%)',
                        boxShadow: isWinningSlot
                          ? '0 0 24px rgba(255,215,0,0.9), 0 6px 14px rgba(0,0,0,0.6), inset 0 2px 2px rgba(255,255,255,0.7)'
                          : '0 4px 12px rgba(0,0,0,0.45), inset 0 1.5px 2px rgba(255,255,255,0.65)',
                      }}
                    >
                      {isJustBet && <span className="text-[9px] text-amber-100">توقعك</span>}
                      {/* Real Food Photo - Crisp, centered with spotlight glow */}
                      <div className="flex-1 w-full flex items-center justify-center px-1 py-0.5 overflow-hidden relative">
                        <div className="absolute inset-0 bg-radial from-white/15 via-transparent to-transparent pointer-events-none" />
                        <FoodIconRenderer id={item.id} size={39} className="drop-shadow-md relative z-1" />
                      </div>

                      {/* Multiplier Ribbon - Docked at bottom of card */}
                      <div
                        className="w-full py-0.5 text-center shadow-xs border-t border-[#FFF9C4]/80 shrink-0 leading-none"
                        style={{
                          background: 'linear-gradient(180deg, #FFFDE7 0%, #FFD54F 40%, #FFB300 100%)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}
                      >
                        <span className="text-[9px] sm:text-[10px] font-black text-[#3E1B00] leading-none whitespace-nowrap drop-shadow-[0_0.5px_0_rgba(255,255,255,0.5)]">
                          {item.nameAr}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Salad (سلطة) - Small Square on Left */}
            <div className="absolute left-2 sm:left-4 bottom-2 z-15 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-b from-[#1E5080] via-[#0D3660] to-[#072445] border-2 border-[#FFD54F]/90 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] flex flex-col items-center justify-between p-1 overflow-hidden select-none pointer-events-none">
              <div className="flex-1 flex items-center justify-center">
                <FoodIconRenderer id="salad" size={32} className="drop-shadow-sm" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-white leading-none drop-shadow-xs">سلطة</span>
            </div>

            {/* Pizza (بيتزا) - Small Square on Right */}
            <div className="absolute right-2 sm:right-4 bottom-2 z-15 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-b from-[#1E5080] via-[#0D3660] to-[#072445] border-2 border-[#FFD54F]/90 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] flex flex-col items-center justify-between p-1 overflow-hidden select-none pointer-events-none">
              <div className="flex-1 flex items-center justify-center">
                <FoodIconRenderer id="pizza" size={32} className="drop-shadow-sm" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-white leading-none drop-shadow-xs">بيتزا</span>
            </div>
          </div>

          {/* BOTTOM CONTROLS WRAPPER (Fluid, responsive, perfectly aligned) */}
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-1.5 shrink-0 z-10">

            <p className="rounded-xl bg-sky-950/80 px-3 py-1.5 text-center text-xs text-cyan-50" role="status">
              {error ? 'تعذر الاتصال. نحاول مجدداً تلقائياً…' : unavailable ? 'غريدي غير متاحة حالياً.'
                : !state ? 'جارٍ التحقق من حسابك…' : chosen ? 'توقعك مسجّل · المشاركة مجانية' : 'اختر طعاماً للتوقع · المشاركة مجانية'}
            </p>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-amber-400/70 bg-[#3E2723] p-2">
              {state?.player.avatar && <img src={imageUrl(state.player.avatar)} alt="" className="size-8 shrink-0 rounded-full object-cover" />}
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{state?.player.name ?? '—'}</p>
                <p dir="ltr" className="text-right text-xs text-amber-100">ID: {state?.player.publicId ?? '—'}</p></div>
              <span className="shrink-0 text-xs font-bold">رصيدك <bdi>{formatCoins(playerCoins)}</bdi> <CoinIcon size={13} /></span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-amber-300 bg-amber-600 px-2 py-1" aria-label="نتائج الجولات السابقة">
              <span className="shrink-0 text-xs font-bold">النتائج</span>
              {pastResults.map(item => <span key={item.slot} className="size-7 shrink-0 rounded-full bg-white" title={WHEEL_ITEMS.find(food => food.id === item.winner)?.nameAr}>
                <FoodIconRenderer id={item.winner} size={24} />
              </span>)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDetails('records')} className="rounded-xl border border-amber-300 bg-[#643710] px-3 py-1.5 text-sm font-bold">سجل توقعاتي</button>
              <button type="button" onClick={() => setDetails('leaders')} className="rounded-xl border border-amber-300 bg-[#643710] px-3 py-1.5 text-sm font-bold">ترتيب التوقعات</button>
            </div>
          </div>
        </div>
      </div>
      {toastMessage && <p role="status" className="absolute inset-x-3 bottom-4 z-40 rounded-xl bg-black/90 p-2 text-center text-xs">{toastMessage}</p>}
      {details && <div className="absolute inset-0 z-40 grid place-items-center bg-black/75 p-3" role="dialog"
        aria-label={details === 'rules' ? 'قواعد عجلة توتي' : details === 'leaders' ? 'ترتيب التوقعات' : 'سجل توقعاتي'}>
        <section className="w-full max-w-sm rounded-2xl border border-amber-300 bg-[#18729A] p-3">
          <div className="mb-2 flex justify-between"><strong>{details === 'rules' ? 'قواعد عجلة توتي' : details === 'leaders' ? 'ترتيب التوقعات' : 'سجل توقعاتي'}</strong>
            <button type="button" onClick={() => setDetails(undefined)}>إغلاق</button></div>
          {details === 'rules' ? <p className="text-sm">عندك 22 ثانية تختار أكلة واحدة، وبعدها الخادم يعلن النتيجة. التوقع ما يخصم رصيدك وما يدفع جائزة بالكوينز.</p>
            : details === 'leaders' ? <>
              <div className="mb-2 flex gap-2">
                {([['day','اليوم'],['week','الأسبوع'],['month','الشهر']] as const).map(([value,label]) =>
                  <button className="rounded-lg bg-sky-950/60 px-2 py-1 aria-pressed:bg-amber-700" key={value} type="button"
                    aria-pressed={period===value} onClick={() => setPeriod(value)}>{label}</button>)}
              </div>
              {leadersError && <button type="button" onClick={() => setLeaderAttempt(value => value + 1)}>تعذر التحميل · إعادة المحاولة</button>}
              {!leadersError && !leaders && <p role="status">جارٍ تحميل الترتيب…</p>}
              {leaders?.length === 0 && <p>ماكو توقعات صحيحة مسجلة بهالفترة.</p>}
              <ol className="max-h-48 space-y-1 overflow-y-auto text-sm">
                {leaders?.map(row => <li key={row.public_id} className="flex justify-between rounded-lg bg-sky-950/65 p-2">
                  <span>{row.name ?? 'مستخدم'}</span><bdi>{row.wins}</bdi>
                </li>)}
              </ol>
            </> : <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
              {(!state?.records.length) && <li>ماكو توقعات محسومة لحد الآن.</li>}
              {state?.records.map(item => <li key={item.slot} className="rounded-lg bg-sky-950/65 p-2">
                {WHEEL_ITEMS.find(food => food.id === item.pick)?.nameAr} · {item.pick === item.winner ? 'توقع صحيح' : 'توقع غير صحيح'}
              </li>)}
            </ul>}
        </section>
      </div>}
    </div>
  );
}
