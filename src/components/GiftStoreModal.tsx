import React, { useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Check, ChevronDown, Crown, Gift, Plus } from 'lucide-react';
import './royal-gifts.css';
import { useApp } from '../context/AppContext';
import { EpicGiftArtwork } from './EpicGiftArtwork';
import { SwordArt } from './GiftAnimationOverlay';
import { sounds } from '../utils/audio';

const giftCounts = [1, 7, 17, 77, 777];

export const GiftStoreModal: React.FC = () => {
  const {
    openGiftStore,
    setOpenGiftStore,
    gifts,
    currentUser,
    activeRoom,
    sendGift,
    sendGiftToRoom,
    setOpenRechargeModal,
    selectedGiftReceiver,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('هدية');
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const filteredGifts = gifts.filter(g => g.category === activeCategory);
  const selectedGift = filteredGifts.find(g => g.id === selectedGiftId) ?? filteredGifts[0] ?? null;
  const [selectedCount, setSelectedCount] = useState<number>(1);
  const [receiverId, setReceiverId] = useState<string>();
  const [sendToAll, setSendToAll] = useState(false);
  const [closing, setClosing] = useState(false);
  const requestPending = useRef(false);
  const groupRequestStorage = useRef<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const groupRequestId = useRef<string | null>(null);

  useEffect(() => {
    if (openGiftStore) window.dispatchEvent(new Event('totichat:gift-store-opened'));
  }, [openGiftStore]);

  useEffect(() => {
    if (!openGiftStore || !closing) return;
    const timer = window.setTimeout(() => { setOpenGiftStore(false); setClosing(false); }, 200);
    return () => window.clearTimeout(timer);
  }, [openGiftStore, closing, setOpenGiftStore]);
  useEffect(() => {
    if (!openGiftStore) { setClosing(false); return; }
    let current = true;
    const listener = CapacitorApp.addListener('backButton', () => {
      if (current && !requestPending.current) setClosing(true);
    });
    void listener.catch(() => {});
    return () => { current = false; void listener.then(handle => handle.remove()).catch(() => {}); };
  }, [openGiftStore]);
  useEffect(() => { if (grid.current) grid.current.scrollTop=0; }, [activeCategory]);
  useEffect(() => { setReceiverId(selectedGiftReceiver?.id); }, [selectedGiftReceiver?.id, activeRoom?.id]);
  if (!openGiftStore) return null;

  // Self support receiver option (allowed only from inside room)
  const selfReceiver = {
    id: currentUser.id,
    name: `${currentUser.nickname || currentUser.name} (أنت)`,
    avatar: currentUser.avatar,
    isSelf: true,
  };

  // Receivers list: If inside active room, include room seats/users + self support inside room
  const roomUserReceivers = activeRoom
    ? activeRoom.seats
        .filter((s) => s.user && s.user.id !== currentUser.id)
        .map((s) => ({
          id: s.user!.id,
          name: s.user!.nickname || s.user!.name,
          avatar: s.user!.avatar,
          isSelf: false,
        }))
    : [];

  // When inside active room, include other users plus self-support option
  // Outside room, default to the room host or targeted user without self-support option
  const baseReceivers = activeRoom
    ? [
        ...roomUserReceivers,
        selfReceiver, // available inside room only
      ]
    : [];

  const receivers = selectedGiftReceiver
    ? [
        {
          ...selectedGiftReceiver,
          isSelf: selectedGiftReceiver.id === currentUser.id,
        },
        ...baseReceivers.filter((r) => r.id !== selectedGiftReceiver.id),
      ]
    : baseReceivers;

  const currentReceiver = receivers.find(receiver => receiver.id === receiverId) ?? receivers[0] ?? null;
  const effectiveGroup = sendToAll && Boolean(activeRoom);
  const recipientCount = effectiveGroup ? roomUserReceivers.length : currentReceiver ? 1 : 0;
  const totalCost = selectedGift ? selectedGift.price * selectedCount * recipientCount : 0;
  const hasEnoughCoins = Number.isSafeInteger(totalCost) && totalCost > 0 && totalCost <= currentUser.coins;

  const handleSend = async () => {
    if (requestPending.current || closing) return;
    if (!selectedGift || (effectiveGroup ? roomUserReceivers.length === 0 : !currentReceiver?.id)) {
      window.alert('لا توجد هدية أو مستلم متاح. حاول مجدداً بعد تحميل البيانات.');
      return;
    }
    if (!Number.isSafeInteger(totalCost) || totalCost <= 0) {
      window.alert('مبلغ الهدية غير صالح.');
      return;
    }
    if (!hasEnoughCoins) {
      window.alert('رصيدك غير كافٍ لهذه الكمية. يرجى الشحن أو تقليل العدد.');
      return;
    }
    sounds.playClick();
    requestPending.current = true;
    setSending(true);
    let groupRequestStorageKey: string | null = null;
    try {
      let success: boolean;
      const recipientKey = effectiveGroup ? roomUserReceivers.map(receiver=>receiver.id).sort().join(',') : currentReceiver!.id;
      groupRequestStorageKey = `totichat:gift-intent:${currentUser.id}:${activeRoom?.id}:${selectedGift.id}:${selectedGift.price}:${selectedCount}:${recipientKey}`;
      if (groupRequestStorage.current !== groupRequestStorageKey) {
        groupRequestStorage.current = groupRequestStorageKey;
        groupRequestId.current = null;
      }
      if (!groupRequestId.current) {
        groupRequestId.current = crypto.randomUUID();
        try {
          const saved = localStorage.getItem(groupRequestStorageKey);
          if (saved && /^[0-9a-f-]{36}$/i.test(saved)) groupRequestId.current = saved;
          localStorage.setItem(groupRequestStorageKey, groupRequestId.current);
        } catch { /* keep the retry identifier for this session */ }
      }
      if (effectiveGroup) success = await sendGiftToRoom(selectedGift,roomUserReceivers,selectedCount,groupRequestId.current);
      else success = await sendGift(selectedGift,currentReceiver!,selectedCount,groupRequestId.current);
      if (success) {
        if (groupRequestStorageKey) {
          try { localStorage.removeItem(groupRequestStorageKey); } catch { /* browser storage may be unavailable */ }
        }
        groupRequestId.current = null;
        setClosing(true);
      }
    } catch (error) {
      console.error('Gift sheet send handler failed:', error);
      window.alert('تعذر إكمال إرسال الهدية. افحص رصيدك وسجل العمليات قبل إعادة المحاولة.');
    } finally {
      requestPending.current = false;
      setSending(false);
    }
  };


  return <div className="royal-gift-layer" dir="rtl">
    <button className="royal-gift-dismiss" type="button" aria-label="إغلاق صندوق الهدايا" disabled={sending}
      onClick={()=>setClosing(true)}/>
    <section role="dialog" aria-label="إرسال الهدايا" className="royal-gift-sheet" data-closing={closing}
      onKeyDown={event=>{if(event.key==='Escape'&&!sending)setClosing(true);}}>
      <header className="royal-gift-heading">
        <Crown className="royal-gift-crown" aria-hidden="true"/><button type="button" aria-label="إغلاق" disabled={sending} onClick={()=>setClosing(true)}><ChevronDown size={18}/></button>
        <h2><Gift size={16} aria-hidden="true"/> إرسال الهدايا</h2>
      </header>
      <div className="royal-gift-tabs" aria-label="أقسام الهدايا">
        {['هدية','الأمة','مخصص','حظ','CP'].map(category=><button type="button" key={category}
          disabled={sending} aria-pressed={activeCategory===category} onClick={()=>{setActiveCategory(category);setSelectedGiftId(null);}}>{category}</button>)}
      </div>
      <div className="royal-gift-recipients">
        {!effectiveGroup && <label>
          المستلم
          <select aria-label="مستلم الهدية" value={currentReceiver?.id??''} disabled={sending||receivers.length===0}
            onChange={event=>setReceiverId(event.target.value)}>
            {receivers.length===0 && <option value="">لا يوجد مستلم</option>}
            {receivers.map(receiver=><option key={receiver.id} value={receiver.id}>{receiver.name}</option>)}
          </select>
        </label>}
        {!effectiveGroup && currentReceiver?.avatar && <img src={currentReceiver.avatar} alt="" />}
        {(roomUserReceivers.length>0||effectiveGroup) && <button type="button" disabled={sending} aria-pressed={effectiveGroup} onClick={()=>setSendToAll(value=>!value)}>
          إلى الجميع ({roomUserReceivers.length})
        </button>}
      </div>
      <div className="royal-gift-grid" ref={grid}>
        {!filteredGifts.length && <p role="status">لا توجد هدايا متاحة في هذا القسم حالياً.</p>}
        {filteredGifts.map(gift=>{
          const selected = selectedGift?.id===gift.id;
          const epicKind = gift.id==='epic-imperial-falcon'?'falcon':gift.id==='epic-royal-throne'?'throne':
            gift.id==='epic-legendary-dragon'?'dragon':gift.id==='epic-royal-jet'?'jet':gift.id==='epic-royal-lovers-heart'?'heart':null;
          const image = gift.assetUrl && /\.(?:png|jpg|jpeg|webp|gif|avif|svg)(?:[?#]|$)/i.test(gift.assetUrl);
          return <button type="button" className="royal-gift-card" aria-pressed={selected} key={gift.id} disabled={sending}
            onClick={()=>setSelectedGiftId(gift.id)}>
            {selected&&<Check className="royal-gift-check" size={15} aria-hidden="true"/>}
            <span className="royal-gift-art" aria-hidden="true">{image?<img src={gift.assetUrl} alt="" loading="lazy" decoding="async"/>:
              gift.id==='epic-zulfiqar'?<SwordArt/>:epicKind?<EpicGiftArtwork kind={epicKind}/>:gift.icon}</span>
            <strong>{gift.name}</strong><bdi>{gift.price.toLocaleString('en-US')} 🪙</bdi>
          </button>;
        })}
      </div>
      <footer className="royal-gift-footer">
        <div className="royal-gift-totals"><span>الرصيد <bdi>{currentUser.coins.toLocaleString('en-US')}</bdi></span>
          <span>الإجمالي <bdi>{totalCost.toLocaleString('en-US')}</bdi></span>
          {totalCost>0&&!hasEnoughCoins&&<span role="status">الرصيد غير كافٍ</span>}</div>
        <div className="royal-gift-send">
          <button type="button" disabled={sending} onClick={()=>{setOpenGiftStore(false);setOpenRechargeModal(true);}}><Plus size={14}/> شحن</button>
          <select aria-label="كمية الهدية" value={selectedCount} disabled={sending} onChange={event=>setSelectedCount(Number(event.target.value))}>
            {giftCounts.map(count=><option key={count} value={count}>×{count}</option>)}
          </select>
          <button type="button" className="royal-gift-submit" onClick={()=>void handleSend()}
            disabled={sending||closing||!activeRoom||!hasEnoughCoins}>{sending?'جارٍ الإرسال…':'إرسال'}</button>
        </div>
      </footer>
    </section>
  </div>;
};
