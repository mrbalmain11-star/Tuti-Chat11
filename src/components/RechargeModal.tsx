import { latinDigits } from '../utils/digits';
import React, { useState, useEffect, useRef, useEffectEvent } from 'react';
import { ArrowLeft, ChevronLeft, BadgeCheck, ShieldCheck, Info, Headset, MessageCircle, Zap, FileText, X, Check, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { stagingBackend } from '../services/stagingBackend';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { RechargeAgentFrame } from './RechargeAgentFrame';
import { fetchRechargeAgents, fetchRechargeHistory, type RechargeAgentCard, type RechargeHistoryRow } from '../services/rechargeDirectory';
import './user-recharge.css';
import { sounds } from '../utils/audio';

const diamondRejections: Record<string, string> = {
  'Insufficient diamonds': 'رصيد الألماس غير كافٍ.',
  'Insufficient tracked diamonds': 'المبلغ يتجاوز رصيد الألماس المؤهل للتحويل. جرّب مبلغاً أقل.',
  'Amount too small to redeem': 'كمية الألماس أقل من الحد اللازم للتحويل.',
  'Redemption quote changed; confirm again': 'تغيرت قيمة التحويل. راجع العرض الجديد وأكّد مرة ثانية.',
  'Wallet amount out of range': 'تعذر التحويل بسبب حد رصيد المحفظة.',
};
function diamondError(message: string) {
  return diamondRejections[message] ?? 'تعذر حساب قيمة التحويل. تحقق من الاتصال وحاول مرة ثانية.';
}

// 6 Recharge Packs exactly from Image 1
export interface RechargePack {
  id: string;
  coins: number;
  price: string;
}


/* =========================================================
   SVG Graphics for Realistic 3D Coins, Diamond & Backgrounds
   ========================================================= */

// Damask / Arabesque subtle pattern overlay
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
  <div className="h-full w-full">
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

// 2. Stack for 24,500 coins (Two side-by-side stacks)
const CoinStack24500: React.FC = () => (
  <svg viewBox="0 0 80 56" className="w-16 h-11 drop-shadow-md">
    {/* Left stack */}
    <SingleCoinItem cx={30} cy={34} width={34} height={14} />
    <SingleCoinItem cx={30} cy={27} width={34} height={14} />
    <SingleCoinItem cx={30} cy={20} width={34} height={14} />
    {/* Right stack (front) */}
    <SingleCoinItem cx={50} cy={35} width={34} height={14} />
    <SingleCoinItem cx={50} cy={28} width={34} height={14} />
  </svg>
);

// 6. Stack for 490,000 coins (Massive treasure mountain)
const CoinStack490000: React.FC = () => (
  <svg viewBox="0 0 80 56" className="w-16 h-11 drop-shadow-md">
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

export const RechargeModal: React.FC = () => {
  const {
    openRechargeModal,
    setOpenRechargeModal,
    currentUser,
    conversations,
    setOpenChatThread,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'coins' | 'diamonds'>('coins');
  const [rechargePacks, setRechargePacks] = useState<RechargePack[]>([]);
  const [selectedPack, setSelectedPack] = useState<RechargePack | null>(null);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState<number>(100000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [rechargeMode, setRechargeMode] = useState<'app' | 'agents'>('app');
  const [rechargeAgents, setRechargeAgents] = useState<RechargeAgentCard[]>([]);
  const [agentsError, setAgentsError] = useState('');
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contacting, setContacting] = useState(false);
  const [wallet, setWallet] = useState<{ coins: number; diamonds: number }>();
  const [walletError, setWalletError] = useState(false);
  const [history, setHistory] = useState<RechargeHistoryRow[]>();
  const [historyError, setHistoryError] = useState(false);
  const [packPage, setPackPage] = useState(0);
  const onBack = useEffectEvent(() => {
    if (exchangeLock.current) return;
    if (showExchangeModal) setShowExchangeModal(false);
    else if (showHistoryModal) setShowHistoryModal(false);
    else if (rechargeMode === 'agents') setRechargeMode('app');
    else setOpenRechargeModal(false);
  });
  useEffect(() => {
    if (!openRechargeModal || Capacitor.getPlatform() !== 'android') return;
    let active = true;
    const handle = CapacitorApp.addListener('backButton', () => { if (active) onBack(); });
    void handle.catch(console.error);
    return () => { active = false; void handle.then(subscription => subscription.remove()).catch(console.error); };
  }, [openRechargeModal]);
  useEffect(() => {
    if (openRechargeModal) return;
    setRechargeMode('app');
    setActiveTab('coins');
    setShowHistoryModal(false);
    setShowExchangeModal(false);
  }, [openRechargeModal]);

  useEffect(() => {
    setWallet(undefined);
    setWalletError(false);
    if (!openRechargeModal || !currentUser.id) return;
    const client = stagingBackend;
    if (!client) { setWalletError(true); return; }
    let active = true;
    let request = 0;
    const refresh = async () => {
      const version = ++request;
      const { data, error } = await client.from('wallets').select('coins,diamonds').eq('user_id', currentUser.id).maybeSingle();
      if (!active || version !== request) return;
      const coins = Number(data?.coins), diamonds = Number(data?.diamonds);
      if (error || !Number.isSafeInteger(coins) || !Number.isSafeInteger(diamonds) || coins < 0 || diamonds < 0) {
        setWalletError(true);
        setWallet(undefined);
      } else { setWallet({ coins, diamonds }); setWalletError(false); }
    };
    void refresh();
    const channel = client.channel('recharge-wallet:' + currentUser.id).on('postgres_changes', {
      event: '*', schema: 'public', table: 'wallets', filter: 'user_id=eq.' + currentUser.id,
    }, refresh).subscribe();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('totichat:wallet-changed', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('totichat:wallet-changed', refresh); void client.removeChannel(channel); };
  }, [openRechargeModal, currentUser.id]);

  useEffect(() => {
    if (!openRechargeModal || !showHistoryModal) return;
    let active = true;
    setHistory(undefined);
    setHistoryError(false);
    void fetchRechargeHistory(currentUser.id).then(rows => { if (active) setHistory(rows); })
      .catch(() => { if (active) setHistoryError(true); });
    return () => { active = false; };
  }, [openRechargeModal, showHistoryModal, currentUser.id]);
  useEffect(() => {
    if (!openRechargeModal || activeTab !== 'coins' || rechargeMode !== 'app') return;
    let active = true;
    setPackagesLoading(true);
    setPackagesError('');
    void (async () => {
      if (!stagingBackend) throw new Error('خدمة باقات الشحن غير متاحة');
      const { data, error } = await stagingBackend.from('recharge_packages')
        .select('id,price_usd,gold_amount').eq('is_active', true).order('price_usd');
      if (error) throw error;
      const rows = (data ?? [])
        .filter(row => Number.isFinite(Number(row.gold_amount)) && Number(row.gold_amount) > 0 && Number.isFinite(Number(row.price_usd)) && Number(row.price_usd) > 0)
        .map(row => ({ id: String(row.id), coins: Number(row.gold_amount), price: `${Number(row.price_usd).toFixed(2)} $` }));
      if (active) {
        setPackPage(0);
        setRechargePacks(rows);
        setSelectedPack(rows[0] ?? null);
      }
    })().catch(error => {
      if (active) {
        setRechargePacks([]);
        setSelectedPack(null);
        setPackagesError(error instanceof Error ? error.message : 'تعذر تحميل باقات الشحن');
      }
    }).finally(() => { if (active) setPackagesLoading(false); });
    return () => { active = false; };
  }, [openRechargeModal, activeTab, rechargeMode]);

  useEffect(() => {
    if (!openRechargeModal || rechargeMode !== 'agents') return;
    let active = true;
    let request = 0;
    setAgentsLoading(true);
    setContactError('');
    const refresh = async () => {
      const version = ++request;
      try {
        const rows = await fetchRechargeAgents();
        if (!active || version !== request) return;
        setRechargeAgents(rows);
        setAgentsError('');
      } catch {
        if (!active || version !== request) return;
        setRechargeAgents([]);
        setAgentsError('تعذر تحميل وكلاء الشحن.');
      } finally {
        if (active && version === request) setAgentsLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [openRechargeModal, rechargeMode]);

  const exchangeKey = 'totichat:diamond-redemption:' + currentUser.id;
  const [pendingExchange, setPendingExchange] = useState<{ amount: number; coins: number; requestId: string }>();
  const [quote, setQuote] = useState<{ amount: number; coins: number }>();
  const [exchangeError, setExchangeError] = useState('');
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [exchangeBusy, setExchangeBusy] = useState(false);
  const exchangeLock = useRef(false);

  useEffect(() => {
    setPendingExchange(undefined);
    setQuote(undefined);
    setExchangeError('');
    if (!openRechargeModal || !showExchangeModal) return;
    try {
      const saved = localStorage.getItem(exchangeKey);
      if (saved) {
        setPendingExchange(JSON.parse(saved));
        return;
      }
    } catch {
      setExchangeError('تعذر قراءة العملية المحفوظة.');
      return;
    }
    if (!stagingBackend || !Number.isSafeInteger(exchangeAmount) || exchangeAmount < 1) return;
    const client = stagingBackend;
    let active = true;
    const timer = window.setTimeout(async () => {
      const { data, error } = await client.rpc('phase4_preview_redemption', { p_diamonds: exchangeAmount });
      if (!active) return;
      if (error || !Number.isSafeInteger(data?.coins) || data.coins <= 0) {
        setExchangeError(diamondError(error?.message ?? ''));
        return;
      }
      setQuote({ amount: exchangeAmount, coins: data.coins });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [openRechargeModal, showExchangeModal, exchangeAmount, exchangeKey, quoteRetry]);

  const exchangeCoins = pendingExchange?.coins ?? (quote?.amount === exchangeAmount ? quote.coins : undefined);
  if (!openRechargeModal) return null;

  // Trigger Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const contactAgent = async (agency: RechargeAgentCard) => {
    if (contacting) return;
    setContacting(true);
    setContactError('');
    try {
      const [live] = await fetchRechargeAgents(agency.id);
      if (!live || live.ownerId !== agency.ownerId) {
        setContactError('تغير اعتماد هذه الوكالة. اختر وكيلاً متاحاً.');
        return;
      }
      const existing = conversations.find(thread => thread.userId === live.ownerId);
      setOpenRechargeModal(false);
      setOpenChatThread(existing ?? {
        id: 'chat-' + live.ownerId, userId: live.ownerId,
        userName: live.name, userAvatar: live.avatar, isOnline: false,
        lastMessage: '', lastTime: '', unreadCount: 0, messages: [],
      });
    } catch {
      setContactError('تعذر التحقق من حساب الوكيل.');
    } finally { setContacting(false); }
  };

  const handleConvertDiamonds = async () => {
    if (!stagingBackend || exchangeLock.current || exchangeCoins === undefined) return;
    exchangeLock.current = true;
    setExchangeBusy(true);
    setExchangeError('');
    try {
      const intent = pendingExchange ?? { amount: exchangeAmount, coins: exchangeCoins, requestId: crypto.randomUUID() };
      localStorage.setItem(exchangeKey, JSON.stringify(intent));
      setPendingExchange(intent);
      const { data, error } = await stagingBackend.rpc('phase4_redeem_diamonds', {
        p_diamonds: intent.amount,
        p_expected_coins: intent.coins,
        p_request_id: intent.requestId,
      });
      if (error) {
        if (diamondRejections[error.message]) {
          localStorage.removeItem(exchangeKey);
          setPendingExchange(undefined);
          setQuote(undefined);
          if (error.message === 'Redemption quote changed; confirm again') setQuoteRetry(value => value + 1);
          else setExchangeError(diamondError(error.message));
        } else setExchangeError('تعذر تأكيد التحويل. اضغط استرجاع العملية لإعادة الطلب نفسه.');
        return;
      }
      if (data?.status !== 'completed' || !Number.isSafeInteger(data.coins)) {
        setExchangeError('تعذر تأكيد التحويل. اضغط استرجاع العملية.');
        return;
      }
      localStorage.removeItem(exchangeKey);
      setPendingExchange(undefined);
      window.dispatchEvent(new Event('totichat:wallet-changed'));
      setShowExchangeModal(false);
      showToast(`تم تحويل الألماس وإضافة ${data.coins.toLocaleString('ar-IQ-u-nu-latn')} كوينز.`);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.5 } });
    } catch {
      setExchangeError('تعذر إكمال الطلب. جرّب مرة ثانية.');
    } finally {
      exchangeLock.current = false;
      setExchangeBusy(false);
    }
  };

  const agents = rechargeMode === 'agents';
  const diamonds = activeTab === 'diamonds';
  const balance = diamonds ? wallet?.diamonds : wallet?.coins;
  const goBack = () => {
    sounds.playClick();
    if (agents) setRechargeMode('app');
    else setOpenRechargeModal(false);
  };

  return (
    <div className="tu-recharge" dir="rtl">
      <svg width="0" height="0" className="absolute" aria-hidden="true"><CoinDefs /></svg>
      {toastMessage && <div role="status" className="tu-toast"><Check size={16} />{toastMessage}</div>}
      <div className="tu-frame" data-mode={agents ? 'agents' : diamonds ? 'diamonds' : 'packages'}>
        <header className="tu-header">
          <button type="button" aria-label="سجل الشحن" onClick={() => setShowHistoryModal(true)}><FileText /></button>
          <h2><span aria-hidden="true"><CoinStack24500 /></span>شحن العملات<span aria-hidden="true"><CoinStack24500 /></span></h2>
          <button type="button" aria-label="رجوع" onClick={goBack}><ArrowLeft /></button>
        </header>
        <div className="tu-tabs">
          <button type="button" aria-pressed={!diamonds} onClick={() => setActiveTab('coins')}><SmallGoldCoin />عملات معدنية</button>
          <button type="button" aria-pressed={diamonds} onClick={() => setActiveTab('diamonds')}><SmallDiamond />ألماسي</button>
        </div>
        <section className="tu-balance" aria-label="رصيدك الحالي">
          <div><span>رصيدك الحالي</span><strong dir="ltr">{balance?.toLocaleString('en-US') ?? '—'}</strong>
            {balance === undefined && <small>{walletError ? 'تعذر تحميل الرصيد' : 'جارٍ تحميل الرصيد…'}</small>}</div>
          <span className="tu-balance-art" aria-hidden="true">{diamonds ? <BigDiamondGraphic /> : <CoinStack490000 />}</span>
        </section>

        {agents ? <>
          <h3 className="tu-agent-title"><ShieldCheck />وكلاء الشحن المعتمدون</h3>
          <section className="tu-agents" aria-label="وكلاء الشحن المعتمدون">
            {agentsLoading ? <p role="status">جارٍ تحميل الوكلاء…</p> : agentsError ? <p role="alert">{agentsError}</p> :
              rechargeAgents.length === 0 ? <p>لا توجد وكالات شحن معتمدة حالياً.</p> : rechargeAgents.map(agent =>
              <article key={agent.id} className="tu-agent">
                <RechargeAgentFrame avatar={agent.avatar} />
                <div className="tu-agent-identity">
                  <strong>{agent.name}<BadgeCheck aria-label="وكالة معتمدة" /></strong>
                  <bdi>ID: {agent.publicId}</bdi>
                </div>
                <div className="tu-contact"><button type="button" className="tu-green" disabled={contacting || agent.ownerId === currentUser.id}
                  onClick={() => void contactAgent(agent)}><MessageCircle />تواصل</button></div>
              </article>)}
          </section>
          <aside className="tu-info"><Info />{contactError || 'إذا لم يتم شحن العملات خلال 3 دقائق يرجى التواصل مع الوكيل مباشرة.'}</aside>
        </> : diamonds ? <>
          <section className="tu-diamonds tu-info"><Sparkles /><div><h3>تحويل الألماس</h3><p>تُحسب قيمة التحويل حسب مصدر الألماس وتظهر قبل التأكيد.</p></div></section>
          <button type="button" className="tu-green tu-convert" disabled={balance === undefined} onClick={() => setShowExchangeModal(true)}><ArrowRightLeft />تحويل</button>
        </> : <>
          <div className="tu-catalog">
            <section className="tu-packs" aria-label="باقات الشحن">
              {packagesLoading ? <p role="status">جارٍ تحميل باقات الشحن…</p> : packagesError || rechargePacks.length === 0
                ? <p role="status">{packagesError || 'لا توجد باقات نشطة حالياً.'}</p>
                : rechargePacks.slice(packPage * 6, packPage * 6 + 6).map(pack =>
                  <button key={pack.id} type="button" className="tu-pack" aria-pressed={selectedPack?.id === pack.id}
                    onClick={() => { sounds.playClick(); setSelectedPack(pack); }}>
                    {selectedPack?.id === pack.id && <Check className="tu-pack-check" />}
                    <img className="tu-pack-art" src="/assets/recharge/coin-pack.png" alt="" draggable={false} />
                    <strong dir="ltr">{pack.coins.toLocaleString('en-US')}</strong>
                    <bdi>{pack.price}</bdi>
                  </button>)}
            </section>
            {rechargePacks.length > 6 && <nav className="tu-pages" aria-label="صفحات الباقات">
              <button type="button" disabled={packPage === 0} onClick={() => setPackPage(page => page - 1)}>السابق</button>
              <bdi>{packPage + 1} / {Math.ceil(rechargePacks.length / 6)}</bdi>
              <button type="button" disabled={(packPage + 1) * 6 >= rechargePacks.length} onClick={() => setPackPage(page => page + 1)}>التالي</button>
            </nav>}
          </div>
          <div className="tu-actions">
            <button type="button" className="tu-gold" onClick={() => setRechargeMode('agents')}><ChevronLeft />الشحن عبر الوكيل<Headset /></button>
            <button type="button" className="tu-green" disabled aria-describedby="tu-billing-status"><Zap />تأكيد الشحن</button>
          </div>
          <p className="tu-billing-status" id="tu-billing-status">الشراء المباشر غير متاح حالياً</p>
        </>}
      </div>
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <section className="tu-history" role="dialog" aria-label="سجل عمليات الشحن">
            <header><h3>سجل عمليات الشحن</h3><button type="button" aria-label="إغلاق" onClick={() => setShowHistoryModal(false)}><X size={20} /></button></header>
            <div className="tu-history-list">
              {historyError ? <p role="alert">تعذر تحميل سجل الشحن.</p> : !history ? <p role="status">جارٍ تحميل السجل…</p> :
                history.length === 0 ? <p>لا توجد عمليات شحن سابقة.</p> : history.map(row => (
                  <article key={row.id}><strong>{row.coins.toLocaleString('en-US')} عملة</strong>
                    <span>{row.status === 'completed' ? 'ناجحة' : row.status === 'pending' ? 'قيد المراجعة' : 'فاشلة'}</span>
                    <small>{new Date(row.date).toLocaleString('ar-IQ-u-nu-latn')}</small></article>
                ))}
            </div>
          </section>
        </div>
      )}

      {/* =========================================================
          Overlay Modal: Diamonds Exchange Dialog ("تحويل / فك الألماس")
         ========================================================= */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col animate-in zoom-in-95">
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
                  {(wallet?.diamonds ?? 0).toLocaleString('ar-EG-u-nu-latn')} 💎
                </span>
              </div>

              {/* Conversion Rule Note */}
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-3 py-2 text-[11px] text-amber-900 text-center font-bold">
                تظهر قيمة التحويل من الخادم قبل التأكيد.
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
                    { dia: wallet?.diamonds ?? 0, label: 'الكل' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={exchangeBusy || !!pendingExchange}
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
                    type="text" dir="ltr" inputMode="numeric"
                    value={pendingExchange?.amount ?? (exchangeAmount || '')}
                    disabled={exchangeBusy || !!pendingExchange}
                    onChange={(e) => {
                      const value = latinDigits(e.target.value);
                      if (/^[0-9]*$/.test(value)) setExchangeAmount(Number(value));
                    }}
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
                  الكوينز المحصلة بعد التحويل
                </span>
                <span className="text-xl font-black text-emerald-600 block mt-0.5">
                  {exchangeCoins?.toLocaleString('ar-EG-u-nu-latn') ?? '—'} 🪙
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                  (خصم {(pendingExchange?.amount ?? exchangeAmount).toLocaleString('ar-EG-u-nu-latn')} 💎 ➜ إضافة {exchangeCoins?.toLocaleString('ar-EG-u-nu-latn') ?? '—'} 🪙)
                </span>
              </div>
            </div>

            {exchangeError && <p role="alert" className="mb-2 text-sm text-red-700">{exchangeError}</p>}
            <button
              onClick={() => void handleConvertDiamonds()}
              disabled={exchangeBusy || exchangeCoins === undefined}
              className="w-full py-3 bg-gradient-to-r from-[#29B6F6] to-[#0288D1] hover:from-[#26a5df] hover:to-[#0277bd] disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-md active:scale-95 transition"
            >
              {exchangeBusy ? 'جارٍ التحويل…' : pendingExchange ? 'استرجاع العملية' : 'تأكيد فك الألماس'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
