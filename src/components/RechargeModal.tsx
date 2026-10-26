import React, { useState } from 'react';
import { ChevronRight, FileText, X, Check, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { sounds } from '../utils/audio';

// 6 Recharge Packs exactly from Image 1
export interface RechargePack {
  id: string;
  coins: number;
  price: string;
}

const rechargePacks: RechargePack[] = [
  { id: 'pack-1', coins: 4900, price: '0.99 $' },
  { id: 'pack-2', coins: 24500, price: '4.99 $' },
  { id: 'pack-3', coins: 49000, price: '9.99 $' },
  { id: 'pack-4', coins: 122500, price: '24.99 $' },
  { id: 'pack-5', coins: 245000, price: '49.99 $' },
  { id: 'pack-6', coins: 490000, price: '99.99 $' },
];

/* =========================================================
   SVG Graphics for Realistic 3D Coins, Diamond & Backgrounds
   ========================================================= */

// Damask / Arabesque subtle pattern overlay
const DamaskPattern: React.FC = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 200"
    preserveAspectRatio="none"
  >
    <defs>
      <pattern id="damask" width="60" height="60" patternUnits="userSpaceOnUse">
        <path
          d="M30 10 C35 18 42 20 50 20 C42 24 38 32 38 40 C34 32 26 30 18 30 C26 26 28 18 30 10 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.2"
          opacity="0.4"
        />
        <circle cx="30" cy="30" r="4" fill="#ffffff" opacity="0.3" />
        <path
          d="M10 50 C15 55 18 58 25 58 C18 60 16 66 16 70 C14 66 8 64 2 64 C8 62 9 55 10 50 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.8"
          opacity="0.3"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#damask)" />
  </svg>
);

// Large 3D Embossed Gold Dollar Watermark (left side of Yellow Card)
const GoldDollarWatermark: React.FC = () => (
  <div className="absolute -left-5 -bottom-7 w-36 h-36 pointer-events-none select-none">
    <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="wmOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF275" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#F5B800" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#DF9300" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="wmInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#C97F00" />
        </linearGradient>
        <linearGradient id="wmSignGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF8B8" />
          <stop offset="100%" stopColor="#BF7300" />
        </linearGradient>
      </defs>
      {/* Outer thick beveled circle rim */}
      <circle cx="80" cy="80" r="72" fill="url(#wmOuterGrad)" />
      <circle cx="80" cy="80" r="62" fill="none" stroke="#FFA700" strokeWidth="3" opacity="0.6" />
      <circle cx="80" cy="80" r="58" fill="url(#wmInnerGrad)" />
      {/* Crescent inner cut effect */}
      <path
        d="M38 48 C48 30 70 24 94 30 C122 36 138 65 132 94 C128 112 114 128 96 134 C120 120 128 85 110 58 C94 38 64 34 38 48 Z"
        fill="#FFE885"
        opacity="0.5"
      />
      {/* Embossed Bold 3D Dollar Sign */}
      <text
        x="80"
        y="108"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="82"
        fill="url(#wmSignGrad)"
        stroke="#A05A00"
        strokeWidth="3.5"
        letterSpacing="-2"
      >
        $
      </text>
    </svg>
  </div>
);

// Small round shiny gold coin icon next to the number on yellow card
const SmallGoldCoin: React.FC = () => (
  <svg viewBox="0 0 36 36" className="w-6 h-6 inline-block drop-shadow-xs">
    <defs>
      <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF066" />
        <stop offset="50%" stopColor="#FFBA08" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="17" fill="url(#coinGrad)" stroke="#B45309" strokeWidth="1" />
    <circle cx="18" cy="18" r="13.5" fill="none" stroke="#FEF08A" strokeWidth="1" opacity="0.9" />
    <text
      x="18"
      y="24"
      textAnchor="middle"
      fontFamily="sans-serif"
      fontWeight="900"
      fontSize="18"
      fill="#78350F"
    >
      $
    </text>
  </svg>
);

// Large 3D Faceted Brilliant Blue Diamond (for Diamond Card)
const BigDiamondGraphic: React.FC = () => (
  <div className="absolute -left-2 -bottom-2 w-32 h-28 pointer-events-none select-none">
    <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="facetTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="facetCenter" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="facetLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="facetRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
        <linearGradient id="facetBottom" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#034570" />
        </linearGradient>
      </defs>
      {/* Table (Top Flat Face) */}
      <polygon points="35,16 85,16 102,38 18,38" fill="url(#facetTop)" stroke="#E0F2FE" strokeWidth="0.8" />
      {/* Crown facets */}
      <polygon points="35,16 60,38 85,16" fill="#F0F9FF" opacity="0.9" />
      <polygon points="18,38 35,16 60,38" fill="url(#facetLeft)" />
      <polygon points="85,16 102,38 60,38" fill="url(#facetRight)" />
      {/* Pavilion facets (Bottom point) */}
      <polygon points="18,38 60,38 60,94" fill="url(#facetLeft)" stroke="#38BDF8" strokeWidth="0.5" />
      <polygon points="60,38 102,38 60,94" fill="url(#facetBottom)" stroke="#0284C7" strokeWidth="0.5" />
      <polygon points="38,38 60,94 82,38" fill="url(#facetCenter)" stroke="#E0F2FE" strokeWidth="0.6" />
      {/* Sparkle highlights */}
      <circle cx="48" cy="28" r="3" fill="#FFFFFF" opacity="0.8" />
      <circle cx="76" cy="48" r="2.5" fill="#FFFFFF" opacity="0.9" />
    </svg>
  </div>
);

// Small Cyan Diamond Icon next to number on Diamond Card
const SmallDiamond: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 inline-block drop-shadow-xs">
    <defs>
      <linearGradient id="smallDiaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    <polygon points="6,4 18,4 22,10 12,21 2,10" fill="url(#smallDiaGrad)" stroke="#BAE6FD" strokeWidth="0.8" />
    <polygon points="6,4 12,10 18,4" fill="#F0F9FF" opacity="0.8" />
    <polygon points="2,10 12,21 12,10" fill="#0369A1" opacity="0.6" />
    <polygon points="22,10 12,21 12,10" fill="#0284C7" opacity="0.8" />
  </svg>
);

/* =========================================================
   6 Custom 3D Gold Coin Stacks for the Grid Packages
   ========================================================= */

// Reusable single coin renderer
const SingleCoinItem: React.FC<{ cx: number; cy: number; width?: number; height?: number }> = ({
  cx,
  cy,
  width = 38,
  height = 14,
}) => {
  const rx = width / 2;
  const ry = height / 2;
  return (
    <g>
      {/* Coin Thickness side */}
      <path
        d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L ${cx + rx} ${cy + 6} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy + 6} Z`}
        fill="url(#coinEdgeGrad)"
        stroke="#9A6100"
        strokeWidth="0.75"
      />
      {/* Coin Top Face */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="url(#coinTopGrad)"
        stroke="#FFF176"
        strokeWidth="0.8"
      />
      {/* Inner Rim */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx - 3}
        ry={ry - 2}
        fill="none"
        stroke="#E69500"
        strokeWidth="0.75"
        opacity="0.8"
      />
      {/* Dollar Sign */}
      <text
        x={cx}
        y={cy + 3.5}
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="10"
        fill="#874D00"
      >
        $
      </text>
    </g>
  );
};

// Common SVG gradients wrapper for coins
const CoinDefs: React.FC = () => (
  <defs>
    <linearGradient id="coinTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFF9A6" />
      <stop offset="35%" stopColor="#FFC800" />
      <stop offset="100%" stopColor="#E69500" />
    </linearGradient>
    <linearGradient id="coinEdgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#E69500" />
      <stop offset="50%" stopColor="#B36B00" />
      <stop offset="100%" stopColor="#804400" />
    </linearGradient>
  </defs>
);

// 1. Stack for 4,900 coins (Neat 3 coins stack)
const CoinStack4900: React.FC = () => (
  <svg viewBox="0 0 80 56" className="w-16 h-11 drop-shadow-md">
    <CoinDefs />
    <SingleCoinItem cx={40} cy={34} width={42} height={16} />
    <SingleCoinItem cx={40} cy={26} width={42} height={16} />
    <SingleCoinItem cx={40} cy={18} width={42} height={16} />
  </svg>
);

// 2. Stack for 24,500 coins (Two side-by-side stacks)
const CoinStack24500: React.FC = () => (
  <svg viewBox="0 0 80 56" className="w-16 h-11 drop-shadow-md">
    <CoinDefs />
    {/* Left stack */}
    <SingleCoinItem cx={30} cy={34} width={34} height={14} />
    <SingleCoinItem cx={30} cy={27} width={34} height={14} />
    <SingleCoinItem cx={30} cy={20} width={34} height={14} />
    {/* Right stack (front) */}
    <SingleCoinItem cx={50} cy={35} width={34} height={14} />
    <SingleCoinItem cx={50} cy={28} width={34} height={14} />
  </svg>
);

// 3. Stack for 49,000 coins (Three stacked piles)
const CoinStack49000: React.FC = () => (
  <svg viewBox="0 0 80 56" className="w-16 h-11 drop-shadow-md">
    <CoinDefs />
    {/* Back left */}
    <SingleCoinItem cx={25} cy={32} width={32} height={13} />
    <SingleCoinItem cx={25} cy={25} width={32} height={13} />
    {/* Back right */}
    <SingleCoinItem cx={55} cy={32} width={32} height={13} />
    <SingleCoinItem cx={55} cy={25} width={32} height={13} />
    {/* Center front */}
    <SingleCoinItem cx={40} cy={36} width={34} height={14} />
    <SingleCoinItem cx={40} cy={29} width={34} height={14} />
    <SingleCoinItem cx={40} cy={22} width={34} height={14} />
  </svg>
);

// 4. Stack for 122,500 coins (Medium pile)
const CoinStack122500: React.FC = () => (
  <svg viewBox="0 0 80 56" className="w-16 h-11 drop-shadow-md">
    <CoinDefs />
    <SingleCoinItem cx={22} cy={34} width={30} height={12} />
    <SingleCoinItem cx={22} cy={27} width={30} height={12} />
    <SingleCoinItem cx={58} cy={34} width={30} height={12} />
    <SingleCoinItem cx={58} cy={27} width={30} height={12} />
    <SingleCoinItem cx={40} cy={36} width={34} height={14} />
    <SingleCoinItem cx={40} cy={29} width={34} height={14} />
    <SingleCoinItem cx={40} cy={21} width={34} height={14} />
  </svg>
);

// 5. Stack for 245,000 coins (Large cluster)
const CoinStack245000: React.FC = () => (
  <svg viewBox="0 0 80 56" className="w-16 h-11 drop-shadow-md">
    <CoinDefs />
    {/* Back row */}
    <SingleCoinItem cx={20} cy={28} width={28} height={12} />
    <SingleCoinItem cx={20} cy={21} width={28} height={12} />
    <SingleCoinItem cx={60} cy={28} width={28} height={12} />
    <SingleCoinItem cx={60} cy={21} width={28} height={12} />
    {/* Front center piles */}
    <SingleCoinItem cx={32} cy={35} width={32} height={13} />
    <SingleCoinItem cx={32} cy={28} width={32} height={13} />
    <SingleCoinItem cx={32} cy={20} width={32} height={13} />
    <SingleCoinItem cx={50} cy={36} width={32} height={13} />
    <SingleCoinItem cx={50} cy={29} width={32} height={13} />
  </svg>
);

// 6. Stack for 490,000 coins (Massive treasure mountain)
const CoinStack490000: React.FC = () => (
  <svg viewBox="0 0 80 56" className="w-16 h-11 drop-shadow-md">
    <CoinDefs />
    {/* Back left */}
    <SingleCoinItem cx={18} cy={26} width={28} height={12} />
    <SingleCoinItem cx={18} cy={19} width={28} height={12} />
    {/* Back right */}
    <SingleCoinItem cx={62} cy={26} width={28} height={12} />
    <SingleCoinItem cx={62} cy={19} width={28} height={12} />
    {/* Center tall column */}
    <SingleCoinItem cx={40} cy={34} width={32} height={13} />
    <SingleCoinItem cx={40} cy={27} width={32} height={13} />
    <SingleCoinItem cx={40} cy={20} width={32} height={13} />
    <SingleCoinItem cx={40} cy={13} width={32} height={13} />
    {/* Front flanking coins */}
    <SingleCoinItem cx={25} cy={37} width={30} height={13} />
    <SingleCoinItem cx={55} cy={37} width={30} height={13} />
  </svg>
);

// Helper mapping to return coin component by ID
const getCoinStackIllustration = (packId: string) => {
  switch (packId) {
    case 'pack-1':
      return <CoinStack4900 />;
    case 'pack-2':
      return <CoinStack24500 />;
    case 'pack-3':
      return <CoinStack49000 />;
    case 'pack-4':
      return <CoinStack122500 />;
    case 'pack-5':
      return <CoinStack245000 />;
    case 'pack-6':
      return <CoinStack490000 />;
    default:
      return <CoinStack4900 />;
  }
};

/* =========================================================
   Main Recharge Screen Modal Component
   ========================================================= */

export const RechargeModal: React.FC = () => {
  const {
    openRechargeModal,
    setOpenRechargeModal,
    currentUser,
    rechargeCoins,
    convertDiamondsToCoins,
    transactions,
  } = useApp();

  // Two tabs: 'coins' (عملات معدنية) and 'diamonds' (ألماسي)
  const [activeTab, setActiveTab] = useState<'coins' | 'diamonds'>('coins');
  const [selectedPack, setSelectedPack] = useState<RechargePack>(rechargePacks[0]); // default 0.99$ selected like in image 1
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showOrderCheckModal, setShowOrderCheckModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState<number>(100000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!openRechargeModal) return null;

  // Trigger Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Confirm Recharge Handler
  const handleConfirmRecharge = () => {
    setIsProcessing(true);
    sounds.playClick();

    setTimeout(() => {
      rechargeCoins(selectedPack.coins);
      setIsProcessing(false);
      sounds.playCoin();

      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
      });

      showToast(`تم شحن ${selectedPack.coins.toLocaleString('ar-EG')} عملة بنجاح! 🎉`);
    }, 650);
  };

  // Convert Diamonds to Coins Handler (30% rule: 100,000 Diamonds = 30,000 Coins)
  const handleConvertDiamonds = () => {
    const userDiamonds = currentUser.diamonds || 0;
    if (exchangeAmount <= 0) {
      showToast('يرجى إدخال كمية صالحة للتحويل');
      return;
    }
    if (userDiamonds < exchangeAmount) {
      showToast(`رصيدك الحالي (${userDiamonds.toLocaleString('ar-EG')}) غير كافٍ`);
      return;
    }

    const success = convertDiamondsToCoins(exchangeAmount);
    if (success) {
      const calculatedCoins = Math.floor(exchangeAmount * 0.3);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.5 } });
      setShowExchangeModal(false);
      showToast(
        `تم فك ${exchangeAmount.toLocaleString('ar-EG')} ألماسة إلى ${calculatedCoins.toLocaleString('ar-EG')} كوينز بنسبة 30%! ✨`
      );
    } else {
      showToast('تعذر إتمام عملية الفك، يرجى المحاولة لاحقاً');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-['Cairo',sans-serif] select-none p-0 sm:p-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container - replicates native mobile screen */}
      <div className="w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl bg-white text-slate-800 flex flex-col shadow-2xl overflow-y-auto no-scrollbar relative">
        {/* Top Header matching Image 2 */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-100">
          {/* Left: Document / Receipt Icon for Transactions History */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowHistoryModal(true);
            }}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition"
            title="سجل الشحن"
          >
            <FileText className="w-5 h-5 text-slate-600" />
          </button>

          {/* Center: Title "شحن العملات" */}
          <h2 className="text-base font-extrabold text-slate-900">شحن العملات</h2>

          {/* Right: Back Arrow Button (ChevronRight for RTL) */}
          <button
            onClick={() => {
              sounds.playClick();
              setOpenRechargeModal(false);
            }}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition"
            title="رجوع"
          >
            <ChevronRight className="w-6 h-6 text-slate-800" />
          </button>
        </div>

        {/* Tab Switcher: "عملات معدنية" and "ألماسي" exactly matching Image 2 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-full shadow-inner">
            {/* 1. عملات معدنية (Coins) */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('coins');
              }}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'coins'
                  ? 'bg-[#38d89e] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              عملات معدنية
            </button>

            {/* 2. ألماسي (Diamonds) */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('diamonds');
              }}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'diamonds'
                  ? 'bg-[#38d89e] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              ألماسي
            </button>
          </div>
        </div>

        {/* =========================================================
            TAB 1: عملات معدنية (Coins Recharge) - Exactly Image 1
           ========================================================= */}
        {activeTab === 'coins' && (
          <div className="p-4 space-y-4">
            {/* Top Yellow/Golden Balance Card matching Image 1 */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FFC200] via-[#F8B700] to-[#E59200] p-4 text-white shadow-md min-h-[105px] flex flex-col justify-between">
              {/* Subtle Arabesque Damask Texture */}
              <DamaskPattern />

              {/* Large Embossed 3D Gold Dollar Coin on Left */}
              <GoldDollarWatermark />

              {/* Card Content (Right-aligned in RTL) */}
              <div className="relative z-10 text-right pr-1">
                <p className="text-white/95 text-xs font-bold tracking-wide">
                  رصيد الماس الحالي
                </p>
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <span
                    className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs tracking-tight truncate max-w-[230px]"
                    title={(currentUser.coins ?? 0).toLocaleString('en-US')}
                  >
                    {currentUser.coins > 0 ? currentUser.coins.toLocaleString('en-US') : '0'}
                  </span>
                  <SmallGoldCoin />
                </div>
              </div>
            </div>

            {/* Section Title: "كمية الشحن" */}
            <div className="text-right pt-1">
              <h3 className="text-sm font-black text-slate-800">كمية الشحن</h3>
            </div>

            {/* 6 Packages Grid (3 Columns x 2 Rows) */}
            <div className="grid grid-cols-3 gap-2.5">
              {rechargePacks.map((pack) => {
                const isSelected = selectedPack.id === pack.id;

                return (
                  <div
                    key={pack.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedPack(pack);
                    }}
                    className={`relative rounded-2xl bg-white border flex flex-col items-center justify-between pt-3 pb-0 overflow-hidden cursor-pointer transition-all active:scale-96 shadow-xs ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    {/* Coin Stack 3D Visual */}
                    <div className="my-1 flex items-center justify-center h-12">
                      {getCoinStackIllustration(pack.id)}
                    </div>

                    {/* Coins Amount */}
                    <div className="text-center px-1 mb-2">
                      <span className="text-xs font-black text-slate-800">
                        {pack.coins.toLocaleString('en-US')}
                      </span>
                    </div>

                    {/* Bottom Price Pill Banner (Highlighted in Amber/Gold when selected like Image 1) */}
                    <div
                      className={`w-full py-1.5 text-center text-xs font-black transition-colors ${
                        isSelected
                          ? 'bg-[#F59E0B] text-white'
                          : 'bg-[#FFF8EA] text-[#8C5810] hover:bg-amber-100/70'
                      }`}
                    >
                      {pack.price}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Action Button: "تأكيد الشحن" (Vibrant Mint/Green Pill) */}
            <div className="pt-2">
              <button
                onClick={handleConfirmRecharge}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#20C98F] to-[#12B97C] hover:from-[#1eb883] hover:to-[#0fa66f] text-white font-black text-base shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>تأكيد الشحن</span>
                )}
              </button>
            </div>

            {/* Footer Notice & Verification Link */}
            <div className="text-center pt-1 pb-3 text-xs leading-relaxed space-y-0.5">
              <p className="text-sky-600 font-semibold">
                إذا لم يتم شحن العملات خلال 3 دقائق
              </p>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowOrderCheckModal(true);
                }}
                className="text-sky-600 font-bold hover:underline active:opacity-75 inline-block"
              >
                يرجى النقر هنا للتحقق من الطلب
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: ألماسي (Diamonds View) - Exactly Image 2
           ========================================================= */}
        {activeTab === 'diamonds' && (
          <div className="p-4 space-y-4">
            {/* Top Aqua / Cyan Diamond Balance Card matching Image 2 */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#00D4FF] via-[#00A7FF] to-[#0088FF] p-4 text-white shadow-md min-h-[105px] flex flex-col justify-between">
              {/* Subtle Arabesque Damask Texture */}
              <DamaskPattern />

              {/* Large 3D Faceted Diamond on Left */}
              <BigDiamondGraphic />

              {/* Card Content (Right-aligned in RTL) */}
              <div className="relative z-10 text-right pr-1">
                <p className="text-white text-xs font-bold tracking-wide">
                  ألماسي
                </p>
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <span className="text-3xl font-black text-white drop-shadow-xs tracking-tight">
                    {(currentUser.diamonds || 0).toFixed(1)}
                  </span>
                  <SmallDiamond />
                </div>
              </div>
            </div>

            {/* Subtext below card matching Image 2 */}
            <div className="text-center pt-2">
              <p className="text-xs font-bold text-slate-400">
                استلم الهدايا للحصول على الألما
              </p>
            </div>

            {/* Official 30% Conversion Rule Banner */}
            <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 border border-sky-200/70 rounded-2xl p-3 flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                  %
                </span>
                <div className="text-right">
                  <p className="font-extrabold text-sky-900">آلية الفك الرسمية: 30%</p>
                  <p className="text-[10px] text-sky-700 font-semibold mt-0.5">
                    كل 100,000 ألماسة = 30,000 كوينز معدنية
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 bg-sky-600 text-white font-black text-[11px] rounded-lg shadow-xs">
                30%
              </span>
            </div>

            {/* Action Button: "تحويل" (Cyan Pill Button matching Image 2) */}
            <div className="pt-1">
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowExchangeModal(true);
                }}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#29B6F6] to-[#0288D1] hover:from-[#26a5df] hover:to-[#0277bd] text-white font-extrabold text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-1.5"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>تحويل</span>
              </button>
            </div>

            {/* Explanatory Info Card for Diamonds */}
            <div className="mt-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>كيف تحصل على الألماس وتفكه؟</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                عند استلام الهدايا من الأصدقاء في الغرف الصوتية، يتم إيداع الألماس في حسابك، وتستطيع فكه بنسبة 30% وتحويله إلى كوينز على الفور (مثال: فك 100,000 ألماسة يعطيك 30,000 كوينز).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          Overlay Modal: Transactions / Recharge History (Receipt Icon)
         ========================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">سجل عمليات الشحن</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 divide-y divide-slate-100 overflow-y-auto no-scrollbar flex-1">
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{tx.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.timestamp}</p>
                    </div>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {tx.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  لا توجد عمليات شحن سابقة
                </div>
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="mt-3 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          Overlay Modal: Order Verification Dialog (Footer Link)
         ========================================================= */}
      {showOrderCheckModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">التحقق من حالة الشحن</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              جميع طلبات الشحن تتم فورياً وبشكل آمن ومحمي. إذا واجهت أي تأخير، يرجى التأكد من اتصالك بالإنترنت أو إرسال رقم المعاملة للدعم الفني.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-right text-[11px] text-slate-600 space-y-1">
              <p>• رقم الحساب: <span className="font-bold text-slate-900">{currentUser.id}</span></p>
              <p>• حالة المزامنة: <span className="text-emerald-600 font-bold">متصل بالخادم</span></p>
            </div>
            <button
              onClick={() => {
                sounds.playCoin();
                setShowOrderCheckModal(false);
                showToast('تمت إعادة مزامنة رصيد حسابك بنجاح');
              }}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs rounded-full shadow-md active:scale-95 transition"
            >
              إعادة التحقق الآن
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          Overlay Modal: Diamonds Exchange Dialog ("تحويل / فك الألماس")
         ========================================================= */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-black">
                  %
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">فك الألماس وتحويله لكوينز</h3>
              </div>
              <button
                onClick={() => setShowExchangeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {/* Current Diamonds Balance */}
              <div className="bg-sky-50 rounded-2xl p-3 flex items-center justify-between text-xs border border-sky-100">
                <span className="text-slate-600 font-bold">رصيدك المتاح من الألماس:</span>
                <span className="font-black text-sky-700 text-sm">
                  {(currentUser.diamonds || 0).toLocaleString('ar-EG')} 💎
                </span>
              </div>

              {/* Conversion Rule Note */}
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-3 py-2 text-[11px] text-amber-900 text-center font-bold">
                ⚡ نسبة الفك الرسمية: 30% (كل 100,000 💎 = 30,000 🪙)
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 text-right">
                  اختيار سريع للكمية:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { dia: 10000, label: '10K' },
                    { dia: 50000, label: '50K' },
                    { dia: 100000, label: '100K' },
                    { dia: currentUser.diamonds || 0, label: 'الكل' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setExchangeAmount(preset.dia)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                        exchangeAmount === preset.dia
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input for custom amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                  كمية الألماس المراد فكها:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    max={currentUser.diamonds || 1000000}
                    value={exchangeAmount || ''}
                    onChange={(e) => setExchangeAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-sm text-slate-800 focus:outline-sky-500"
                    placeholder="أدخل عدد الألماس..."
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    💎 ألماسة
                  </span>
                </div>
              </div>

              {/* Output Preview Calculation (30% formula) */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/80 text-center">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  الكوينز المحصلة بعد الفك (بنسبة 30%):
                </span>
                <span className="text-xl font-black text-emerald-600 block mt-0.5">
                  {Math.floor(exchangeAmount * 0.3).toLocaleString('ar-EG')} 🪙
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                  (خصم {exchangeAmount.toLocaleString('ar-EG')} 💎 ➜ إضافة {Math.floor(exchangeAmount * 0.3).toLocaleString('ar-EG')} 🪙)
                </span>
              </div>
            </div>

            <button
              onClick={handleConvertDiamonds}
              disabled={exchangeAmount <= 0 || (currentUser.diamonds || 0) < exchangeAmount}
              className="w-full py-3 bg-gradient-to-r from-[#29B6F6] to-[#0288D1] hover:from-[#26a5df] hover:to-[#0277bd] disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-md active:scale-95 transition"
            >
              تأكيد فك الألماس (30%)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
