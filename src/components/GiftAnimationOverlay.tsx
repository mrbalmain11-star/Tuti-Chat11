import React, { useEffect, useState } from 'react';
import { GiftLottieAnimation } from './GiftLottieAnimation';
import { X } from 'lucide-react';
import { EpicGiftArtwork } from './EpicGiftArtwork';
import { useApp } from '../context/AppContext';

type EpicStyle = 'zulfiqar' | 'falcon' | 'throne' | 'dragon' | 'jet' | 'heart' | 'castle' | 'tree' | 'cosmos' | 'ship';
const epicStyles: Record<EpicStyle, { names: string[]; color: string; icon: string }> = {
  zulfiqar: { names: ['ذو الفقار', 'ذوالفقار', 'zulfiqar'], color: '#44df9b', icon: '⚔️' },
  falcon: { names: ['الصقر الإمبراطوري', 'imperial falcon'], color: '#f9cf6e', icon: '🦅' },
  throne: { names: ['عرش الملوك', 'royal throne'], color: '#ffd47b', icon: '👑' },
  dragon: { names: ['التنين الأسطوري', 'legendary dragon'], color: '#ff9154', icon: '🐉' },
  jet: { names: ['الطائرة الملكية', 'royal jet'], color: '#a7d9ff', icon: '✈️' },
  heart: { names: ['قلب العشاق الملكي', 'royal lovers'], color: '#ff78ae', icon: '💖' },
  castle: { names: ['قلعة الأحلام'], color: '#e6bfff', icon: '🏰' },
  tree: { names: ['شجرة الحياة'], color: '#ffce68', icon: '🌳' },
  cosmos: { names: ['قلب الكون'], color: '#d68aff', icon: '💜' },
  ship: { names: ['سفينة الحب الملكية'], color: '#8ddcff', icon: '⛵' },
};

function getEpicStyle(name: string): EpicStyle | null {
  const normalized = name.trim().toLocaleLowerCase();
  for (const [key, style] of Object.entries(epicStyles) as [EpicStyle, typeof epicStyles[EpicStyle]][]) {
    if (style.names.some(n => normalized.includes(n))) return key;
  }
  return null;
}

export const SwordArt: React.FC = () => (
  <svg className="toti-sword" viewBox="0 0 220 440" role="img" aria-label="سيف ذو الفقار" style={{ width: 'min(45vw,220px)', height: 'min(56vh,440px)', filter: 'drop-shadow(0 0 25px #29d780)' }}>
    <defs>
      <linearGradient id="totiBlade" x1="0" x2="1">
        <stop stopColor="#6a777a"/><stop offset=".27" stopColor="#fefce4"/><stop offset=".55" stopColor="#aabdc0"/><stop offset="1" stopColor="#f6dd9a"/>
      </linearGradient>
      <linearGradient id="totiHilt" x1="0" x2="1"><stop stopColor="#77500e"/><stop offset=".5" stopColor="#ffe59d"/><stop offset="1" stopColor="#865611"/></linearGradient>
    </defs>
    <path d="M100 125 L120 125 L120 326 L151 390 L126 376 L111 407 L94 376 L69 390 L100 326 Z" fill="url(#totiBlade)" stroke="#f9d77e" strokeWidth="4"/>
    <path d="M110 139 L110 365" stroke="#fff8d7" strokeWidth="2" opacity=".8"/>
    <path d="M51 118 Q110 89 169 118 L166 136 Q110 118 54 136 Z" fill="url(#totiHilt)" stroke="#fff0ac" strokeWidth="3"/>
    <path d="M102 24 L118 24 L118 110 L102 110 Z" fill="url(#totiHilt)" stroke="#f8db84" strokeWidth="3"/>
    <circle cx="110" cy="20" r="16" fill="#1cc979" stroke="#ffe7a3" strokeWidth="5"/>
    <path d="M110 146 L110 317" stroke="#18bb7b" strokeWidth="2" opacity=".7"/>
  </svg>
);

const GiftAssetStage: React.FC<{ url: string; name: string }> = ({ url, name }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="text-7xl text-amber-200">🎁</div>;
  return (
    <div className="w-[min(85vw,420px)] h-[min(65vh,520px)]">
      <GiftLottieAnimation url={url} onFailure={() => setFailed(true)} />
      <span className="sr-only">{name}</span>
    </div>
  );
};

const ConfirmedGiftBanner: React.FC<{ sender: string; receiver: string; giftName: string; total: number }> = ({ sender, receiver, giftName, total }) => (
  <div className="pointer-events-none absolute top-[max(12%,env(safe-area-inset-top))] inset-x-4 z-10 flex justify-center" dir="rtl" aria-live="polite">
    <div className="w-full max-w-sm rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-[#063d32]/95 via-[#0a634b]/95 to-[#073629]/95 px-4 py-3 text-center shadow-[0_8px_30px_rgba(203,155,53,.35)]">
      <div className="text-xs font-black text-amber-100 truncate">{sender} أهدى إلى {receiver}</div>
      <div className="mt-1 text-sm font-black text-[#ffe6a0] truncate">{giftName} · {total.toLocaleString('ar-IQ')} عملة</div>
    </div>
  </div>
);

export const GiftAnimationOverlay: React.FC = () => {
  const { activeGiftAnimation, clearGiftAnimation } = useApp();
  useEffect(() => {
    if (!activeGiftAnimation) return;
    const name = activeGiftAnimation.gift.name;
    const isEpic = getEpicStyle(name) !== null && activeGiftAnimation.gift.price >= 10000;
    const hasOriginalJson = activeGiftAnimation.gift.assetFormat === 'json' && !!activeGiftAnimation.gift.assetUrl;
    const timer = window.setTimeout(clearGiftAnimation, (isEpic || hasOriginalJson) ? 7000 : 3500);
    return () => window.clearTimeout(timer);
  }, [activeGiftAnimation, clearGiftAnimation]);

  if (!activeGiftAnimation) return null;
  const { gift, sender, receiver, count } = activeGiftAnimation;
  const epic = gift.price >= 10000 ? getEpicStyle(gift.name) : null;
  const style = epic ? epicStyles[epic] : null;
  const confirmedTotal = Number.isSafeInteger(gift.price * count) ? gift.price * count : 0;
  const showPremiumBanner = confirmedTotal >= 7000;
  // Prefer the original hosted JSON animation; existing gifts retain their legacy visuals.
  if (gift.assetFormat === 'json' && gift.assetUrl) {
    return (
      <div className="fixed inset-0 z-[80] pointer-events-none flex flex-col items-center justify-center bg-black/75">
        {showPremiumBanner && <ConfirmedGiftBanner sender={sender} receiver={receiver} giftName={gift.name} total={confirmedTotal} />}
        <GiftAssetStage key={gift.id + gift.assetUrl} url={gift.assetUrl} name={gift.name} />
        <div className="text-amber-200 font-bold text-center mt-2" dir="rtl">{sender} أهدى {gift.name} إلى {receiver} ×{count}</div>
        <button type="button" onClick={clearGiftAnimation} className="pointer-events-auto absolute right-4 top-10 rounded-full bg-black/70 text-white p-2" aria-label="إغلاق"><X size={18}/></button>
      </div>
    );
  }


  if (!epic || !style) {
    return (
      <div className="fixed inset-0 z-[80] pointer-events-none flex items-center justify-center font-['Cairo',sans-serif]">
        {showPremiumBanner && <ConfirmedGiftBanner sender={sender} receiver={receiver} giftName={gift.name} total={confirmedTotal} />}
        <div className="relative rounded-3xl border border-amber-400/60 bg-[#1c1327]/95 px-8 py-6 text-center shadow-2xl">
          <button type="button" onClick={clearGiftAnimation} aria-label="إغلاق تأثير الهدية" className="pointer-events-auto absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/60 bg-[#24182b] text-white"><X size={18}/></button>
          <div className="text-6xl mb-3">{gift.icon}</div>
          <div className="text-amber-200 font-black">{gift.name} ×{count}</div>
          <div className="text-white text-xs mt-2">{sender} أهدى إلى {receiver}</div>
        </div>
      </div>
    );
  }

  return (
    <div key={gift.id + sender + receiver} className="fixed inset-0 z-[80] pointer-events-none overflow-hidden font-['Cairo',sans-serif] toti-epic-stage" style={{ ['--epic-glow' as string]: style.color }} aria-live="polite">
      <style>{`
        @keyframes totiVeil { 0% {opacity:0} 12%,82% {opacity:1} 100% {opacity:0} }
        @keyframes totiSword { 0% {transform:translateY(-110vh) rotate(-12deg) scale(.6);opacity:0} 22% {transform:translateY(0) rotate(3deg) scale(1.08);opacity:1} 35%,80% {transform:translateY(0) rotate(0) scale(1);opacity:1} 100% {transform:translateY(-12vh) scale(1.3);opacity:0} }
        @keyframes totiFalcon { 0% {transform:translate(-80vw,45vh) rotate(-20deg) scale(.3);opacity:0} 30% {transform:translate(0,0) rotate(0) scale(1.25);opacity:1} 75% {transform:translate(0,0) scale(1.05);opacity:1} 100% {transform:translate(85vw,-35vh) scale(.4);opacity:0} }
        @keyframes totiThrone { 0% {transform:translateY(80vh) scale(.45);opacity:0} 32% {transform:translateY(0) scale(1.15);opacity:1} 75% {transform:scale(1);opacity:1} 100% {transform:scale(1.4);opacity:0} }
        @keyframes totiDragon { 0% {transform:translate(85vw,-55vh) rotate(25deg) scale(.3);opacity:0} 32% {transform:translate(0,0) rotate(-7deg) scale(1.2);opacity:1} 72% {transform:translate(0,0) scale(1.1);opacity:1} 100% {transform:translate(-80vw,-30vh) rotate(-20deg) scale(.5);opacity:0} }
        @keyframes totiJet { 0% {transform:translate(-100vw,45vh) rotate(-12deg) scale(.4);opacity:0} 35% {transform:translate(0,0) rotate(-8deg) scale(1.15);opacity:1} 70% {transform:translate(0,0) rotate(-8deg);opacity:1} 100% {transform:translate(100vw,-50vh) scale(.45);opacity:0} }
        @keyframes totiHeart { 0% {transform:scale(.1) rotate(-25deg);opacity:0} 32% {transform:scale(1.3) rotate(5deg);opacity:1} 45%,80% {transform:scale(1);opacity:1} 100% {transform:scale(1.8);opacity:0} }
        @keyframes totiCastle { 0% {transform:translateY(80vh) scale(.2);opacity:0} 35%,78% {transform:translateY(0) scale(1.1);opacity:1} 100% {transform:scale(1.6);opacity:0} }
        @keyframes totiTree { 0% {transform:scale(.1) rotate(-10deg);opacity:0} 38%,75% {transform:scale(1.2) rotate(0);opacity:1} 100% {transform:scale(1.7);opacity:0} }
        @keyframes totiCosmos { 0% {transform:scale(.2) rotate(-120deg);opacity:0} 40%,78% {transform:scale(1.15) rotate(0);opacity:1} 100% {transform:scale(1.6) rotate(45deg);opacity:0} }
        @keyframes totiShip { 0% {transform:translateX(-95vw) rotate(-12deg) scale(.5);opacity:0} 38%,75% {transform:translateX(0) rotate(0) scale(1.2);opacity:1} 100% {transform:translateX(95vw) scale(.7);opacity:0} }
        @keyframes totiSparks { 0% {transform:translate3d(0,15vh,0) scale(.3);opacity:0} 30% {opacity:1} 100% {transform:translate3d(var(--dx),-55vh,0) scale(0);opacity:0} }
        @keyframes totiShine { 0%,100% {opacity:.4;transform:scale(.85)} 50% {opacity:1;transform:scale(1.2)} }
        @keyframes totiTicker { 0% {transform:translateX(120vw);opacity:0} 10%,80% {transform:translateX(0);opacity:1} 100% {transform:translateX(-120vw);opacity:0} }
        .toti-epic-stage {animation:totiVeil 7s ease both;background:radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--epic-glow) 23%,#090d1b),#030711 80%)}
        .toti-epic-art {animation:totiSword 7s ease-in-out both;filter:drop-shadow(0 0 35px var(--epic-glow));will-change:transform,opacity}
        .toti-epic-falcon {animation-name:totiFalcon}.toti-epic-throne {animation-name:totiThrone}.toti-epic-dragon {animation-name:totiDragon}.toti-epic-jet {animation-name:totiJet}.toti-epic-heart {animation-name:totiHeart}
        .toti-epic-castle{animation-name:totiCastle}.toti-epic-tree{animation-name:totiTree}.toti-epic-cosmos{animation-name:totiCosmos}.toti-epic-ship{animation-name:totiShip}
        .toti-epic-halo {animation:totiShine 2.3s ease-in-out infinite;box-shadow:0 0 90px 50px var(--epic-glow);opacity:.25}
        .toti-epic-ticker {animation:totiTicker 7s ease-in-out both}
        @media(prefers-reduced-motion:reduce){.toti-epic-art,.toti-epic-ticker,.toti-epic-stage{animation:none}.toti-epic-halo{animation:none}}
      `}</style>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({length:24},(_,i)=><span key={i} className="absolute rounded-full bg-amber-200" style={{left:`${(i*43+17)%100}%`,top:`${(i*29+31)%100}%`,width:i%3===0?6:3,height:i%3===0?6:3,boxShadow:'0 0 14px var(--epic-glow)',animation:`totiSparks ${2+(i%4)}s ease-out ${(i%7)*.28}s infinite`,['--dx' as string]:`${((i*17)%90)-45}vw`}} />)}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="toti-epic-halo absolute w-32 h-32 rounded-full" />
        <div className={`toti-epic-art relative flex flex-col items-center justify-center ${epic !== 'zulfiqar' ? 'toti-epic-' + epic : ''}`}>
          {epic === 'zulfiqar' ? <SwordArt /> : ['castle','tree','cosmos','ship'].includes(epic) ? <div role="img" aria-label={gift.name} className="text-[min(42vw,180px)] drop-shadow-[0_0_40px_var(--epic-glow)]">{style.icon}</div> : <EpicGiftArtwork kind={epic as 'falcon' | 'throne' | 'dragon' | 'jet' | 'heart'} />}
          {epic === 'zulfiqar' && <div dir="rtl" className="text-center text-sm sm:text-base font-black text-amber-200 max-w-[90vw] mt-2" style={{textShadow:'0 0 14px #36df93'}}>لا فتى إلا علي ولا سيف إلا ذو الفقار</div>}
          {epic === 'jet' && <div dir="rtl" className="text-xl font-black text-white mt-4">{receiver}</div>}
          {epic === 'heart' && <div dir="rtl" className="text-lg font-black text-rose-100 mt-4">{sender} ♥ {receiver}</div>}
        </div>
      </div>
      <div className="toti-epic-ticker absolute top-[max(12%,env(safe-area-inset-top))] inset-x-4 flex justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-amber-300 bg-[#131225]/95 px-4 py-3 text-center shadow-[0_0_28px_var(--epic-glow)]" dir="rtl">
          <div className="text-amber-100 text-xs font-black truncate">{sender} أهدى إلى {receiver}</div>
          <div className="text-amber-300 text-sm font-black mt-1">{gift.name} ×{count} · {(gift.price * count).toLocaleString('en-US')} 🪙</div>
        </div>
      </div>
      <button type="button" onClick={clearGiftAnimation} aria-label="إغلاق تأثير الهدية" className="pointer-events-auto absolute top-[max(5%,env(safe-area-inset-top))] right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white"><X size={18}/></button>
    </div>
  );
};
